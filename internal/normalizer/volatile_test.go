package normalizer

import (
	"strings"
	"testing"
)

func TestFindISO8601(t *testing.T) {
	samples := []string{
		"2026-08-27T10:00:00Z",
		"2026-08-27T10:00:00.123Z",
		"2026-08-27T10:00:00.123456789Z",
		"2026-08-27T10:00:00+05:30",
		"2026-08-27T10:00:00-08:00",
		"2026-08-27T10:00:00+0530",
	}
	for _, s := range samples {
		spans := findISO8601("ts=" + s + " end")
		if len(spans) != 1 {
			t.Fatalf("%s: got %d spans", s, len(spans))
		}
		if spans[0].item.value != s {
			t.Fatalf("%s: value %q", s, spans[0].item.value)
		}
	}
	if len(findISO8601("date 2026-08-27 only")) != 0 {
		t.Fatal("date-only must not match (datetime required)")
	}
}

func TestFindLabeledTime(t *testing.T) {
	s := "You are helpful.\nCurrent time: 2026-08-27T10:00:00Z\nStay stable."
	spans := findLabeledTime(s)
	if len(spans) != 1 {
		t.Fatalf("got %d spans: %+v", len(spans), spans)
	}
	if spans[0].item.key != "Current time" || spans[0].item.value != "2026-08-27T10:00:00Z" {
		t.Fatalf("item=%+v", spans[0].item)
	}

	s2 := "Today is: Thursday"
	spans = findLabeledTime(s2)
	if len(spans) != 1 || spans[0].item.key != "Today is" || spans[0].item.value != "Thursday" {
		t.Fatalf("Today is: %+v", spans)
	}

	s3 := "Current Time: 2026-01-01T00:00:00Z"
	spans = findLabeledTime(s3)
	if len(spans) != 1 || spans[0].item.key != "Current time" {
		t.Fatalf("Current Time: %+v", spans)
	}
}

func TestFindUUIDv4(t *testing.T) {
	ok := "550e8400-e29b-41d4-a716-446655440000"
	spans := findUUIDv4("id=" + ok)
	if len(spans) != 1 || spans[0].item.value != ok {
		t.Fatalf("v4: %+v", spans)
	}
	// version nibble is 1, not 4
	if len(findUUIDv4("550e8400-e29b-11d4-a716-446655440000")) != 0 {
		t.Fatal("uuid v1 must not match")
	}
}

func TestFindSessionID(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"session_id=abc-123", "abc-123"},
		{"sessionId=xyz", "xyz"},
		{"session-id: foo_bar", "foo_bar"},
	}
	for _, tc := range cases {
		spans := findSessionID(tc.in)
		if len(spans) != 1 || spans[0].item.value != tc.want {
			t.Fatalf("%q: %+v want %q", tc.in, spans, tc.want)
		}
	}
}

func TestExtractDedupAndWhitespace(t *testing.T) {
	s := "Rules.\nCurrent time: 2026-08-27T10:00:00Z\nCurrent time: 2026-08-27T10:00:00Z\nMore   rules."
	cleaned, items := extractFromText(s)
	if cleaned != "Rules.\n\nMore rules." {
		t.Fatalf("cleaned=%q", cleaned)
	}
	if len(items) != 1 {
		t.Fatalf("dedup failed: %+v", items)
	}
}

func TestExtractDoesNotStripBareIntegers(t *testing.T) {
	s := "Use port 8080123456 and max_tokens 999999999999"
	cleaned, items := extractFromText(s)
	if cleaned != s {
		t.Fatalf("stripped numbers: %q", cleaned)
	}
	if len(items) != 0 {
		t.Fatalf("items=%+v", items)
	}
}

func TestCollapseUnicodePreserved(t *testing.T) {
	s := "Keep 🚀 ready.\nCurrent time: 2026-08-27T10:00:00Z"
	cleaned, items := extractFromText(s)
	if !strings.Contains(cleaned, "🚀") {
		t.Fatalf("emoji lost: %q", cleaned)
	}
	if len(items) != 1 {
		t.Fatalf("items=%+v", items)
	}
}
