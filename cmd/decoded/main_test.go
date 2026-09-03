package main

import (
	"strings"
	"testing"
)

func TestStartBannerPAYG(t *testing.T) {
	t.Setenv("DECODED_OPENAI_BASE_URL", "https://api.mistral.ai/v1")
	t.Setenv("DECODED_ANTHROPIC_BASE_URL", "")

	got := startBanner("127.0.0.1:8080", "windows")
	for _, want := range []string{
		"decoded PAYG proxy",
		"http://127.0.0.1:8080",
		"/health",
		"/stats",
		"https://api.mistral.ai/v1",
		`$env:OPENAI_BASE_URL="http://127.0.0.1:8080/v1"`,
		`$env:ANTHROPIC_BASE_URL="http://127.0.0.1:8080/v1"`,
		"DECODED_OPENAI_BASE_URL",
		"github.com/SaniaAnees/dECODED/issues",
	} {
		if !strings.Contains(got, want) {
			t.Fatalf("banner missing %q\n%s", want, got)
		}
	}

	unix := startBanner("", "linux")
	if !strings.Contains(unix, `export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"`) {
		t.Fatalf("unix banner missing OPENAI_BASE_URL\n%s", unix)
	}
	if !strings.Contains(unix, "https://api.anthropic.com") {
		t.Fatalf("empty anthropic env should print default\n%s", unix)
	}
}

func TestVersionDefault(t *testing.T) {
	if version != "dev" {
		t.Fatalf("untagged version=%q want dev", version)
	}
}
