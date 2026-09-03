package gemini

import (
	"strings"
	"testing"
)

func TestOpenAIToGenerateContent(t *testing.T) {
	in := []byte(`{
		"model":"gemini-3.6-flash",
		"max_tokens":64,
		"messages":[
			{"role":"system","content":"frozen"},
			{"role":"user","content":"name the func"}
		],
		"tools":[{"type":"function","function":{"name":"read_file","parameters":{"type":"object"}}}]
	}`)
	out, model, err := OpenAIToGenerateContent(in)
	if err != nil {
		t.Fatal(err)
	}
	if model != "gemini-3.6-flash" {
		t.Fatalf("model=%s", model)
	}
	s := string(out)
	if !strings.Contains(s, `"system_instruction"`) || !strings.Contains(s, "frozen") {
		t.Fatalf("missing system: %s", s)
	}
	if !strings.Contains(s, `"role":"user"`) || !strings.Contains(s, "name the func") {
		t.Fatalf("missing user: %s", s)
	}
	if !strings.Contains(s, "functionDeclarations") || !strings.Contains(s, "read_file") {
		t.Fatalf("missing tools: %s", s)
	}
}

func TestGenerateContentToOpenAICached(t *testing.T) {
	in := []byte(`{
		"candidates":[{"content":{"parts":[{"text":"handleAPI"}],"role":"model"}}],
		"usageMetadata":{"promptTokenCount":5000,"candidatesTokenCount":2,"cachedContentTokenCount":4100}
	}`)
	out := GenerateContentToOpenAI(in, "gemini-3.6-flash")
	s := string(out)
	if !strings.Contains(s, `"cached_tokens":4100`) {
		t.Fatalf("missing cached_tokens: %s", s)
	}
	if !strings.Contains(s, "handleAPI") {
		t.Fatalf("missing reply: %s", s)
	}
}
