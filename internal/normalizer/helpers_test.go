package normalizer

import (
	"bytes"
	"encoding/json"
	"io"
	"testing"

	"github.com/SaniaAnees/dECODED/internal/provider"
)

func clearProviderEnv(t *testing.T) {
	t.Helper()
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", "")
	t.Setenv("DECODED_OPENAI_BASE_URL", "")
	t.Setenv("DECODED_UPSTREAM_PROFILE", "")
	t.Setenv("DECODED_STRIP_CACHE", "")
}

func detectFor(t *testing.T, path string, body []byte) provider.Provider {
	t.Helper()
	clearProviderEnv(t)
	p, err := provider.Detect("http://localhost:8080"+path, body, nil)
	if err != nil {
		t.Fatalf("Detect(%s): %v", path, err)
	}
	return p
}

func parseTestJSON(t *testing.T, body []byte) map[string]any {
	t.Helper()
	dec := json.NewDecoder(bytes.NewReader(bytes.TrimSpace(body)))
	dec.UseNumber()
	var v any
	if err := dec.Decode(&v); err != nil {
		t.Fatalf("parse: %v", err)
	}
	obj, ok := v.(map[string]any)
	if !ok {
		t.Fatalf("parse: not object")
	}
	if _, err := dec.Token(); err != io.EOF {
		t.Fatalf("parse: trailing tokens")
	}
	return obj
}

func mustCanonical(t *testing.T, v any) []byte {
	t.Helper()
	b, err := marshalCanonical(v)
	if err != nil {
		t.Fatalf("marshalCanonical: %v", err)
	}
	return b
}

func normalizeOK(t *testing.T, body []byte, p provider.Provider) []byte {
	t.Helper()
	out, err := Normalize(body, p)
	if err != nil {
		t.Fatalf("Normalize: %v", err)
	}
	if len(out) == 0 {
		t.Fatal("Normalize returned empty")
	}
	return out
}

func assertIdempotent(t *testing.T, body []byte, p provider.Provider) []byte {
	t.Helper()
	out := normalizeOK(t, body, p)
	again, err := Normalize(out, p)
	if err != nil {
		t.Fatalf("second Normalize: %v", err)
	}
	if !bytes.Equal(out, again) {
		t.Fatalf("idempotence failed\nfirst:  %s\nsecond: %s", out, again)
	}
	return out
}

func countCacheControlTest(body []byte) int {
	var v any
	dec := json.NewDecoder(bytes.NewReader(body))
	dec.UseNumber()
	if err := dec.Decode(&v); err != nil {
		return 0
	}
	return countCacheControl(v)
}

func stableSystemText(doc map[string]any) string {
	switch s := doc["system"].(type) {
	case string:
		if isVolatileText(s) {
			return ""
		}
		return s
	case []any:
		var b bytes.Buffer
		for _, block := range s {
			m, ok := block.(map[string]any)
			if !ok || isVolatileBlock(m) {
				continue
			}
			if txt, ok := m["text"].(string); ok {
				if b.Len() > 0 {
					b.WriteByte('\n')
				}
				b.WriteString(txt)
			}
		}
		return b.String()
	default:
		return ""
	}
}

func lastUserContent(doc map[string]any) any {
	msgs, _ := doc["messages"].([]any)
	idx := lastUserIndex(msgs)
	if idx < 0 {
		return nil
	}
	m, _ := msgs[idx].(map[string]any)
	if m == nil {
		return nil
	}
	return m["content"]
}

func assistantContents(doc map[string]any) []any {
	var out []any
	for _, m := range objectsIn(doc["messages"]) {
		if roleOf(m) == "assistant" {
			out = append(out, m["content"])
			if tc, ok := m["tool_calls"]; ok {
				out = append(out, tc)
			}
		}
	}
	return out
}

func toolPayloads(doc map[string]any) []any {
	var out []any
	for _, m := range objectsIn(doc["messages"]) {
		if roleOf(m) == "tool" {
			out = append(out, m["content"])
		}
		for _, b := range objectsIn(m["content"]) {
			t, _ := b["type"].(string)
			if t == "tool_use" || t == "tool_result" {
				out = append(out, b)
			}
		}
	}
	return out
}
