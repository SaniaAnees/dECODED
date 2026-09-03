package normalizer

import (
	"bytes"
	"fmt"
	"strings"
	"sync"
	"testing"

	"github.com/SaniaAnees/dECODED/internal/provider"
)

func TestNormalizeEmptyAndInvalid(t *testing.T) {
	p := provider.Provider{Shape: provider.ShapeAnthropic, Cache: provider.CachePolicy{Mode: provider.CacheExplicit, MaxBreakpoints: 4}}
	for _, body := range [][]byte{nil, {}, []byte("  \n\t")} { 
		out, err := Normalize(body, p)
		if out != nil {
			t.Fatalf("empty: out=%s", out)
		}
		if err != ErrEmptyBody {
			t.Fatalf("empty: err=%v want ErrEmptyBody", err)
		}
		if err != nil && (strings.Contains(err.Error(), "sk-") || len(err.Error()) > 80) {
			t.Fatalf("error looks like it leaked a body: %v", err)
		}
	}

	secret := "sk-ant-secret-should-never-leak"
	invalids := [][]byte{
		[]byte(`[]`),
		[]byte(`"string"`),
		[]byte(`{"model":`),
		[]byte(`{"key":"` + secret),
		[]byte(`true`),
		[]byte(`{"a":1}{"b":2}`),
	}
	for _, body := range invalids {
		out, err := Normalize(body, p)
		if out != nil {
			t.Fatalf("invalid out=%s body=%s", out, body)
		}
		if err != ErrInvalidJSON {
			t.Fatalf("err=%v want ErrInvalidJSON body=%s", err, body)
		}
		if strings.Contains(err.Error(), secret) || strings.Contains(err.Error(), string(body)) {
			t.Fatalf("error leaked secrets/body: %v", err)
		}
	}
}

func TestNormalizeByteStability(t *testing.T) {
	body := []byte(`{"model":"claude","max_tokens":1,"system":"hi","messages":[{"role":"user","content":"x"}]}`)
	p := detectFor(t, "/v1/messages", body)
	a := normalizeOK(t, body, p)
	b := normalizeOK(t, body, p)
	if !bytes.Equal(a, b) {
		t.Fatalf("unstable\n%s\n%s", a, b)
	}
}

func TestNormalizeEmptyObject(t *testing.T) {
	body := []byte(`{}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	if string(out) != "{}" {
		t.Fatalf("got %s", out)
	}
}

func TestNormalizeJSONNumberPreserved(t *testing.T) {
	body := []byte(`{"model":"x","max_tokens":9007199254740993,"messages":[{"role":"user","content":"hi"}]}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	if !bytes.Contains(out, []byte(`"max_tokens":9007199254740993`)) {
		t.Fatalf("number rewritten: %s", out)
	}
	if bytes.Contains(out, []byte("e+")) || bytes.Contains(out, []byte("E+")) {
		t.Fatalf("scientific notation: %s", out)
	}
}

func TestNormalizeUnknownFieldsPreserved(t *testing.T) {
	body := []byte(`{
		"model":"x",
		"max_tokens":1,
		"metadata":{"user_id":"u1","nested":{"k":true}},
		"thinking":{"type":"enabled"},
		"vendor_ext":[1,2],
		"messages":[{"role":"user","content":"hi"}]
	}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	if _, ok := doc["metadata"]; !ok {
		t.Fatal("metadata dropped")
	}
	if _, ok := doc["thinking"]; !ok {
		t.Fatal("thinking dropped")
	}
	if _, ok := doc["vendor_ext"]; !ok {
		t.Fatal("vendor_ext dropped")
	}
}

func TestNormalizeEmptyToolsOK(t *testing.T) {
	body := []byte(`{"model":"x","max_tokens":1,"tools":[],"messages":[{"role":"user","content":"hi"}]}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	arr, ok := doc["tools"].([]any)
	if !ok || len(arr) != 0 {
		t.Fatalf("tools=%v", doc["tools"])
	}
}

func TestDuplicateToolNamesHashTieBreak(t *testing.T) {
	body := []byte(`{
		"model":"x","max_tokens":1,
		"tools":[
			{"name":"read","description":"zeta","input_schema":{"type":"object"}},
			{"name":"read","description":"alpha","input_schema":{"type":"object"}}
		],
		"messages":[{"role":"user","content":"hi"}]
	}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	tools := objectsIn(doc["tools"])
	if len(tools) != 2 {
		t.Fatalf("dropped tools: %d", len(tools))
	}
	d0, _ := tools[0]["description"].(string)
	d1, _ := tools[1]["description"].(string)
	h0 := hashForToolSort(tools[0])
	h1 := hashForToolSort(tools[1])
	if h0 > h1 {
		t.Fatalf("not sorted by hash: %s then %s (%s %s)", d0, d1, h0, h1)
	}
	if d0 == d1 {
		t.Fatal("tools collapsed")
	}
}

func TestTimestampOnlySystemDifference(t *testing.T) {
	mk := func(ts string) []byte {
		return []byte(`{
			"model":"x","max_tokens":1,
			"system":"You are a coding agent.\nCurrent time: ` + ts + `\nFollow the rules.",
			"messages":[{"role":"user","content":"hi"}]
		}`)
	}
	a := mk("2026-01-01T00:00:00Z")
	b := mk("2026-12-31T23:59:59.999Z")
	p := detectFor(t, "/v1/messages", a)
	oa := assertIdempotent(t, a, p)
	ob := assertIdempotent(t, b, detectFor(t, "/v1/messages", b))
	da := parseTestJSON(t, oa)
	db := parseTestJSON(t, ob)
	sa := stableSystemText(da)
	sb := stableSystemText(db)
	if sa != sb {
		t.Fatalf("stable system differs:\n%q\n%q", sa, sb)
	}
	if !strings.Contains(sa, "You are a coding agent.") || strings.Contains(sa, "Current time") {
		t.Fatalf("stable system not cleaned: %q", sa)
	}
	ca := formatOfCarrier(da)
	cb := formatOfCarrier(db)
	if ca == cb {
		t.Fatal("volatile carriers should differ")
	}
	if !strings.Contains(ca, "2026-01-01T00:00:00Z") || !strings.Contains(cb, "2026-12-31T23:59:59.999Z") {
		t.Fatalf("carriers missing clocks:\n%s\n%s", ca, cb)
	}
}

func formatOfCarrier(doc map[string]any) string {
	switch s := doc["system"].(type) {
	case []any:
		for _, b := range objectsIn(s) {
			if isVolatileBlock(b) {
				txt, _ := b["text"].(string)
				return txt
			}
		}
	}
	for _, m := range objectsIn(doc["messages"]) {
		if isVolatileMessage(m) {
			if c, ok := m["content"].(string); ok {
				return c
			}
		}
	}
	return ""
}

func TestMovePathUsedForClaudeCurrentTime(t *testing.T) {
	body := []byte(`{
		"model":"x","max_tokens":1,
		"system":"You are a coding agent.\nCurrent time: 2026-08-27T10:00:00Z\nBe concise.",
		"messages":[{"role":"user","content":"go"}]
	}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	if formatOfCarrier(doc) == "" {
		t.Fatal("expected move-to-tail carrier; Stage C must run for Claude-like Current time:")
	}
	if strings.Contains(stableSystemText(doc), "Current time") {
		t.Fatalf("time left in stable system: %q", stableSystemText(doc))
	}
	if strings.Contains(stableSystemText(doc), "2026-08-27T10:00:00Z") {
		t.Fatal("datetime left in stable system (stripped instead of moved?)")
	}
}

func TestUUIDAndSessionMoved(t *testing.T) {
	body := []byte(`{
		"model":"x","max_tokens":1,
		"system":"Stable policy.\nsession_id=sess-42\nuuid 550e8400-e29b-41d4-a716-446655440000\nend.",
		"messages":[{"role":"user","content":"go"}]
	}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	st := stableSystemText(doc)
	if strings.Contains(st, "sess-42") || strings.Contains(st, "550e8400") {
		t.Fatalf("volatile left in stable: %q", st)
	}
	c := formatOfCarrier(doc)
	if !strings.Contains(c, "sess-42") || !strings.Contains(c, "550e8400-e29b-41d4-a716-446655440000") {
		t.Fatalf("carrier missing values: %q", c)
	}
}

func TestMultipleOpenAISystemMessages(t *testing.T) {
	body := []byte(`{
		"model":"gpt-4o",
		"messages":[
			{"role":"system","content":"Policy A. Current time: 2026-08-27T10:00:00Z"},
			{"role":"system","content":"Policy B. sessionId=abc"},
			{"role":"user","content":"q1"},
			{"role":"assistant","content":"a1"},
			{"role":"user","content":"q2"}
		]
	}`)
	p := detectFor(t, "/v1/chat/completions", body)
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	msgs := objectsIn(doc["messages"])
	var sys []string
	var carrierAt = -1
	for i, m := range msgs {
		if isVolatileMessage(m) {
			carrierAt = i
			continue
		}
		if roleOf(m) == "system" {
			if c, ok := m["content"].(string); ok {
				sys = append(sys, c)
			}
		}
	}
	if len(sys) != 2 {
		t.Fatalf("system msgs=%v", sys)
	}
	if strings.Contains(sys[0], "Current time") || strings.Contains(sys[1], "sessionId") {
		t.Fatalf("volatility not moved: %v", sys)
	}
	if carrierAt < 0 {
		t.Fatal("no carrier")
	}
	if roleOf(msgs[len(msgs)-1]) != "user" {
		t.Fatal("last message should remain the last user turn")
	}
	if carrierAt != len(msgs)-2 {
		t.Fatalf("carrier should sit immediately before last user, idx=%d len=%d", carrierAt, len(msgs))
	}
	if countCacheControlTest(out) != 0 {
		t.Fatalf("openai must not inject cache_control: %s", out)
	}
}

func TestMixedContentMediaRunSortOnly(t *testing.T) {
	body := []byte(`{
		"model":"x","max_tokens":1,
		"system":"stable",
		"messages":[
			{"role":"user","content":[
				{"type":"text","text":"intro"},
				{"type":"document","source":{"type":"text","media_type":"text/plain","data":"Z_DOC"}},
				{"type":"document","source":{"type":"text","media_type":"text/plain","data":"A_DOC"}},
				{"type":"text","text":"mid"},
				{"type":"image","source":{"type":"base64","media_type":"image/png","data":"bbb"}},
				{"type":"image","source":{"type":"base64","media_type":"image/png","data":"aaa"}},
				{"type":"text","text":"end"}
			]},
			{"role":"assistant","content":"ok"},
			{"role":"user","content":"next"}
		]
	}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	first := objectsIn(doc["messages"])[0]
	blocks := objectsIn(first["content"])
	types := make([]string, len(blocks))
	for i, b := range blocks {
		types[i], _ = b["type"].(string)
	}
	want := []string{"text", "document", "document", "text", "image", "image", "text"}
	for i := range want {
		if types[i] != want[i] {
			t.Fatalf("types=%v want %v (text/tool blocks must not move)", types, want)
		}
	}
	d0, _ := blocks[1]["source"].(map[string]any)
	d1, _ := blocks[2]["source"].(map[string]any)
	if hashForToolSort(blocks[1]) > hashForToolSort(blocks[2]) {
		t.Fatalf("documents not sorted by hash: %v %v", d0, d1)
	}
	i0, _ := blocks[4]["source"].(map[string]any)
	i1, _ := blocks[5]["source"].(map[string]any)
	if hashForToolSort(blocks[4]) > hashForToolSort(blocks[5]) {
		t.Fatalf("images not sorted: %v %v", i0, i1)
	}
}

func TestSystemDocumentsPreserveHarnessOrder(t *testing.T) {
	body := []byte(`{
		"model":"x","max_tokens":1,
		"system":[
			{"type":"text","text":"You are a coding agent."},
			{"type":"document","source":{"type":"text","media_type":"text/plain","data":"Z_DOC"}},
			{"type":"document","source":{"type":"text","media_type":"text/plain","data":"A_DOC"}}
		],
		"messages":[{"role":"user","content":"hi"}]
	}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	sys := objectsIn(doc["system"])
	if len(sys) < 3 {
		t.Fatalf("system blocks=%d", len(sys))
	}
	d0, _ := sys[1]["source"].(map[string]any)
	d1, _ := sys[2]["source"].(map[string]any)
	if dataOf(d0) != "Z_DOC" || dataOf(d1) != "A_DOC" {
		t.Fatalf("legacy system docs reordered: %v then %v", d0, d1)
	}
}

func TestLastUserDocumentsNotSortedOrMoved(t *testing.T) {
	body := []byte(`{
		"model":"x","max_tokens":1,
		"system":[
			{"type":"text","text":"You are a coding agent."},
			{"type":"document","source":{"type":"text","media_type":"text/plain","data":"LEGACY"}}
		],
		"messages":[{"role":"user","content":[
			{"type":"text","text":"use this"},
			{"type":"document","source":{"type":"text","media_type":"text/plain","data":"Z_NEW"}},
			{"type":"document","source":{"type":"text","media_type":"text/plain","data":"A_NEW"}}
		]}]
	}`)
	p := detectFor(t, "/v1/messages", body)
	before := parseTestJSON(t, body)
	out := assertIdempotent(t, body, p)
	after := parseTestJSON(t, out)
	if !bytes.Equal(mustCanonical(t, lastUserContent(before)), mustCanonical(t, lastUserContent(after))) {
		t.Fatalf("last user media must stay in the question\nbefore=%s\nafter=%s",
			mustCanonical(t, lastUserContent(before)), mustCanonical(t, lastUserContent(after)))
	}
	sys := objectsIn(after["system"])
	foundLegacy := false
	for _, b := range sys {
		if src, ok := b["source"].(map[string]any); ok && dataOf(src) == "LEGACY" {
			foundLegacy = true
		}
		if src, ok := b["source"].(map[string]any); ok {
			if dataOf(src) == "Z_NEW" || dataOf(src) == "A_NEW" {
				t.Fatal("this-turn docs must not move into system")
			}
		}
	}
	if !foundLegacy {
		t.Fatal("legacy system doc missing")
	}
}

func dataOf(src map[string]any) string {
	if src == nil {
		return ""
	}
	s, _ := src["data"].(string)
	return s
}

func TestProtectedZonesUnchangedExplicit(t *testing.T) {
	body := []byte(`{
		"model":"x","max_tokens":1,
		"system":"You are stable.\nCurrent time: 2026-08-27T10:00:00Z",
		"tools":[{"name":"read","input_schema":{"type":"object"}}],
		"messages":[
			{"role":"user","content":[{"type":"text","text":"use the tool"}]},
			{"role":"assistant","content":[
				{"type":"text","text":"calling"},
				{"type":"tool_use","id":"t1","name":"read","input":{"path":"a.go"}}
			]},
			{"role":"user","content":[
				{"type":"tool_result","tool_use_id":"t1","content":"package a"},
				{"type":"text","text":"continue 🚀"}
			]}
		]
	}`)
	p := detectFor(t, "/v1/messages", body)
	before := parseTestJSON(t, body)
	out := assertIdempotent(t, body, p)
	after := parseTestJSON(t, out)

	if !bytes.Equal(mustCanonical(t, lastUserContent(before)), mustCanonical(t, lastUserContent(after))) {
		t.Fatalf("last user changed\nbefore=%s\nafter=%s", mustCanonical(t, lastUserContent(before)), mustCanonical(t, lastUserContent(after)))
	}
	if !bytes.Equal(mustCanonical(t, assistantContents(before)), mustCanonical(t, assistantContents(after))) {
		t.Fatalf("assistant changed\nbefore=%s\nafter=%s", mustCanonical(t, assistantContents(before)), mustCanonical(t, assistantContents(after)))
	}
	if !bytes.Equal(mustCanonical(t, toolPayloads(before)), mustCanonical(t, toolPayloads(after))) {
		t.Fatalf("tool payloads changed\nbefore=%s\nafter=%s", mustCanonical(t, toolPayloads(before)), mustCanonical(t, toolPayloads(after)))
	}
}

func TestExplicitVsImplicitStripMatrix(t *testing.T) {
	body := []byte(`{
		"model":"x","max_tokens":1,
		"system":"stable\nCurrent time: 2026-08-27T10:00:00Z",
		"tools":[{"name":"b","input_schema":{"type":"object"}},{"name":"a","input_schema":{"type":"object"}}],
		"messages":[{"role":"user","content":"hi"}]
	}`)
	p := detectFor(t, "/v1/messages", body)
	explicit := assertIdempotent(t, body, p)
	if n := countCacheControlTest(explicit); n < 2 {
		t.Fatalf("explicit markers=%d want >=2 (tools+system) body=%s", n, explicit)
	}
	if bytes.Contains(explicit, []byte(`"cache_control":{"type":"ephemeral"}`)) == false {
		t.Fatal("missing ephemeral marker")
	}
	doc := parseTestJSON(t, explicit)
	if _, ok := doc["cache_control"]; ok {
		t.Fatal("top-level cache_control must not be set")
	}

	pImp := p
	pImp.Cache.Mode = provider.CacheImplicit
	imp := assertIdempotent(t, body, pImp)
	if countCacheControlTest(imp) != 0 {
		t.Fatalf("implicit injected/left cache_control: %s", imp)
	}

	pStrip := p
	pStrip.Cache.Mode = provider.CacheStrip
	st := assertIdempotent(t, body, pStrip)
	if countCacheControlTest(st) != 0 {
		t.Fatalf("strip left cache_control: %s", st)
	}

	pNone := p
	pNone.Cache.Mode = provider.CacheNone
	none := assertIdempotent(t, body, pNone)
	if countCacheControlTest(none) != 0 {
		t.Fatalf("none left cache_control: %s", none)
	}

	// prefix identity: tools order and stable system match across modes
	de := parseTestJSON(t, explicit)
	di := parseTestJSON(t, imp)
	if objectsIn(de["tools"])[0]["name"] != objectsIn(di["tools"])[0]["name"] {
		t.Fatal("tool sort diverged across cache modes")
	}
	if stableSystemText(de) != stableSystemText(di) {
		t.Fatalf("stable system diverged\n%q\n%q", stableSystemText(de), stableSystemText(di))
	}
}

func TestAlreadyFourMarkersNoFifth(t *testing.T) {
	body := []byte(`{
		"model":"x","max_tokens":1,
		"system":"more stable text for a fifth marker",
		"tools":[
			{"name":"a","input_schema":{"type":"object"},"cache_control":{"type":"ephemeral"}},
			{"name":"b","input_schema":{"type":"object"},"cache_control":{"type":"ephemeral"}},
			{"name":"c","input_schema":{"type":"object"},"cache_control":{"type":"ephemeral"}},
			{"name":"d","input_schema":{"type":"object"},"cache_control":{"type":"ephemeral"}}
		],
		"messages":[{"role":"user","content":"hi"}]
	}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	if n := countCacheControlTest(out); n != 4 {
		t.Fatalf("markers=%d want 4 (must not add 5th): %s", n, out)
	}
}

func TestExistingMarkersKeptNotMoved(t *testing.T) {
	body := []byte(`{
		"model":"x","max_tokens":1,
		"system":[{"type":"text","text":"stable","cache_control":{"type":"ephemeral"}}],
		"tools":[{"name":"only","input_schema":{"type":"object"}}],
		"messages":[{"role":"user","content":"hi"}]
	}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	sys := objectsIn(doc["system"])[0]
	if !hasCacheControl(sys) {
		t.Fatal("existing system marker was moved/removed")
	}
	tools := objectsIn(doc["tools"])
	if !hasCacheControl(tools[len(tools)-1]) {
		t.Fatal("expected tool marker in remaining budget")
	}
}

func TestLastUserCacheControlRelocated(t *testing.T) {
	body := []byte(`{
		"model":"x","max_tokens":1,
		"system":"stable policy",
		"tools":[{"name":"read","input_schema":{"type":"object"}}],
		"messages":[{"role":"user","content":[{"type":"text","text":"hi","cache_control":{"type":"ephemeral"}}]}]
	}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	last := objectsIn(doc["messages"])[len(objectsIn(doc["messages"]))-1]
	blocks := objectsIn(last["content"])
	if len(blocks) > 0 && hasCacheControl(blocks[0]) {
		t.Fatal("cache_control must not stay on last user")
	}
	if hasCacheControl(last) {
		t.Fatal("cache_control must not stay on last user message")
	}
	tools := objectsIn(doc["tools"])
	if !hasCacheControl(tools[len(tools)-1]) {
		t.Fatal("sticker should land on last tool")
	}
	sys := objectsIn(doc["system"])
	foundSys := false
	for _, b := range sys {
		if !isVolatileBlock(b) && hasCacheControl(b) {
			foundSys = true
		}
	}
	if !foundSys {
		t.Fatalf("expected a stable system sticker: %s", out)
	}
}

func TestVolatileCarrierCacheControlStripped(t *testing.T) {
	body := []byte(`{
		"model":"x","max_tokens":1,
		"system":[{"type":"text","text":"stable policy"},{"type":"text","text":"Volatile context:\nCurrent time: 2026-08-27T10:00:00Z","cache_control":{"type":"ephemeral"}}],
		"tools":[{"name":"read","input_schema":{"type":"object"}}],
		"messages":[{"role":"user","content":"hi"}]
	}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	for _, b := range objectsIn(doc["system"]) {
		if isVolatileBlock(b) && hasCacheControl(b) {
			t.Fatal("volatile carrier must not keep cache_control")
		}
	}
}

func TestGPT4oDoesNotInjectPromptCacheBreakpoint(t *testing.T) {
	body := []byte(`{
		"model":"gpt-4o",
		"messages":[{"role":"system","content":"stable policy"},{"role":"user","content":"hi"}]
	}`)
	p := detectFor(t, "/v1/chat/completions", body)
	out := assertIdempotent(t, body, p)
	if bytes.Contains(out, []byte("prompt_cache_breakpoint")) {
		t.Fatalf("gpt-4o must not get prompt_cache_breakpoint: %s", out)
	}
}

func TestGPT56InjectsPromptCacheBreakpointOnSystem(t *testing.T) {
	body := []byte(`{
		"model":"gpt-5.6",
		"messages":[{"role":"system","content":"stable policy that is long enough"},{"role":"user","content":"hi"}]
	}`)
	p := detectFor(t, "/v1/chat/completions", body)
	out := assertIdempotent(t, body, p)
	if !bytes.Contains(out, []byte("prompt_cache_breakpoint")) {
		t.Fatalf("gpt-5.6 should get prompt_cache_breakpoint: %s", out)
	}
	doc := parseTestJSON(t, out)
	assertOpenAIBreakpointOnLastStableSystem(t, doc)
}

func TestOpenAIStrayCacheControlStrippedNativeKept(t *testing.T) {
	body := []byte(`{
		"model":"gpt-4o",
		"prompt_cache_key":"sticky-1",
		"prompt_cache_options":{"ttl":"30m"},
		"messages":[
			{"role":"system","content":[
				{"type":"text","text":"stable","cache_control":{"type":"ephemeral"},"prompt_cache_breakpoint":{"mode":"explicit"}}
			]},
			{
				"role":"assistant",
				"tool_calls":[{
					"id":"c1",
					"type":"function",
					"function":{"name":"x","arguments":"{}"}
				}]
			},
			{"role":"tool","tool_call_id":"c1","content":"ok"},
			{"role":"user","content":"hi"}
		]
	}`)
	p := detectFor(t, "/v1/chat/completions", body)
	if p.Cache.Mode != provider.CacheStrip {
		t.Fatalf("Detect mode=%q want strip", p.Cache.Mode)
	}
	out := assertIdempotent(t, body, p)
	if bytes.Contains(out, []byte("cache_control")) {
		t.Fatalf("stray cache_control not stripped: %s", out)
	}
	if !bytes.Contains(out, []byte(`"prompt_cache_key":"sticky-1"`)) {
		t.Fatalf("prompt_cache_key dropped: %s", out)
	}
	if !bytes.Contains(out, []byte("prompt_cache_breakpoint")) {
		t.Fatalf("prompt_cache_breakpoint dropped: %s", out)
	}
	if !bytes.Contains(out, []byte("prompt_cache_options")) {
		t.Fatalf("prompt_cache_options dropped: %s", out)
	}
}

func TestResponsesBestEffortNoInject(t *testing.T) {
	body := []byte(`{
		"model":"gpt-4o",
		"input":[{"role":"user","content":"hi"}],
		"tools":[
			{"type":"function","function":{"name":"zeta","parameters":{"type":"object"}}},
			{"type":"function","function":{"name":"alpha","parameters":{"type":"object"}}}
		]
	}`)
	p := detectFor(t, "/v1/responses", body)
	out := assertIdempotent(t, body, p)
	if bytes.Contains(out, []byte("cache_control")) {
		t.Fatalf("responses must not inject cache_control: %s", out)
	}
	doc := parseTestJSON(t, out)
	tools := objectsIn(doc["tools"])
	n0, _ := tools[0]["function"].(map[string]any)
	if n0["name"] != "alpha" {
		t.Fatalf("tools not sorted: %s", out)
	}
}

func TestResponsesFallbackStripNoCarrier(t *testing.T) {
	body := []byte(`{
		"model":"gpt-4o",
		"instructions":"Be helpful. Current time: 2026-08-27T10:00:00Z"
	}`)
	p := detectFor(t, "/v1/responses", body)
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	instr, _ := doc["instructions"].(string)
	if strings.Contains(instr, "2026-08-27") || strings.Contains(instr, "Current time") {
		t.Fatalf("fallback did not strip: %q", instr)
	}
	if _, ok := doc["input"]; ok {
		t.Fatal("fallback must not invent an input array")
	}
	if _, ok := doc["messages"]; ok {
		t.Fatal("fallback must not invent messages")
	}
	if bytes.Contains(out, []byte(volatilePrefix)) {
		t.Fatalf("fallback invented a carrier: %s", out)
	}
}

func TestNoSystemMarkersOnToolsOnly(t *testing.T) {
	body := []byte(`{
		"model":"x","max_tokens":1,
		"tools":[{"name":"z","input_schema":{"type":"object"}},{"name":"a","input_schema":{"type":"object"}}],
		"messages":[{"role":"user","content":"hi"}]
	}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	if n := countCacheControlTest(out); n != 1 {
		t.Fatalf("markers=%d want 1 (tools only): %s", n, out)
	}
	doc := parseTestJSON(t, out)
	if _, ok := doc["system"]; ok {
		t.Fatal("must not invent system")
	}
}

func TestSystemStringConvertedOnlyWhenMarkerNeeded(t *testing.T) {
	body := []byte(`{"model":"x","max_tokens":1,"system":"only stable","messages":[{"role":"user","content":"hi"}]}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	doc := parseTestJSON(t, out)
	arr, ok := doc["system"].([]any)
	if !ok {
		t.Fatalf("system should convert to blocks to attach marker, got %T", doc["system"])
	}
	if !hasCacheControl(objectsIn(arr)[0]) {
		t.Fatal("missing system marker")
	}

	p.Cache.Mode = provider.CacheImplicit
	out = assertIdempotent(t, body, p)
	doc = parseTestJSON(t, out)
	if _, ok := doc["system"].(string); !ok {
		t.Fatalf("implicit must not convert system string, got %T %s", doc["system"], out)
	}
}

func TestUnicodeEmojiInSystem(t *testing.T) {
	body := []byte(`{"model":"x","max_tokens":1,"system":"Ship 🚀 it.\nCurrent time: 2026-08-27T10:00:00Z","messages":[{"role":"user","content":"hi"}]}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	if !bytes.Contains(out, []byte("🚀")) {
		t.Fatalf("emoji lost: %s", out)
	}
}

func TestEscapeHTMLFalse(t *testing.T) {
	body := []byte(`{"model":"x","max_tokens":1,"system":"use <div> & tags","messages":[{"role":"user","content":"hi"}]}`)
	p := detectFor(t, "/v1/messages", body)
	out := assertIdempotent(t, body, p)
	if bytes.Contains(out, []byte(`\u003c`)) {
		t.Fatalf("HTML escaped: %s", out)
	}
	if !bytes.Contains(out, []byte(`<div>`)) {
		t.Fatalf("missing raw <: %s", out)
	}
}

func TestNormalizeConcurrent(t *testing.T) {
	body := []byte(`{
		"model":"x","max_tokens":1,
		"system":"You are a coding agent.\nCurrent time: 2026-08-27T10:00:00Z\nsession_id=abc",
		"tools":[
			{"name":"write","input_schema":{"type":"object"}},
			{"name":"read","input_schema":{"type":"object"}}
		],
		"messages":[{"role":"user","content":"hi"}]
	}`)
	p := detectFor(t, "/v1/messages", body)
	want := normalizeOK(t, body, p)
	const n = 50
	got := make([][]byte, n)
	var wg sync.WaitGroup
	wg.Add(n)
	for i := 0; i < n; i++ {
		i := i
		go func() {
			defer wg.Done()
			out, err := Normalize(body, p)
			if err != nil {
				t.Errorf("Normalize: %v", err)
				return
			}
			got[i] = out
		}()
	}
	wg.Wait()
	for i, out := range got {
		if !bytes.Equal(out, want) {
			t.Fatalf("goroutine %d differed\nwant %s\ngot  %s", i, want, out)
		}
	}
}

func TestHugeBody(t *testing.T) {
	var b strings.Builder
	b.Grow(1 << 21)
	b.WriteString(`{"model":"x","max_tokens":1,"system":"`)
	b.WriteString(strings.Repeat("Follow the stable policy. ", 50000))
	b.WriteString(`Current time: 2026-08-27T10:00:00Z","tools":[`)
	for i := 0; i < 80; i++ {
		if i > 0 {
			b.WriteByte(',')
		}
		fmt.Fprintf(&b, `{"name":"tool_%02d","input_schema":{"type":"object"}}`, 79-i)
	}
	b.WriteString(`],"messages":[{"role":"user","content":"hi"}]}`)
	body := []byte(b.String())
	if len(body) < 1_000_000 {
		t.Fatalf("fixture too small: %d", len(body))
	}
	p := detectFor(t, "/v1/messages", body)
	out := normalizeOK(t, body, p)
	if !bytes.Contains(out, []byte(volatilePrefix)) {
		t.Fatal("huge body: volatile not moved")
	}
	again, err := Normalize(out, p)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(out, again) {
		t.Fatal("huge body not idempotent")
	}
}
