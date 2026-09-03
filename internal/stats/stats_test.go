package stats

import (
	"testing"

	"github.com/SaniaAnees/dECODED/internal/provider"
)

func TestRecordHitRateAndTokens(t *testing.T) {
	s := New()
	s.Record(Usage{ReadTokens: 100, WriteTokens: 20, Shape: provider.ShapeAnthropic})
	s.Record(Usage{ReadTokens: 0, WriteTokens: 50, Shape: provider.ShapeAnthropic})
	got := s.Snapshot()
	if got.Requests != 2 || got.Hits != 1 {
		t.Fatalf("requests=%d hits=%d", got.Requests, got.Hits)
	}
	if got.TokensSaved != 100 {
		t.Fatalf("tokensSaved=%d", got.TokensSaved)
	}
	if got.HitRate != 0.5 {
		t.Fatalf("hitRate=%v", got.HitRate)
	}
	if got.CostSaved <= 0 {
		t.Fatal("costSaved should be >0 for Anthropic cache-read")
	}
}

func TestFromResponseAnthropicJSON(t *testing.T) {
	body := []byte(`{"usage":{"cache_read_input_tokens":12,"cache_creation_input_tokens":3}}`)
	prof := provider.UsageProfile{
		HitPaths:   []string{"usage.cache_read_input_tokens"},
		WritePaths: []string{"usage.cache_creation_input_tokens"},
	}
	u := FromResponse(body, nil, prof)
	if u.ReadTokens != 12 || u.WriteTokens != 3 {
		t.Fatalf("got read=%d write=%d", u.ReadTokens, u.WriteTokens)
	}
}

func TestFromResponseSSEAndFireworksHeader(t *testing.T) {
	sse := []byte("event: message_delta\ndata: {\"usage\":{\"cache_read_input_tokens\":7}}\n\n")
	prof := provider.UsageProfile{HitPaths: []string{"usage.cache_read_input_tokens"}}
	u := FromResponse(sse, nil, prof)
	if u.ReadTokens != 7 {
		t.Fatalf("sse read=%d", u.ReadTokens)
	}
	u = FromResponse(nil, map[string][]string{
		"Fireworks-Cached-Prompt-Tokens": {"42"},
	}, prof)
	if u.ReadTokens != 42 {
		t.Fatalf("header read=%d", u.ReadTokens)
	}
}

func TestFromResponseGeminiUsageMetadata(t *testing.T) {
	body := []byte(`{"usageMetadata":{"promptTokenCount":5000,"cachedContentTokenCount":4200}}`)
	u := FromResponse(body, nil, provider.UsageProfile{})
	if u.ReadTokens != 4200 || u.InputTokens != 5000 {
		t.Fatalf("read=%d input=%d", u.ReadTokens, u.InputTokens)
	}
}

func TestFromResponsePromptTokensAndCachePct(t *testing.T) {
	body := []byte(`{"usage":{"prompt_tokens":1000,"prompt_tokens_details":{"cached_tokens":900}}}`)
	prof := provider.UsageProfile{
		HitPaths: []string{"usage.prompt_tokens_details.cached_tokens"},
	}
	u := FromResponse(body, nil, prof)
	if u.ReadTokens != 900 || u.InputTokens != 1000 {
		t.Fatalf("read=%d input=%d", u.ReadTokens, u.InputTokens)
	}
	s := New()
	s.Record(u)
	got := s.Snapshot()
	if got.CachePct != 90 {
		t.Fatalf("cachePct=%v", got.CachePct)
	}
}

func TestGroqNoCost(t *testing.T) {
	s := New()
	s.Record(Usage{ReadTokens: 100, Shape: provider.ShapeOpenAI, NoCost: true})
	if s.Snapshot().CostSaved != 0 {
		t.Fatalf("costSaved=%v want 0", s.Snapshot().CostSaved)
	}
	if s.Snapshot().TokensSaved != 100 {
		t.Fatalf("tokens still counted")
	}
}
