package proxy

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/SaniaAnees/dECODED/internal/provider"
)

// Headers we copy to upstream. Never log their values.
var forwardHeaderNames = []string{
	"Authorization",
	"X-Api-Key",
	"Anthropic-Version",
	"Anthropic-Beta",
	"Content-Type",
	"OpenAI-Beta",
	"OpenAI-Organization",
	"OpenAI-Project",
	"HTTP-Referer",
	"Referer",
	"X-Title",
	"X-Goog-Api-Key",
	"X-Session-Id",
	"X-Session-Affinity",
}

var hopByHop = map[string]bool{
	"Connection":          true,
	"Keep-Alive":          true,
	"Proxy-Authenticate":  true,
	"Proxy-Authorization": true,
	"Te":                  true,
	"Trailers":            true,
	"Transfer-Encoding":   true,
	"Upgrade":             true,
}

func copyForwardHeaders(dst, src http.Header) {
	for _, name := range forwardHeaderNames {
		if v := src.Get(name); v != "" {
			dst.Set(name, v)
		}
	}
}

func ensureBearerAuth(h http.Header) {
	if bearerToken(h.Get("Authorization")) != "" {
		return
	}
	key := strings.TrimSpace(h.Get("X-Api-Key"))
	if key == "" {
		key = strings.TrimSpace(h.Get("X-Goog-Api-Key"))
	}
	if key == "" {
		return
	}
	if len(key) >= 7 && strings.EqualFold(key[:7], "Bearer ") {
		h.Set("Authorization", strings.TrimSpace(key))
		return
	}
	h.Set("Authorization", "Bearer "+key)
}

func bearerToken(auth string) string {
	auth = strings.TrimSpace(auth)
	if len(auth) >= 7 && strings.EqualFold(auth[:7], "Bearer ") {
		return strings.TrimSpace(auth[7:])
	}
	return ""
}

func applyOpenRouterHeaders(h http.Header) {
	base := strings.ToLower(strings.TrimSpace(os.Getenv("DECODED_OPENAI_BASE_URL")))
	if !strings.Contains(base, "openrouter.ai") &&
		!strings.EqualFold(strings.TrimSpace(os.Getenv("DECODED_UPSTREAM_PROFILE")), "openrouter") {
		return
	}
	if h.Get("HTTP-Referer") == "" && h.Get("Referer") == "" {
		h.Set("HTTP-Referer", "http://127.0.0.1:8080")
	}
	if h.Get("X-Title") == "" {
		h.Set("X-Title", "decoded")
	}
}

func copyResponseHeaders(dst, src http.Header) {
	for k, vs := range src {
		if hopByHop[http.CanonicalHeaderKey(k)] {
			continue
		}
		for _, v := range vs {
			dst.Add(k, v)
		}
	}
}

func applyStickyHeaders(dst, src http.Header, body []byte, p provider.Provider, processKey string) {
	key := stickyKey(body, src, processKey)
	for _, f := range p.SessionAffinity.Fields {
		if !isHeaderField(f) {
			continue
		}
		name := http.CanonicalHeaderKey(f)
		if dst.Get(name) == "" {
			dst.Set(name, key)
		}
	}
	if dst.Get("X-Session-Id") == "" {
		dst.Set("X-Session-Id", key)
	}
}

// applySticky adds missing routing keys without re-marshaling nested JSON
// (a full marshal would shuffle keys and bust the KV prefix).
func applySticky(body []byte, src http.Header, p provider.Provider, processKey string) []byte {
	key := stickyKey(body, src, processKey)
	for _, f := range bodyStickyFields(p) {
		if topLevelString(body, f) != "" {
			continue
		}
		body = injectTopLevelString(body, f, key)
	}
	return body
}

func stickyKey(body []byte, src http.Header, processKey string) string {
	if v := src.Get("X-Session-Id"); v != "" {
		return v
	}
	if v := src.Get("X-Session-Affinity"); v != "" {
		return v
	}
	for _, k := range []string{"session_id", "prompt_cache_key", "user"} {
		if v := topLevelString(body, k); v != "" {
			return v
		}
	}
	if processKey != "" {
		return processKey
	}
	return "decoded-local"
}

func bodyStickyFields(p provider.Provider) []string {
	var out []string
	for _, f := range p.SessionAffinity.Fields {
		if isHeaderField(f) {
			continue
		}
		// Official Anthropic Messages rejects unknown top-level keys.
		// session_id is OpenRouter; we send x-session-id instead.
		if f == "session_id" && p.Shape == provider.ShapeAnthropic {
			continue
		}
		// Gemini and Groq OpenAI-compat reject unknown top-level fields.
		if (geminiOpenAICompat() || groqOpenAICompat()) && (f == "prompt_cache_key" || f == "user") {
			continue
		}
		// Mistral Chat Completions allows prompt_cache_key but rejects extra
		// OpenAI fields such as user (422 extra_forbidden).
		if mistralOpenAICompat() && f != "prompt_cache_key" {
			continue
		}
		out = append(out, f)
	}
	return out
}

func isHeaderField(f string) bool {
	return strings.HasPrefix(strings.ToLower(f), "x-")
}

func geminiOpenAICompat() bool {
	base := strings.ToLower(strings.TrimSpace(os.Getenv("DECODED_OPENAI_BASE_URL")))
	return strings.Contains(base, "generativelanguage.googleapis.com") ||
		strings.Contains(base, "/v1beta/openai")
}

func groqOpenAICompat() bool {
	if groqProfile() {
		return true
	}
	base := strings.ToLower(strings.TrimSpace(os.Getenv("DECODED_OPENAI_BASE_URL")))
	return strings.Contains(base, "api.groq.com")
}

func mistralOpenAICompat() bool {
	if strings.EqualFold(strings.TrimSpace(os.Getenv("DECODED_UPSTREAM_PROFILE")), "mistral") {
		return true
	}
	base := strings.ToLower(strings.TrimSpace(os.Getenv("DECODED_OPENAI_BASE_URL")))
	return strings.Contains(base, "api.mistral.ai")
}

func topLevelString(body []byte, key string) string {
	doc, ok := decodeObject(body)
	if !ok {
		return ""
	}
	s, _ := doc[key].(string)
	return s
}

func decodeObject(body []byte) (map[string]any, bool) {
	trimmed := bytes.TrimSpace(body)
	if len(trimmed) == 0 || trimmed[0] != '{' {
		return nil, false
	}
	dec := json.NewDecoder(bytes.NewReader(trimmed))
	dec.UseNumber()
	var v any
	if err := dec.Decode(&v); err != nil {
		return nil, false
	}
	m, ok := v.(map[string]any)
	return m, ok && m != nil
}

func injectTopLevelString(body []byte, key, val string) []byte {
	trimmed := bytes.TrimSpace(body)
	if len(trimmed) < 2 || trimmed[0] != '{' || trimmed[len(trimmed)-1] != '}' {
		return body
	}
	inner := bytes.TrimSpace(trimmed[1 : len(trimmed)-1])
	qk, err1 := json.Marshal(key)
	qv, err2 := json.Marshal(val)
	if err1 != nil || err2 != nil {
		return body
	}
	var b bytes.Buffer
	b.WriteByte('{')
	if len(inner) > 0 {
		b.Write(inner)
		b.WriteByte(',')
	}
	b.Write(qk)
	b.WriteByte(':')
	b.Write(qv)
	b.WriteByte('}')
	return b.Bytes()
}

type tailBuf struct {
	max int
	b   []byte
}

func (t *tailBuf) Write(p []byte) (int, error) {
	t.b = append(t.b, p...)
	if t.max > 0 && len(t.b) > t.max {
		t.b = append([]byte(nil), t.b[len(t.b)-t.max:]...)
	}
	return len(p), nil
}

func (t *tailBuf) bytes() []byte {
	return t.b
}

type flushWriter struct {
	w io.Writer
	f http.Flusher
}

func (f *flushWriter) Write(p []byte) (int, error) {
	n, err := f.w.Write(p)
	f.f.Flush()
	return n, err
}
