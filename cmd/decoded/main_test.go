package main

import (
	"strings"
	"testing"
)

func TestStartBannerPAYG(t *testing.T) {
	got := startBanner("127.0.0.1:8080", "windows")
	for _, want := range []string{
		"decoded PAYG proxy",
		"http://127.0.0.1:8080",
		"/health",
		"/stats",
		"Agent shell (second terminal):",
		`$env:ANTHROPIC_BASE_URL="http://127.0.0.1:8080/v1"`,
		`$env:OPENAI_BASE_URL="http://127.0.0.1:8080/v1"`,
	} {
		if !strings.Contains(got, want) {
			t.Fatalf("banner missing %q\n%s", want, got)
		}
	}

	unix := startBanner("", "linux")
	if !strings.Contains(unix, `export ANTHROPIC_BASE_URL="http://127.0.0.1:8080/v1"`) {
		t.Fatalf("unix banner missing ANTHROPIC_BASE_URL\n%s", unix)
	}
	if !strings.Contains(unix, `export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"`) {
		t.Fatalf("unix banner missing OPENAI_BASE_URL\n%s", unix)
	}
}

func TestVersionDefault(t *testing.T) {
	if version != "dev" {
		t.Fatalf("untagged version=%q want dev", version)
	}
}
