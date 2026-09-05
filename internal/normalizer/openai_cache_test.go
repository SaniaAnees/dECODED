package normalizer

import (
	"bytes"
	"strings"
	"testing"

	"github.com/SaniaAnees/dECODED/internal/provider"
)

func TestOpenAIBreakpointSupportedModels(t *testing.T) {
	cases := []struct {
		model string
		want  bool
	}{
		{"gpt-4o", false},
		{"gpt-4.1", false},
		{"gpt-5.6", true},
		{"gpt-5.6-codex", true},
		{"GPT-5.6", true},
		{"gpt-5.7-preview", true},
		{"gpt-5.8", true},
		{"gpt-5.9", true},
		{"gpt-5.5", false},
	}
	for _, tc := range cases {
		doc := map[string]any{"model": tc.model}
		if got := openaiBreakpointSupported(doc); got != tc.want {
			t.Errorf("model=%q supported=%v want %v", tc.model, got, tc.want)
		}
	}
	if !openaiBreakpointSupported(map[string]any{"model": "gpt-4o", "prompt_cache_options": map[string]any{"mode": "explicit"}}) {
		t.Fatal("prompt_cache_options should enable support even on gpt-4o-shaped body")
	}
}

func assertNoBreakpointOnLastUser(t *testing.T, doc map[string]any) {
	t.Helper()
	msgs := objectsIn(doc["messages"])
	if len(msgs) == 0 {
		msgs = objectsIn(doc["input"])
	}
	if len(msgs) == 0 {
		t.Fatal("no messages")
	}
	last := msgs[len(msgs)-1]
	if roleOf(last) != "user" {
		return
	}
	if _, ok := last["prompt_cache_breakpoint"]; ok {
		t.Fatal("breakpoint on last user message")
	}
	if countPromptCacheBreakpoint(last["content"]) != 0 {
		t.Fatal("breakpoint on last user content")
	}
}

func assertOpenAIBreakpointOnLastStableSystem(t *testing.T, doc map[string]any) {
	t.Helper()
	assertNoBreakpointOnLastUser(t, doc)
	msgs := objectsIn(doc["messages"])
	if len(msgs) == 0 {
		msgs = objectsIn(doc["input"])
	}
	var lastStable map[string]any
	lastUser := lastUserIndex(anySlice(msgs))
	for i, m := range msgs {
		if isProtectedMessage(m, i == lastUser) || isVolatileMessage(m) {
			if countPromptCacheBreakpoint(m) != 0 {
				t.Fatalf("breakpoint on protected/volatile message idx=%d role=%s", i, roleOf(m))
			}
			continue
		}
		if roleOf(m) != "system" && roleOf(m) != "developer" {
			continue
		}
		for _, b := range objectsIn(m["content"]) {
			if isVolatileBlock(b) {
				if _, ok := b["prompt_cache_breakpoint"]; ok {
					t.Fatal("breakpoint on volatile system block")
				}
				continue
			}
			if _, ok := b["prompt_cache_breakpoint"]; ok {
				lastStable = b
			}
		}
	}
	if lastStable == nil {
		t.Fatalf("no prompt_cache_breakpoint on stable system/developer text: %v", doc)
	}
	bp, _ := lastStable["prompt_cache_breakpoint"].(map[string]any)
	if bp["mode"] != "explicit" {
		t.Fatalf("breakpoint mode=%v want explicit", bp["mode"])
	}
}

func anySlice(msgs []map[string]any) []any {
	out := make([]any, len(msgs))
	for i, m := range msgs {
		out[i] = m
	}
	return out
}

func TestGPT56DatedModelStillInjects(t *testing.T) {
	body := []byte(`{
		"model":"gpt-5.6-2026-08-07",
		"messages":[{"role":"system","content":"stable policy"},{"role":"user","content":"hi"}]
	}`)
	p := detectFor(t, "/v1/chat/completions", body)
	out := assertIdempotent(t, body, p)
	assertOpenAIBreakpointOnLastStableSystem(t, parseTestJSON(t, out))
}

func TestGPT57InjectsPromptCacheBreakpoint(t *testing.T) {
	body := []byte(`{
		"model":"gpt-5.7",
		"messages":[{"role":"developer","content":"dev policy"},{"role":"user","content":"hi"}]
	}`)
	p := detectFor(t, "/v1/chat/completions", body)
	out := assertIdempotent(t, body, p)
	assertOpenAIBreakpointOnLastStableSystem(t, parseTestJSON(t, out))
}

func TestGPT56LastUserBreakpointRelocated(t *testing.T) {
	body := []byte(`{
		"model":"gpt-5.6",
		"messages":[
			{"role":"system","content":[{"type":"text","text":"stable policy"}]},
			{"role":"user","content":[{"type":"text","text":"hi","prompt_cache_breakpoint":{"mode":"explicit"}}]}
		]
	}`)
	p := detectFor(t, "/v1/chat/completions", body)
	if p.Cache.Mode == provider.CacheStrip {
		t.Fatal("no Anthropic cache_control; should not strip-mode")
	}
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	assertOpenAIBreakpointOnLastStableSystem(t, doc)
	if n := countPromptCacheBreakpoint(doc); n != 1 {
		t.Fatalf("breakpoints=%d want 1 (relocated, not duplicated): %s", n, out)
	}
}

func TestGPT56VolatileCarrierNotMarked(t *testing.T) {
	body := []byte(`{
		"model":"gpt-5.6",
		"messages":[
			{"role":"system","content":"You are a coding agent.\nCurrent time: 2026-08-27T10:00:00Z"},
			{"role":"user","content":"hi"}
		]
	}`)
	p := detectFor(t, "/v1/chat/completions", body)
	out := assertIdempotent(t, body, p)
	if !bytes.Contains(out, []byte(volatilePrefix)) {
		t.Fatalf("expected volatile carrier: %s", out)
	}
	doc := parseTestJSON(t, out)
	assertOpenAIBreakpointOnLastStableSystem(t, doc)
	for _, m := range objectsIn(doc["messages"]) {
		if isVolatileMessage(m) && countPromptCacheBreakpoint(m) != 0 {
			t.Fatalf("volatile carrier has breakpoint: %s", out)
		}
	}
}

func TestGPT56FourBreakpointsNoFifth(t *testing.T) {
	body := []byte(`{
		"model":"gpt-5.6",
		"messages":[
			{"role":"system","content":[
				{"type":"text","text":"a","prompt_cache_breakpoint":{"mode":"explicit"}},
				{"type":"text","text":"b","prompt_cache_breakpoint":{"mode":"explicit"}},
				{"type":"text","text":"c","prompt_cache_breakpoint":{"mode":"explicit"}},
				{"type":"text","text":"d","prompt_cache_breakpoint":{"mode":"explicit"}}
			]},
			{"role":"user","content":"hi"}
		]
	}`)
	p := detectFor(t, "/v1/chat/completions", body)
	out := assertIdempotent(t, body, p)
	if n := countPromptCacheBreakpoint(parseTestJSON(t, out)); n != 4 {
		t.Fatalf("breakpoints=%d want 4: %s", n, out)
	}
}

func TestGPT56NoSystemNoInject(t *testing.T) {
	body := []byte(`{
		"model":"gpt-5.6",
		"messages":[{"role":"user","content":"hi only"}]
	}`)
	p := detectFor(t, "/v1/chat/completions", body)
	out := assertIdempotent(t, body, p)
	if bytes.Contains(out, []byte("prompt_cache_breakpoint")) {
		t.Fatalf("must not invent breakpoint without system: %s", out)
	}
}

func TestGPT56ResponsesInputSystem(t *testing.T) {
	body := []byte(`{
		"model":"gpt-5.6",
		"input":[
			{"role":"system","content":[{"type":"input_text","text":"stable policy"}]},
			{"role":"user","content":[{"type":"input_text","text":"hi"}]}
		]
	}`)
	p := detectFor(t, "/v1/responses", body)
	if p.Shape != provider.ShapeResponses {
		t.Fatalf("shape=%s", p.Shape)
	}
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	if countPromptCacheBreakpoint(doc["input"]) == 0 {
		t.Fatalf("expected breakpoint on responses input: %s", out)
	}
	assertOpenAIBreakpointOnLastStableSystem(t, doc)
}

func TestGPT56StripModeDoesNotInject(t *testing.T) {
	body := []byte(`{
		"model":"gpt-5.6",
		"messages":[{"role":"system","content":"stable"},{"role":"user","content":"hi"}]
	}`)
	p := detectFor(t, "/v1/chat/completions", body)
	p.Cache.Mode = provider.CacheStrip
	out := assertIdempotent(t, body, p)
	if strings.Contains(string(out), "prompt_cache_breakpoint") {
		t.Fatalf("strip mode must not inject: %s", out)
	}
}
