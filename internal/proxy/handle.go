package proxy

import (
	"bytes"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/SaniaAnees/dECODED/internal/gemini"
	"github.com/SaniaAnees/dECODED/internal/normalizer"
	"github.com/SaniaAnees/dECODED/internal/provider"
	"github.com/SaniaAnees/dECODED/internal/stats"
)

func defaultDetect(requestURL string, body []byte, headers http.Header) (provider.Provider, error) {
	return provider.Detect(requestURL, body, headers)
}

func defaultNormalize(body []byte, p provider.Provider) ([]byte, error) {
	return normalizer.Normalize(body, p)
}

func defaultUpstreamURL(shape provider.Shape, path string) string {
	return provider.UpstreamURL(shape, path)
}

func (s *Server) handleAPI(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, int64(maxBody)+1))
	_ = r.Body.Close()
	if err != nil {
		http.Error(w, `{"error":{"type":"proxy_error","message":"read body"}}`, http.StatusBadRequest)
		return
	}
	if len(body) > maxBody {
		http.Error(w, `{"error":{"type":"proxy_error","message":"body too large"}}`, http.StatusRequestEntityTooLarge)
		return
	}

	p, detErr := detect(r.URL.Path, body, r.Header)
	forward := body
	if !geminiNativePath(r.URL.Path) && detErr == nil {
		out, nerr := normalize(body, p)
		if nerr != nil {
			s.log.Printf("normalize failed path=%s", r.URL.Path)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadGateway)
			_, _ = io.WriteString(w, `{"error":{"type":"proxy_error","message":"normalize failed"}}`)
			return
		}
		forward = out
	}

	if !geminiNativePath(r.URL.Path) {
		forward = applySticky(forward, r.Header, p, s.sticky)
	}

	wrote, err := s.roundTrip(w, r, p, forward)
	if err != nil {
		s.log.Printf("upstream error path=%s", r.URL.Path)
		if !wrote {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadGateway)
			_, _ = io.WriteString(w, `{"error":{"type":"proxy_error","message":"upstream failed"}}`)
		}
	}
}

func (s *Server) roundTrip(w http.ResponseWriter, r *http.Request, p provider.Provider, body []byte) (bool, error) {
	target := upstreamURL(p.Shape, r.URL.RequestURI())
	req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, target, bytes.NewReader(body))
	if err != nil {
		return false, err
	}
	copyForwardHeaders(req.Header, r.Header)
	ensureBearerAuth(req.Header)
	applyOpenRouterHeaders(req.Header)
	if req.Header.Get("Content-Type") == "" {
		req.Header.Set("Content-Type", "application/json")
	}
	applyStickyHeaders(req.Header, r.Header, body, p, s.sticky)
	req.ContentLength = int64(len(body))
	req.Host = req.URL.Host

	resp, err := s.client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	s.log.Printf("upstream %s status=%d", target, resp.StatusCode)

	// Door A (OpenAI-compat) first. Door B (native generateContent) only if
	// Google rejected the OpenAI-shaped JSON — not 403/429/success.
	if geminiCompatMaybeShapeFail(r, resp.StatusCode) {
		raw, readErr := io.ReadAll(io.LimitReader(resp.Body, int64(maxBody)+1))
		if readErr != nil {
			return false, readErr
		}
		if geminiOpenAIShapeRejected(resp.StatusCode, raw) {
			s.log.Printf("gemini openai-compat rejected OpenAI-shaped JSON; falling back to generateContent")
			return s.roundTripGeminiBridge(w, r, p, body)
		}
		if resp.StatusCode >= 400 {
			s.log.Printf("upstream error body: %s", truncateForLog(raw, 800))
		}
		copyResponseHeaders(w.Header(), resp.Header)
		w.Header().Del("Content-Length")
		w.Header().Del("Content-Encoding")
		w.WriteHeader(resp.StatusCode)
		_, _ = w.Write(raw)
		s.recordCache(raw, resp.Header, p)
		return true, nil
	}

	copyResponseHeaders(w.Header(), resp.Header)
	w.WriteHeader(resp.StatusCode)

	tail := &tailBuf{max: 64 << 10}
	dst := io.Writer(w)
	if f, ok := w.(http.Flusher); ok {
		dst = &flushWriter{w: w, f: f}
	}
	_, copyErr := io.Copy(io.MultiWriter(dst, tail), resp.Body)

	if resp.StatusCode >= 400 {
		s.log.Printf("upstream error body: %s", truncateForLog(tail.bytes(), 800))
	}

	s.recordCache(tail.bytes(), resp.Header, p)
	return true, copyErr
}

func (s *Server) recordCache(raw []byte, hdr http.Header, p provider.Provider) {
	u := stats.FromResponse(raw, hdr, p.UsageFields)
	u.Shape = p.Shape
	u.NoCost = groqProfile()
	s.Stats.Record(u)
	pct := 0.0
	if u.InputTokens > 0 {
		pct = 100 * float64(u.ReadTokens) / float64(u.InputTokens)
	}
	s.log.Printf("cache %.0f%%  cached=%d  prompt=%d  write=%d", pct, u.ReadTokens, u.InputTokens, u.WriteTokens)

	snap := s.Stats.Snapshot()
	s.log.Printf("── stats  requests=%d  hits=%d  cachePct=%.1f%%  tokensSaved=%d  costSaved=$%.4f",
		snap.Requests, snap.Hits, snap.CachePct, snap.TokensSaved, snap.CostSaved)
}

func geminiCompatMaybeShapeFail(r *http.Request, status int) bool {
	if r == nil || !geminiOpenAICompat() || geminiNativePath(r.URL.Path) {
		return false
	}
	if !strings.Contains(r.URL.Path, "/chat/completions") {
		return false
	}
	return status == http.StatusBadRequest || status == http.StatusUnprocessableEntity
}

func geminiOpenAIShapeRejected(status int, body []byte) bool {
	if status != http.StatusBadRequest && status != http.StatusUnprocessableEntity {
		return false
	}
	s := strings.ToLower(string(body))
	if strings.TrimSpace(s) == "" {
		return false
	}
	for _, deny := range []string{
		"permission", "api key", "api_key", "unauthenticated",
		"quota", "rate limit", "billing", "blocked",
	} {
		if strings.Contains(s, deny) {
			return false
		}
	}
	for _, needle := range []string{
		"unknown name", "unknown field", "unknown argument",
		"invalid json payload", "invalid_argument",
		"unsupported", "extra_forbidden", "not a valid",
		"unrecognized", "no such field", "cannot find field",
	} {
		if strings.Contains(s, needle) {
			return true
		}
	}
	return false
}

func (s *Server) roundTripGeminiBridge(w http.ResponseWriter, r *http.Request, p provider.Provider, body []byte) (bool, error) {
	gbody, model, err := gemini.OpenAIToGenerateContent(body)
	if err != nil {
		return false, err
	}
	base := strings.TrimRight(strings.TrimSpace(os.Getenv("DECODED_GEMINI_BASE_URL")), "/")
	if base == "" {
		base = "https://generativelanguage.googleapis.com"
	}
	target := base + "/v1beta/models/" + model + ":generateContent"
	req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, target, bytes.NewReader(gbody))
	if err != nil {
		return false, err
	}
	copyForwardHeaders(req.Header, r.Header)
	if req.Header.Get("Content-Type") == "" {
		req.Header.Set("Content-Type", "application/json")
	}
	applyGeminiAPIKey(req.Header)
	req.ContentLength = int64(len(gbody))
	req.Host = req.URL.Host

	resp, err := s.client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return false, err
	}
	s.log.Printf("upstream %s status=%d", target, resp.StatusCode)
	if resp.StatusCode >= 400 {
		s.log.Printf("upstream error body: %s", truncateForLog(raw, 800))
	} else {
		raw = gemini.GenerateContentToOpenAI(raw, model)
	}

	copyResponseHeaders(w.Header(), resp.Header)
	w.Header().Del("Content-Length")
	w.Header().Del("Content-Encoding")
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Length", strconv.Itoa(len(raw)))
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(raw)

	s.recordCache(raw, resp.Header, p)
	return true, nil
}

func applyGeminiAPIKey(h http.Header) {
	auth := strings.TrimSpace(h.Get("Authorization"))
	const prefix = "Bearer "
	if len(auth) > len(prefix) && strings.EqualFold(auth[:len(prefix)], prefix) {
		key := strings.TrimSpace(auth[len(prefix):])
		if key != "" && h.Get("X-Goog-Api-Key") == "" {
			h.Set("X-Goog-Api-Key", key)
		}
		h.Del("Authorization")
	}
}

func groqProfile() bool {
	return strings.EqualFold(strings.TrimSpace(os.Getenv("DECODED_UPSTREAM_PROFILE")), "groq")
}

func geminiNativePath(path string) bool {
	return strings.Contains(path, "/v1beta/models/") || strings.Contains(path, ":generateContent")
}

func truncateForLog(b []byte, n int) string {
	s := strings.TrimSpace(string(b))
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}
