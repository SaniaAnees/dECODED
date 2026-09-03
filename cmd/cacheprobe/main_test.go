package main

import (
	"encoding/json"
	"os"
	"strings"
	"testing"
)

func TestMain(m *testing.M) {
	probeRepo = resolveProbeRepo("")
	os.Exit(m.Run())
}

func TestTurnBodiesShareFrozenPrefix(t *testing.T) {
	sys := stableSystem()
	tools, _ := json.Marshal(stableTools())

	t1 := map[string]any{
		"model": "gemini-3.6-flash",
		"messages": []any{
			map[string]any{"role": "system", "content": sys},
			map[string]any{"role": "user", "content": turnPrompts[0]},
		},
		"tools": stableTools(),
	}
	t2 := map[string]any{
		"model": "gemini-3.6-flash",
		"messages": []any{
			map[string]any{"role": "system", "content": sys},
			map[string]any{"role": "user", "content": turnPrompts[0]},
			map[string]any{"role": "assistant", "content": "ping"},
			map[string]any{"role": "user", "content": turnPrompts[1]},
		},
		"tools": stableTools(),
	}

	b1, _ := json.Marshal(t1)
	b2, _ := json.Marshal(t2)
	if string(b1) == string(b2) {
		t.Fatal("turn 1 and turn 2 JSON must differ (new user line)")
	}
	var d1, d2 map[string]any
	if err := json.Unmarshal(b1, &d1); err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal(b2, &d2); err != nil {
		t.Fatal(err)
	}
	m1 := d1["messages"].([]any)[0].(map[string]any)["content"]
	m2 := d2["messages"].([]any)[0].(map[string]any)["content"]
	if m1 != m2 {
		t.Fatal("system must be identical")
	}
	tb2, _ := json.Marshal(d2["tools"])
	if string(tools) != string(tb2) {
		t.Fatal("tools must be identical")
	}
	last := d2["messages"].([]any)[len(d2["messages"].([]any))-1].(map[string]any)
	if last["content"] != turnPrompts[1] {
		t.Fatalf("last user = %v", last["content"])
	}
}

func TestToolsForTurnMutate(t *testing.T) {
	before := toolsForTurn(10, 11)
	after := toolsForTurn(11, 11)
	if len(before) != 2 {
		t.Fatalf("before mutate want 2 tools, got %d", len(before))
	}
	if len(after) != 3 {
		t.Fatalf("after mutate want 3 tools, got %d", len(after))
	}
	if systemForTurn(20, 21) == systemForTurn(21, 21) {
		t.Fatal("file mutate must change system")
	}
	if systemForTurn(21, 21) == stableSystem() {
		t.Fatal("mutated system must not equal frozen main.go system")
	}
}

func TestHardSetupSharpChanges(t *testing.T) {
	s5 := hardSetup(5)
	s6 := hardSetup(6)
	s11 := hardSetup(11)
	s14 := hardSetup(14)
	s17 := hardSetup(17)
	s21 := hardSetup(21)
	s24 := hardSetup(24)
	s27 := hardSetup(27)
	if len(s5.tools) != 2 {
		t.Fatalf("turn 5 tools=%d", len(s5.tools))
	}
	if len(s6.tools) != 3 {
		t.Fatalf("turn 6 should add a tool, got %d", len(s6.tools))
	}
	if len(s11.tools) != 2 || s11.system != s5.system {
		t.Fatal("turn 11 should replace tools but keep main.go system")
	}
	if len(s14.tools) != 2 || s14.system != s5.system {
		t.Fatal("turn 14 should restore original tools+system")
	}
	if !strings.HasPrefix(s17.system, probeClock) {
		t.Fatal("turn 17 clock must be PREFIX")
	}
	if s21.system == s17.system {
		t.Fatal("turn 21 must swap frozen file")
	}
	if strings.HasPrefix(s24.system, probeClock) || !strings.HasSuffix(strings.TrimSpace(s24.system), strings.TrimSpace(probeClock)) {
		t.Fatal("turn 24 clock must be SUFFIX not PREFIX")
	}
	if s27.system == s24.system {
		t.Fatal("turn 27 must swap file back to main.go")
	}
}

func TestFrozenFileIsShopNotDecoded(t *testing.T) {
	sys := stableSystem()
	if strings.Contains(sys, "handleAPI") {
		t.Fatal("probe must not freeze decoded handle.go")
	}
	if !strings.Contains(sys, "GET /items") {
		t.Fatalf("want shop main.go in system, got prefix %q", sys[:min(80, len(sys))])
	}
}

func TestThirtyPrompts(t *testing.T) {
	if len(turnPrompts) != 30 {
		t.Fatalf("got %d prompts", len(turnPrompts))
	}
}

func TestUsageGeminiNativeFields(t *testing.T) {
	raw := []byte(`{"usageMetadata":{"promptTokenCount":5000,"cachedContentTokenCount":4100}}`)
	if cachedTokens(raw) != 4100 || promptTokens(raw) != 5000 {
		t.Fatalf("cached=%d prompt=%d", cachedTokens(raw), promptTokens(raw))
	}
}

func TestDailyQuota429(t *testing.T) {
	if !dailyQuota429([]byte(`generate_content_free_tier_requests limit: 20`)) {
		t.Fatal("want daily cap")
	}
	if dailyQuota429([]byte(`RESOURCE_EXHAUSTED rate limit per minute`)) {
		t.Fatal("RPM is not the daily cap")
	}
	rpm := []byte(`generate_content_free_tier_requests, limit: 5, model: gemini-3.6-flash Please retry in 47.7s.`)
	if dailyQuota429(rpm) {
		t.Fatal("retry-in is RPM, not the daily cap")
	}
}

func TestUsageCachePercent(t *testing.T) {
	raw := []byte(`{"usage":{"prompt_tokens":200,"prompt_tokens_details":{"cached_tokens":150}}}`)
	if cachedTokens(raw) != 150 || promptTokens(raw) != 200 {
		t.Fatalf("cached=%d prompt=%d", cachedTokens(raw), promptTokens(raw))
	}
}
