// Package stats records PAYG cache hits from upstream usage JSON.
// In-memory only; never stores request bodies, keys, or headers.
package stats

import (
	"encoding/json"
	"strconv"
	"strings"
	"sync"

	"github.com/SaniaAnees/dECODED/internal/provider"
)

// Cost model (V1 estimate, not a bill).
// Anthropic cache-read ≈ 0.1× list input. Savings vs full input = 0.9× $3/MTok (Sonnet-class).
// OpenAI cached ≈ 0.5× input. Groq: costSaved stays 0.
const (
	anthropicInputUSDPerMTok   = 3.0
	anthropicCacheReadFraction = 0.1
	openaiInputUSDPerMTok      = 2.50
	openaiCacheReadFraction    = 0.5
)

// Usage is one upstream response's cache counters.
type Usage struct {
	ReadTokens  int64
	WriteTokens int64
	InputTokens int64 // prompt / input tokens; used for cache %
	Shape       provider.Shape
	NoCost      bool // Groq and similar: count hits, do not estimate USD
}

// Snapshot is a point-in-time view for GET /stats and `decoded stats`.
type Snapshot struct {
	Requests    int64   `json:"requests"`
	Hits        int64   `json:"hits"`
	HitRate     float64 `json:"hitRate"`
	CachePct    float64 `json:"cachePct"` // 0–100, cached tokens / prompt tokens
	TokensSaved int64   `json:"tokensSaved"`
	CostSaved   float64 `json:"costSaved"`
}

// Store is process-local. Safe for concurrent Record.
type Store struct {
	mu           sync.Mutex
	requests     int64
	hits         int64
	tokensSaved  int64
	promptTokens int64
	costSaved    float64
}

func New() *Store {
	return &Store{}
}

func (s *Store) Record(u Usage) {
	if s == nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.requests++
	if u.InputTokens > 0 {
		s.promptTokens += u.InputTokens
	}
	if u.ReadTokens > 0 {
		s.hits++
		s.tokensSaved += u.ReadTokens
		if !u.NoCost {
			s.costSaved += estimateUSD(u.Shape, u.ReadTokens)
		}
	}
}

func (s *Store) Snapshot() Snapshot {
	if s == nil {
		return Snapshot{}
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	out := Snapshot{
		Requests:    s.requests,
		Hits:        s.hits,
		TokensSaved: s.tokensSaved,
		CostSaved:   s.costSaved,
	}
	if s.requests > 0 {
		out.HitRate = float64(s.hits) / float64(s.requests)
	}
	if s.promptTokens > 0 {
		out.CachePct = 100 * float64(s.tokensSaved) / float64(s.promptTokens)
	}
	return out
}

func estimateUSD(shape provider.Shape, tokens int64) float64 {
	if tokens <= 0 {
		return 0
	}
	m := float64(tokens) / 1e6
	switch shape {
	case provider.ShapeAnthropic:
		return m * anthropicInputUSDPerMTok * (1 - anthropicCacheReadFraction)
	case provider.ShapeOpenAI, provider.ShapeResponses:
		return m * openaiInputUSDPerMTok * (1 - openaiCacheReadFraction)
	default:
		return 0
	}
}

// FromResponse reads cache counters from a JSON body (or SSE tail) and headers.
func FromResponse(body []byte, hdr map[string][]string, prof provider.UsageProfile) Usage {
	u := Usage{}
	u.ReadTokens, u.WriteTokens = fromJSON(body, prof)
	if u.ReadTokens == 0 {
		u.ReadTokens = firstPositive(body, geminiHitPaths)
	}
	u.InputTokens = inputTokens(body)
	if u.ReadTokens == 0 {
		if n := headerInt(hdr, "Fireworks-Cached-Prompt-Tokens"); n > 0 {
			u.ReadTokens = n
		}
	}
	return u
}

var geminiHitPaths = []string{
	"usageMetadata.cachedContentTokenCount",
	"usageMetadata.cached_content_token_count",
	"usage.cachedContentTokenCount",
	"usage.cached_content_token_count",
}

func fromJSON(raw []byte, prof provider.UsageProfile) (read, write int64) {
	read = firstPositive(raw, prof.HitPaths)
	write = firstPositive(raw, prof.WritePaths)
	if read > 0 || write > 0 {
		return read, write
	}
	for _, line := range strings.Split(string(raw), "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		payload := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if payload == "" || payload == "[DONE]" {
			continue
		}
		b := []byte(payload)
		if n := firstPositive(b, prof.HitPaths); n > read {
			read = n
		}
		if n := firstPositive(b, prof.WritePaths); n > write {
			write = n
		}
	}
	return read, write
}

func inputTokens(raw []byte) int64 {
	paths := []string{"usage.prompt_tokens", "usage.input_tokens", "usageMetadata.promptTokenCount"}
	if n := firstPositive(raw, paths); n > 0 {
		return n
	}
	for _, line := range strings.Split(string(raw), "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		payload := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if payload == "" || payload == "[DONE]" {
			continue
		}
		if n := firstPositive([]byte(payload), paths); n > 0 {
			return n
		}
	}
	return 0
}

func firstPositive(raw []byte, paths []string) int64 {
	if len(raw) == 0 || len(paths) == 0 {
		return 0
	}
	var v any
	if err := json.Unmarshal(raw, &v); err != nil {
		return 0
	}
	for _, p := range paths {
		if n := numberAt(v, p); n > 0 {
			return n
		}
	}
	return 0
}

func numberAt(v any, dotted string) int64 {
	cur := v
	for _, part := range strings.Split(dotted, ".") {
		m, ok := cur.(map[string]any)
		if !ok {
			return 0
		}
		cur, ok = m[part]
		if !ok {
			return 0
		}
	}
	return asInt64(cur)
}

func asInt64(v any) int64 {
	switch t := v.(type) {
	case float64:
		return int64(t)
	case json.Number:
		n, _ := t.Int64()
		return n
	case int64:
		return t
	case int:
		return int64(t)
	case string:
		n, _ := strconv.ParseInt(t, 10, 64)
		return n
	default:
		return 0
	}
}

func headerInt(hdr map[string][]string, key string) int64 {
	if hdr == nil {
		return 0
	}
	vals, ok := hdr[key]
	if !ok || len(vals) == 0 {
		// Canonical MIME header keys
		for k, vs := range hdr {
			if strings.EqualFold(k, key) && len(vs) > 0 {
				vals = vs
				break
			}
		}
	}
	if len(vals) == 0 {
		return 0
	}
	n, _ := strconv.ParseInt(strings.TrimSpace(vals[0]), 10, 64)
	return n
}
