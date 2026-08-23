package provider

import (
	"net/http"
	"strings"
	"testing"
)

func clearProviderEnv(t *testing.T) {
	t.Helper()
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", "")
	t.Setenv("DECODED_OPENAI_BASE_URL", "")
	t.Setenv("DECODED_UPSTREAM_PROFILE", "")
	t.Setenv("DECODED_STRIP_CACHE", "")
}

func TestDetectAnthropicMessagesWithTools(t *testing.T) {
	clearProviderEnv(t)
	body := []byte(`{
		"model": "ignored-model-name",
		"max_tokens": 1024,
		"system": "You are a coding agent.",
		"tools": [{
			"name": "read_file",
			"input_schema": {
				"type": "object",
				"properties": {"path": {"type": "string"}}
			}
		}],
		"messages": [{"role": "user", "content": "read main.go"}]
	}`)

	p, err := Detect("/v1/messages", body, nil)
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	if p.Shape != ShapeAnthropic {
		t.Fatalf("shape=%q want %q", p.Shape, ShapeAnthropic)
	}
	if p.Cache.Mode != CacheExplicit {
		t.Fatalf("cache mode=%q want %q", p.Cache.Mode, CacheExplicit)
	}
	if p.Cache.Marker != "cache_control" || p.Cache.MaxBreakpoints != 4 || p.Cache.TTLDefault != "5m" {
		t.Fatalf("cache policy=%+v", p.Cache)
	}
	if !p.SupportsCache() {
		t.Fatal("SupportsCache()=false want true")
	}
	if got, want := p.UsageFields.HitPaths, []string{"usage.cache_read_input_tokens"}; !eqStrings(got, want) {
		t.Fatalf("HitPaths=%q want %q", got, want)
	}
	if got, want := p.UsageFields.WritePaths, []string{"usage.cache_creation_input_tokens"}; !eqStrings(got, want) {
		t.Fatalf("WritePaths=%q want %q", got, want)
	}
}

func TestDetectOpenAIChatWithToolCalls(t *testing.T) {
	clearProviderEnv(t)
	body := []byte(`{
		"model": "gpt-4o",
		"messages": [
			{"role": "system", "content": "stable prefix"},
			{
				"role": "assistant",
				"content": null,
				"tool_calls": [{
					"id": "call_1",
					"type": "function",
					"function": {"name": "read_file", "arguments": "{}"}
				}]
			},
			{"role": "tool", "tool_call_id": "call_1", "content": "ok"}
		]
	}`)

	p, err := Detect("/v1/chat/completions", body, nil)
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	if p.Shape != ShapeOpenAI {
		t.Fatalf("shape=%q want %q", p.Shape, ShapeOpenAI)
	}
	if p.Cache.Mode != CacheImplicit {
		t.Fatalf("cache mode=%q want %q", p.Cache.Mode, CacheImplicit)
	}
	if p.SupportsCache() {
		t.Fatal("SupportsCache()=true; openai-compatible must not inject cache_control")
	}
}

func TestDetectOpenRouterAnthropicShapedOnChatPath(t *testing.T) {
	clearProviderEnv(t)
	body := []byte(`{
		"model": "openrouter/auto",
		"system": "You are helpful.",
		"max_tokens": 256,
		"messages": [{"role": "user", "content": "hi"}],
		"tools": [{
			"name": "search",
			"input_schema": {"type": "object", "properties": {}}
		}]
	}`)

	p, err := Detect("https://openrouter.ai/api/v1/chat/completions", body, nil)
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	if p.Shape != ShapeAnthropic {
		t.Fatalf("shape=%q want %q (top-level system, not hostname or model)", p.Shape, ShapeAnthropic)
	}
	if !p.SupportsCache() {
		t.Fatal("anthropic-compatible on a chat path should still allow cache_control")
	}
}

func TestDetectStrayCacheControlOnOpenAIShape(t *testing.T) {
	clearProviderEnv(t)
	body := []byte(`{
		"model": "gpt-4o",
		"messages": [
			{
				"role": "system",
				"content": [
					{"type": "text", "text": "stable", "cache_control": {"type": "ephemeral"}}
				]
			},
			{
				"role": "assistant",
				"tool_calls": [{
					"id": "c1",
					"type": "function",
					"function": {"name": "x", "arguments": "{}"}
				}]
			}
		]
	}`)

	p, err := Detect("/v1/chat/completions", body, nil)
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	if p.Shape != ShapeOpenAI {
		t.Fatalf("shape=%q want %q", p.Shape, ShapeOpenAI)
	}
	if p.Cache.Mode != CacheStrip {
		t.Fatalf("cache mode=%q want %q (strip stray Anthropic markers)", p.Cache.Mode, CacheStrip)
	}
	if p.SupportsCache() {
		t.Fatal("SupportsCache()=true; must not inject on openai shape")
	}
}

func TestDetectMalformedJSONNoPanic(t *testing.T) {
	clearProviderEnv(t)
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("panic on malformed JSON: %v", r)
		}
	}()

	p, err := Detect("/v1/messages", []byte(`{"model":`), nil)
	if err == nil {
		t.Fatal("expected error for malformed JSON")
	}
	if p.Shape != ShapeUnknown {
		t.Fatalf("shape=%q want %q", p.Shape, ShapeUnknown)
	}
	if p.SupportsCache() {
		t.Fatal("unknown must not inject cache_control")
	}
	if p.Cache.Mode != CacheImplicit && p.Cache.Mode != CacheStrip {
		t.Fatalf("cache mode=%q want implicit or strip", p.Cache.Mode)
	}
}

func TestDetectEmptyBodyFailOpen(t *testing.T) {
	clearProviderEnv(t)
	for _, body := range [][]byte{nil, {}, []byte("  \n")} {
		p, err := Detect("/v1/chat/completions", body, nil)
		if err == nil {
			t.Fatalf("expected error for empty body %q", body)
		}
		if p.Shape != ShapeUnknown {
			t.Fatalf("shape=%q want %q", p.Shape, ShapeUnknown)
		}
	}
}

func TestDetectOllamaMinimalChat(t *testing.T) {
	clearProviderEnv(t)
	body := []byte(`{"model":"llama3","messages":[{"role":"user","content":"hello"}]}`)

	p, err := Detect("/v1/chat/completions", body, nil)
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	if p.Shape != ShapeOpenAI {
		t.Fatalf("shape=%q want %q", p.Shape, ShapeOpenAI)
	}
	if p.Cache.Mode != CacheImplicit {
		t.Fatalf("cache mode=%q want %q (implicit shapes strip cache_control)", p.Cache.Mode, CacheImplicit)
	}
	if p.SupportsCache() {
		t.Fatal("implicit openai must not inject cache_control")
	}

	t.Setenv("DECODED_STRIP_CACHE", "1")
	p, err = Detect("/v1/chat/completions", body, nil)
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	if p.Shape != ShapeOpenAI {
		t.Fatalf("shape=%q want %q", p.Shape, ShapeOpenAI)
	}
	if p.Cache.Mode != CacheStrip {
		t.Fatalf("cache mode=%q want %q when DECODED_STRIP_CACHE=1", p.Cache.Mode, CacheStrip)
	}
}

func TestDetectResponsesPath(t *testing.T) {
	clearProviderEnv(t)
	body := []byte(`{
		"model": "gpt-4o",
		"input": [{"role": "user", "content": "hi"}]
	}`)
	p, err := Detect("/v1/responses", body, nil)
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	if p.Shape != ShapeResponses {
		t.Fatalf("shape=%q want %q", p.Shape, ShapeResponses)
	}
	if p.SupportsCache() {
		t.Fatal("responses must not inject cache_control")
	}
}

func TestDetectIgnoresHostnameAndModelAndAuth(t *testing.T) {
	clearProviderEnv(t)
	openaiBody := []byte(`{"model":"claude-opus-4","messages":[{"role":"user","content":"hi"}]}`)

	urls := []string{
		"https://openrouter.ai/v1/chat/completions",
		"https://api.anthropic.com/v1/chat/completions",
		"http://127.0.0.1:8080/v1/chat/completions",
		"/v1/chat/completions",
	}
	headers := []http.Header{
		{"Authorization": []string{"Bearer sk-test"}},
		{"X-Api-Key": []string{"sk-ant-test"}},
		{"Authorization": []string{"Bearer sk-test"}, "X-Api-Key": []string{"sk-ant-test"}},
	}
	for _, u := range urls {
		for _, h := range headers {
			p, err := Detect(u, openaiBody, h)
			if err != nil {
				t.Fatalf("Detect(%s): %v", u, err)
			}
			if p.Shape != ShapeOpenAI {
				t.Fatalf("url=%s headers=%v shape=%q want %q", u, h, p.Shape, ShapeOpenAI)
			}
		}
	}
}

func TestDetectMaxTokensIsNotAnthropicSignal(t *testing.T) {
	clearProviderEnv(t)
	body := []byte(`{
		"model": "gpt-4o",
		"max_tokens": 128,
		"max_completion_tokens": 128,
		"messages": [{"role": "user", "content": "hi"}]
	}`)
	p, err := Detect("/v1/chat/completions", body, nil)
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	if p.Shape != ShapeOpenAI {
		t.Fatalf("shape=%q want %q (max_tokens alone is not Anthropic)", p.Shape, ShapeOpenAI)
	}
}

func TestDetectPathWinsOverConflictingBody(t *testing.T) {
	clearProviderEnv(t)
	openaiTools := []byte(`{
		"model": "gpt-4o",
		"messages": [
			{"role": "assistant", "tool_calls": [{"id": "c1", "type": "function", "function": {"name": "x", "arguments": "{}"}}]}
		]
	}`)
	p, err := Detect("/v1/messages", openaiTools, nil)
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	if p.Shape != ShapeAnthropic {
		t.Fatalf("shape=%q want %q (/v1/messages path wins)", p.Shape, ShapeAnthropic)
	}

	chatBody := []byte(`{"model":"gpt-4o","messages":[{"role":"user","content":"hi"}]}`)
	p, err = Detect("/v1/responses", chatBody, nil)
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	if p.Shape != ShapeResponses {
		t.Fatalf("shape=%q want %q (/v1/responses path wins)", p.Shape, ShapeResponses)
	}
}

func TestDetectToolUseBlocksAndPromptCacheBreakpoint(t *testing.T) {
	clearProviderEnv(t)

	toolUse := []byte(`{
		"messages": [{
			"role": "assistant",
			"content": [{"type": "tool_use", "id": "t1", "name": "x", "input": {}}]
		}]
	}`)
	p, err := Detect("/unknown", toolUse, nil)
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	if p.Shape != ShapeAnthropic {
		t.Fatalf("shape=%q want %q", p.Shape, ShapeAnthropic)
	}

	breakpoint := []byte(`{
		"model": "gpt-5.6",
		"messages": [{"role": "user", "content": [{"type": "text", "text": "hi", "prompt_cache_breakpoint": {"mode": "explicit"}}]}]
	}`)
	p, err = Detect("/v1/chat/completions", breakpoint, nil)
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	if p.Shape != ShapeOpenAI {
		t.Fatalf("shape=%q want %q", p.Shape, ShapeOpenAI)
	}
}

func TestDetectUnknownPathNoSignals(t *testing.T) {
	clearProviderEnv(t)
	p, err := Detect("/health", []byte(`{"ok": true}`), nil)
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	if p.Shape != ShapeUnknown {
		t.Fatalf("shape=%q want %q", p.Shape, ShapeUnknown)
	}
}

func TestDetectJSONArrayFailOpen(t *testing.T) {
	clearProviderEnv(t)
	p, err := Detect("/v1/messages", []byte(`[]`), nil)
	if err == nil {
		t.Fatal("expected error for JSON array")
	}
	if p.Shape != ShapeUnknown {
		t.Fatalf("shape=%q want %q", p.Shape, ShapeUnknown)
	}
}

func TestOllamaProfileDoesNotChangeShape(t *testing.T) {
	clearProviderEnv(t)
	t.Setenv("DECODED_UPSTREAM_PROFILE", "ollama")
	body := []byte(`{"model":"llama3","messages":[{"role":"user","content":"hi"}]}`)
	p, err := Detect("/v1/chat/completions", body, nil)
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	if p.Shape != ShapeOpenAI {
		t.Fatalf("shape=%q want %q", p.Shape, ShapeOpenAI)
	}
	if p.Cache.Mode != CacheStrip {
		t.Fatalf("cache mode=%q want %q", p.Cache.Mode, CacheStrip)
	}
	if p.SupportsCache() {
		t.Fatal("ollama profile must not inject cache_control")
	}
}

func TestSupportsCache(t *testing.T) {
	if !(Provider{Cache: CachePolicy{Mode: CacheExplicit}}).SupportsCache() {
		t.Fatal("explicit should support cache")
	}
	for _, m := range []CacheMode{CacheImplicit, CacheStrip, CacheNone, ""} {
		if (Provider{Cache: CachePolicy{Mode: m}}).SupportsCache() {
			t.Fatalf("mode %q should not support cache injection", m)
		}
	}
}

func TestUpstreamURLDefaultsAndEnv(t *testing.T) {
	clearProviderEnv(t)

	if got, want := UpstreamURL(ShapeAnthropic, "/v1/messages"), "https://api.anthropic.com/v1/messages"; got != want {
		t.Fatalf("got %q want %q", got, want)
	}
	if got, want := UpstreamURL(ShapeOpenAI, "/v1/chat/completions"), "https://api.openai.com/v1/chat/completions"; got != want {
		t.Fatalf("got %q want %q", got, want)
	}
	if got, want := UpstreamURL(ShapeResponses, "/v1/responses"), "https://api.openai.com/v1/responses"; got != want {
		t.Fatalf("got %q want %q", got, want)
	}

	t.Setenv("DECODED_ANTHROPIC_BASE_URL", "https://proxy.example/anth")
	if got, want := UpstreamURL(ShapeAnthropic, "/v1/messages"), "https://proxy.example/anth/v1/messages"; got != want {
		t.Fatalf("got %q want %q", got, want)
	}

	t.Setenv("DECODED_OPENAI_BASE_URL", "https://api.groq.com/openai/v1")
	if got, want := UpstreamURL(ShapeOpenAI, "/v1/chat/completions"), "https://api.groq.com/openai/v1/chat/completions"; got != want {
		t.Fatalf("got %q want %q", got, want)
	}

	if got, want := UpstreamURL(ShapeOpenAI, "https://unused.example/v1/chat/completions?n=1"), "https://api.groq.com/openai/v1/chat/completions?n=1"; got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}

func TestUpstreamURLRoutesByPathNotShape(t *testing.T) {
	clearProviderEnv(t)
	got := UpstreamURL(ShapeAnthropic, "/v1/chat/completions")
	if want := "https://api.openai.com/v1/chat/completions"; got != want {
		t.Fatalf("got %q want %q (path chooses env, not shape)", got, want)
	}
}

func TestDetectDoesNotMentionSecretsInError(t *testing.T) {
	clearProviderEnv(t)
	secret := "sk-secret-should-not-leak"
	p, err := Detect("/v1/messages", []byte(`{"key":"`+secret), nil)
	if p.Shape != ShapeUnknown {
		t.Fatalf("shape=%q", p.Shape)
	}
	if err == nil {
		t.Fatal("expected error")
	}
	if strings.Contains(err.Error(), secret) {
		t.Fatalf("error leaked body: %v", err)
	}
}

func eqStrings(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
