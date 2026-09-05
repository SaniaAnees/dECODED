package proxy

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/SaniaAnees/dECODED/internal/normalizer"
	"github.com/SaniaAnees/dECODED/internal/provider"
	"github.com/SaniaAnees/dECODED/internal/stats"
)

func quiet(s *Server) *Server {
	s.log = log.New(io.Discard, "", 0)
	return s
}

func TestCheckLoopback(t *testing.T) {
	if err := checkLoopback("127.0.0.1:8080"); err != nil {
		t.Fatal(err)
	}
	if err := checkLoopback("localhost:8080"); err != nil {
		t.Fatal(err)
	}
	if err := checkLoopback("0.0.0.0:8080"); err == nil {
		t.Fatal("want error for 0.0.0.0")
	}
	if err := checkLoopback(":8080"); err == nil {
		t.Fatal("want error for all-interfaces")
	}
}

func TestHealth(t *testing.T) {
	pxy := httptest.NewServer(quiet(New()).Handler())
	defer pxy.Close()
	res, err := http.Get(pxy.URL + "/health")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(res.Body)
	if res.StatusCode != 200 || !bytes.Equal(bytes.TrimSpace(b), []byte(`{"ok":true}`)) {
		t.Fatalf("status=%d body=%s", res.StatusCode, b)
	}
}

func TestNormalizeAnthropicAndForwardAuth(t *testing.T) {
	var got []byte
	var gotKey, gotPath string
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got, _ = io.ReadAll(r.Body)
		gotKey = r.Header.Get("x-api-key")
		gotPath = r.URL.Path
		if r.Header.Get("X-Session-Id") == "" {
			t.Error("missing X-Session-Id")
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"type":"message","usage":{"cache_read_input_tokens":100,"cache_creation_input_tokens":2}}`)
	}))
	defer up.Close()
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", up.URL)
	t.Setenv("DECODED_OPENAI_BASE_URL", "")
	t.Setenv("DECODED_UPSTREAM_PROFILE", "")

	s := quiet(New())
	pxy := httptest.NewServer(s.Handler())
	defer pxy.Close()

	body := []byte(`{
		"model":"claude-sonnet-4-5",
		"max_tokens":1024,
		"system":"You are a coding agent.",
		"tools":[
			{"name":"write_file","description":"w","input_schema":{"type":"object","properties":{}}},
			{"name":"read_file","description":"r","input_schema":{"type":"object","properties":{}}}
		],
		"messages":[{"role":"user","content":"hi"}]
	}`)
	req, _ := http.NewRequest(http.MethodPost, pxy.URL+"/v1/messages", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", "secret-key-do-not-log")
	req.Header.Set("anthropic-version", "2023-06-01")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		t.Fatalf("status=%d", res.StatusCode)
	}
	if gotKey != "secret-key-do-not-log" {
		t.Fatal("auth header not forwarded")
	}
	if gotPath != "/v1/messages" {
		t.Fatalf("upstream path=%s", gotPath)
	}
	if !bytes.Contains(got, []byte(`"name":"read_file"`)) {
		t.Fatalf("missing sorted tool: %s", got)
	}
	readIdx := bytes.Index(got, []byte(`"name":"read_file"`))
	writeIdx := bytes.Index(got, []byte(`"name":"write_file"`))
	if readIdx < 0 || writeIdx < 0 || readIdx > writeIdx {
		t.Fatalf("tools not sorted A–Z: %s", got)
	}
	if !bytes.Contains(got, []byte(`"cache_control"`)) {
		t.Fatalf("expected cache_control on anthropic: %s", got)
	}
	if bytes.Contains(got, []byte(`"session_id"`)) {
		t.Fatal("must not inject session_id into Anthropic body")
	}

	want, err := normalizer.Normalize(body, mustDetect(t, "/v1/messages", body))
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, want) {
		t.Fatalf("anthropic body must stay canonical (sticky is headers only).\ngot  %s\nwant %s", got, want)
	}

	snap := s.Stats.Snapshot()
	if snap.Requests != 1 || snap.Hits != 1 || snap.TokensSaved != 100 {
		t.Fatalf("stats=%+v", snap)
	}
}

func TestOpenAIForwardsAuthorization(t *testing.T) {
	var gotAuth string
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"usage":{"prompt_tokens":10,"prompt_tokens_details":{"cached_tokens":0}}}`)
	}))
	defer up.Close()
	t.Setenv("DECODED_OPENAI_BASE_URL", up.URL)
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", "")
	t.Setenv("DECODED_UPSTREAM_PROFILE", "")

	pxy := httptest.NewServer(quiet(New()).Handler())
	defer pxy.Close()

	body := []byte(`{"model":"gpt-4o-mini","messages":[{"role":"user","content":"hi"}]}`)
	req, _ := http.NewRequest(http.MethodPost, pxy.URL+"/v1/chat/completions", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer sk-test-forward")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if res.StatusCode != 200 {
		t.Fatalf("status=%d", res.StatusCode)
	}
	if gotAuth != "Bearer sk-test-forward" {
		t.Fatalf("Authorization not forwarded: %q", gotAuth)
	}
}

func TestPromotesGoogKeyToBearer(t *testing.T) {
	var gotAuth string
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{}`)
	}))
	defer up.Close()
	t.Setenv("DECODED_OPENAI_BASE_URL", up.URL)
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", "")
	t.Setenv("DECODED_UPSTREAM_PROFILE", "openrouter")

	pxy := httptest.NewServer(quiet(New()).Handler())
	defer pxy.Close()

	body := []byte(`{"model":"openrouter/free","messages":[{"role":"user","content":"hi"}]}`)
	req, _ := http.NewRequest(http.MethodPost, pxy.URL+"/v1/chat/completions", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Goog-Api-Key", "sk-or-test")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if gotAuth != "Bearer sk-or-test" {
		t.Fatalf("expected promoted Bearer, got %q", gotAuth)
	}
}

func TestFailOpenInvalidJSON(t *testing.T) {
	var got []byte
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got, _ = io.ReadAll(r.Body)
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, `{"ok":true}`)
	}))
	defer up.Close()
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", up.URL)

	pxy := httptest.NewServer(quiet(New()).Handler())
	defer pxy.Close()

	raw := []byte(`{not json`)
	res, err := http.Post(pxy.URL+"/v1/messages", "application/json", bytes.NewReader(raw))
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if !bytes.Equal(got, raw) {
		t.Fatalf("fail-open: got %q want %q", got, raw)
	}
}

func TestNormalizeFailDoesNotForward(t *testing.T) {
	forwarded := false
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		forwarded = true
		w.WriteHeader(200)
	}))
	defer up.Close()
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", up.URL)

	orig := normalize
	normalize = func([]byte, provider.Provider) ([]byte, error) {
		return nil, errors.New("boom")
	}
	defer func() { normalize = orig }()

	pxy := httptest.NewServer(quiet(New()).Handler())
	defer pxy.Close()

	body := []byte(`{"model":"x","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}`)
	res, err := http.Post(pxy.URL+"/v1/messages", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if forwarded {
		t.Fatal("must not forward dirty body after normalize fail")
	}
	if res.StatusCode != http.StatusBadGateway {
		t.Fatalf("status=%d", res.StatusCode)
	}
	b, _ := io.ReadAll(res.Body)
	if bytes.Contains(bytes.ToLower(b), []byte("boom")) {
		t.Fatal("error must not leak internal details")
	}
}

func TestUnknownPath404(t *testing.T) {
	pxy := httptest.NewServer(quiet(New()).Handler())
	defer pxy.Close()
	res, err := http.Get(pxy.URL + "/nope")
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if res.StatusCode != 404 {
		t.Fatalf("status=%d", res.StatusCode)
	}
}

func TestGroqSkipsPromptCacheKey(t *testing.T) {
	t.Setenv("DECODED_OPENAI_BASE_URL", "https://api.groq.com/openai/v1")
	t.Setenv("DECODED_UPSTREAM_PROFILE", "groq")
	body := []byte(`{"model":"openai/gpt-oss-20b","messages":[{"role":"user","content":"hi"}]}`)
	p := mustDetect(t, "/v1/chat/completions", body)
	got := applySticky(body, nil, p, "decoded-local")
	if topLevelString(got, "prompt_cache_key") != "" {
		t.Fatalf("groq must not get prompt_cache_key: %s", got)
	}
}

func TestMistralSkipsUserKeepsPromptCacheKey(t *testing.T) {
	t.Setenv("DECODED_OPENAI_BASE_URL", "https://api.mistral.ai/v1")
	t.Setenv("DECODED_UPSTREAM_PROFILE", "mistral")
	body := []byte(`{"model":"mistral-small-latest","messages":[{"role":"user","content":"hi"}]}`)
	p := mustDetect(t, "/v1/chat/completions", body)
	got := applySticky(body, nil, p, "decoded-local")
	if topLevelString(got, "user") != "" {
		t.Fatalf("mistral must not get injected user: %s", got)
	}
	if topLevelString(got, "prompt_cache_key") == "" {
		t.Fatalf("mistral needs prompt_cache_key: %s", got)
	}
}

func TestGeminiSkipsPromptCacheKey(t *testing.T) {
	t.Setenv("DECODED_OPENAI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai")
	body := []byte(`{"model":"gemini-2.5-flash","messages":[{"role":"user","content":"hi"}]}`)
	p := mustDetect(t, "/v1/chat/completions", body)
	got := applySticky(body, nil, p, "decoded-local")
	if topLevelString(got, "prompt_cache_key") != "" {
		t.Fatalf("gemini must not get prompt_cache_key: %s", got)
	}
	if topLevelString(got, "user") != "" {
		t.Fatalf("gemini must not get injected user: %s", got)
	}
}

func TestOpenAIInjectsPromptCacheKey(t *testing.T) {
	var got []byte
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got, _ = io.ReadAll(r.Body)
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"usage":{"prompt_tokens_details":{"cached_tokens":0}}}`)
	}))
	defer up.Close()
	t.Setenv("DECODED_OPENAI_BASE_URL", up.URL)
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", "")

	pxy := httptest.NewServer(quiet(New()).Handler())
	defer pxy.Close()

	body := []byte(`{"model":"gpt-4o","messages":[{"role":"user","content":"hi"}]}`)
	res, err := http.Post(pxy.URL+"/v1/chat/completions", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if !bytes.Contains(got, []byte(`"prompt_cache_key"`)) {
		t.Fatalf("expected prompt_cache_key: %s", got)
	}
	if !bytes.Contains(got, []byte(`"user"`)) {
		t.Fatalf("expected user sticky field: %s", got)
	}
}

func TestPreserveIncomingPromptCacheKey(t *testing.T) {
	var got []byte
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got, _ = io.ReadAll(r.Body)
		w.WriteHeader(200)
		_, _ = io.WriteString(w, `{}`)
	}))
	defer up.Close()
	t.Setenv("DECODED_OPENAI_BASE_URL", up.URL)

	pxy := httptest.NewServer(quiet(New()).Handler())
	defer pxy.Close()

	body := []byte(`{"model":"gpt-4o","messages":[{"role":"user","content":"hi"}],"prompt_cache_key":"keep-me"}`)
	res, err := http.Post(pxy.URL+"/v1/chat/completions", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if !bytes.Contains(got, []byte(`"keep-me"`)) {
		t.Fatalf("lost incoming prompt_cache_key: %s", got)
	}
	if strings.Count(string(got), `"prompt_cache_key"`) != 1 {
		t.Fatalf("duplicate prompt_cache_key: %s", got)
	}
}

func TestStreamPassthrough(t *testing.T) {
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		fl := w.(http.Flusher)
		_, _ = io.WriteString(w, "data: {\"usage\":{\"cache_read_input_tokens\":5}}\n\n")
		fl.Flush()
	}))
	defer up.Close()
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", up.URL)

	s := quiet(New())
	pxy := httptest.NewServer(s.Handler())
	defer pxy.Close()

	body := []byte(`{"model":"x","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}`)
	res, err := http.Post(pxy.URL+"/v1/messages", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(res.Body)
	if !bytes.Contains(b, []byte("data:")) {
		t.Fatalf("stream body=%s", b)
	}
	if s.Stats.Snapshot().TokensSaved != 5 {
		t.Fatalf("sse usage not recorded: %+v", s.Stats.Snapshot())
	}
}

func TestInjectTopLevelPreservesInner(t *testing.T) {
	inner := `{"model":"x","z":1}`
	got := injectTopLevelString([]byte(inner), "prompt_cache_key", "abc")
	if !bytes.Contains(got, []byte(`"model":"x","z":1`)) {
		t.Fatalf("inner mutated: %s", got)
	}
	if !bytes.Contains(got, []byte(`"prompt_cache_key":"abc"`)) {
		t.Fatalf("missing inject: %s", got)
	}
}

func TestEmptyBodyDoesNot500(t *testing.T) {
	var got []byte
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got, _ = io.ReadAll(r.Body)
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, `{"ok":true}`)
	}))
	defer up.Close()
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", up.URL)

	pxy := httptest.NewServer(quiet(New()).Handler())
	defer pxy.Close()

	res, err := http.Post(pxy.URL+"/v1/messages", "application/json", bytes.NewReader(nil))
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		t.Fatalf("empty body status=%d", res.StatusCode)
	}
	if len(got) != 0 {
		t.Fatalf("fail-open empty: upstream got %q", got)
	}
}

func TestBodyTooLarge(t *testing.T) {
	old := maxBody
	maxBody = 64
	defer func() { maxBody = old }()

	forwarded := false
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		forwarded = true
		w.WriteHeader(200)
	}))
	defer up.Close()
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", up.URL)

	pxy := httptest.NewServer(quiet(New()).Handler())
	defer pxy.Close()

	res, err := http.Post(pxy.URL+"/v1/messages", "application/json", bytes.NewReader(bytes.Repeat([]byte("x"), 65)))
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusRequestEntityTooLarge {
		t.Fatalf("status=%d", res.StatusCode)
	}
	if forwarded {
		t.Fatal("must not forward oversized body")
	}
}

func TestMissingAuthStillForwards(t *testing.T) {
	var gotAuth string
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = io.WriteString(w, `{"error":{"message":"missing key"}}`)
	}))
	defer up.Close()
	t.Setenv("DECODED_OPENAI_BASE_URL", up.URL)
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", "")

	pxy := httptest.NewServer(quiet(New()).Handler())
	defer pxy.Close()

	body := []byte(`{"model":"gpt-4o","messages":[{"role":"user","content":"hi"}]}`)
	res, err := http.Post(pxy.URL+"/v1/chat/completions", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("lab 401 should pass through, got %d", res.StatusCode)
	}
	if gotAuth != "" {
		t.Fatalf("unexpected Authorization: %q", gotAuth)
	}
}

func TestUpstreamDown502(t *testing.T) {
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", "http://127.0.0.1:1")
	pxy := httptest.NewServer(quiet(New()).Handler())
	defer pxy.Close()

	body := []byte(`{"model":"x","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}`)
	res, err := http.Post(pxy.URL+"/v1/messages", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusBadGateway {
		t.Fatalf("status=%d", res.StatusCode)
	}
	b, _ := io.ReadAll(res.Body)
	if bytes.Contains(bytes.ToLower(b), []byte("127.0.0.1")) {
		t.Fatalf("error leaked dial target: %s", b)
	}
}

func TestCookieNotForwarded(t *testing.T) {
	var gotCookie string
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotCookie = r.Header.Get("Cookie")
		w.WriteHeader(200)
		_, _ = io.WriteString(w, `{}`)
	}))
	defer up.Close()
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", up.URL)

	pxy := httptest.NewServer(quiet(New()).Handler())
	defer pxy.Close()

	body := []byte(`{"model":"x","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}`)
	req, _ := http.NewRequest(http.MethodPost, pxy.URL+"/v1/messages", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Cookie", "session=should-not-reach-lab")
	req.Header.Set("x-api-key", "k")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if gotCookie != "" {
		t.Fatalf("cookie leaked to lab: %q", gotCookie)
	}
}

func TestGETAPIMethodNotAllowed(t *testing.T) {
	pxy := httptest.NewServer(quiet(New()).Handler())
	defer pxy.Close()
	res, err := http.Get(pxy.URL + "/v1/messages")
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if res.StatusCode != http.StatusMethodNotAllowed && res.StatusCode != http.StatusNotFound {
		t.Fatalf("GET API status=%d", res.StatusCode)
	}
}

func TestConcurrentChatNoPanic(t *testing.T) {
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"usage":{"prompt_tokens":3,"prompt_tokens_details":{"cached_tokens":1}}}`)
	}))
	defer up.Close()
	t.Setenv("DECODED_OPENAI_BASE_URL", up.URL)
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", "")

	s := quiet(New())
	pxy := httptest.NewServer(s.Handler())
	defer pxy.Close()

	body := []byte(`{"model":"gpt-4o","messages":[{"role":"user","content":"hi"}]}`)
	const n = 20
	errc := make(chan error, n)
	for i := 0; i < n; i++ {
		go func() {
			res, err := http.Post(pxy.URL+"/v1/chat/completions", "application/json", bytes.NewReader(body))
			if err != nil {
				errc <- err
				return
			}
			_, _ = io.Copy(io.Discard, res.Body)
			res.Body.Close()
			if res.StatusCode != 200 {
				errc <- errors.New(res.Status)
				return
			}
			errc <- nil
		}()
	}
	for i := 0; i < n; i++ {
		if err := <-errc; err != nil {
			t.Fatal(err)
		}
	}
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if s.Stats.Snapshot().Requests == n {
			return
		}
		time.Sleep(time.Millisecond)
	}
	t.Fatalf("stats requests=%d want %d", s.Stats.Snapshot().Requests, n)
}

func TestStatsEndpoint(t *testing.T) {
	s := quiet(New())
	s.Stats.Record(stats.Usage{ReadTokens: 1, Shape: provider.ShapeAnthropic})
	pxy := httptest.NewServer(s.Handler())
	defer pxy.Close()
	res, err := http.Get(pxy.URL + "/stats")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	var snap struct {
		Requests int64 `json:"requests"`
		Hits     int64 `json:"hits"`
	}
	if err := json.NewDecoder(res.Body).Decode(&snap); err != nil {
		t.Fatal(err)
	}
	if snap.Requests != 1 || snap.Hits != 1 {
		t.Fatalf("%+v", snap)
	}
}

func mustDetect(t *testing.T, path string, body []byte) provider.Provider {
	t.Helper()
	p, err := provider.Detect(path, body, nil)
	if err != nil {
		t.Fatal(err)
	}
	return p
}
