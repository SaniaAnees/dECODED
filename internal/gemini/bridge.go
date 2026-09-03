package gemini

import (
	"encoding/json"
	"fmt"
	"strings"
)

// OpenAIToGenerateContent maps an OpenAI chat body to Gemini generateContent.
func OpenAIToGenerateContent(body []byte) ([]byte, string, error) {
	var doc map[string]any
	if err := json.Unmarshal(body, &doc); err != nil {
		return nil, "", err
	}
	model, _ := doc["model"].(string)
	if model == "" {
		model = "gemini-3.6-flash"
	}

	var sys []string
	var contents []any
	msgs, _ := doc["messages"].([]any)
	for _, item := range msgs {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		role, _ := m["role"].(string)
		text := contentText(m["content"])
		switch role {
		case "system", "developer":
			if text != "" {
				sys = append(sys, text)
			}
		case "assistant":
			contents = append(contents, map[string]any{
				"role":  "model",
				"parts": []any{map[string]any{"text": text}},
			})
		default: // user, tool
			contents = append(contents, map[string]any{
				"role":  "user",
				"parts": []any{map[string]any{"text": text}},
			})
		}
	}

	out := map[string]any{"contents": contents}
	if len(sys) > 0 {
		out["system_instruction"] = map[string]any{
			"parts": []any{map[string]any{"text": strings.Join(sys, "\n")}},
		}
	}
	if tools := geminiTools(doc["tools"]); len(tools) > 0 {
		out["tools"] = tools
	}
	maxOut := int64(0)
	if n := asInt(doc["max_tokens"]); n > 0 {
		maxOut = n
	}
	if n := asInt(doc["max_completion_tokens"]); n > 0 {
		maxOut = n
	}
	if maxOut > 0 {
		out["generationConfig"] = map[string]any{"maxOutputTokens": maxOut}
	}
	raw, err := json.Marshal(out)
	return raw, model, err
}

// GenerateContentToOpenAI maps a Gemini reply to OpenAI chat.completion JSON,
// copying cachedContentTokenCount into prompt_tokens_details.cached_tokens.
func GenerateContentToOpenAI(body []byte, model string) []byte {
	var doc map[string]any
	if err := json.Unmarshal(body, &doc); err != nil {
		return body
	}
	text := candidateText(doc)
	meta, _ := doc["usageMetadata"].(map[string]any)
	prompt := asInt(meta["promptTokenCount"])
	cached := asInt(meta["cachedContentTokenCount"])
	if cached == 0 {
		cached = asInt(meta["cached_content_token_count"])
	}
	comp := asInt(meta["candidatesTokenCount"])
	out := map[string]any{
		"id":     "decoded-gemini",
		"object": "chat.completion",
		"model":  model,
		"choices": []any{
			map[string]any{
				"index":         0,
				"finish_reason": "stop",
				"message": map[string]any{
					"role":    "assistant",
					"content": text,
				},
			},
		},
		"usage": map[string]any{
			"prompt_tokens":     prompt,
			"completion_tokens": comp,
			"total_tokens":      prompt + comp,
			"prompt_tokens_details": map[string]any{
				"cached_tokens": cached,
			},
		},
	}
	raw, err := json.Marshal(out)
	if err != nil {
		return body
	}
	return raw
}

func contentText(v any) string {
	switch t := v.(type) {
	case string:
		return t
	case []any:
		var b strings.Builder
		for _, p := range t {
			m, ok := p.(map[string]any)
			if !ok {
				continue
			}
			if s, _ := m["text"].(string); s != "" {
				b.WriteString(s)
			}
		}
		return b.String()
	default:
		return fmt.Sprint(v)
	}
}

func geminiTools(raw any) []any {
	list, ok := raw.([]any)
	if !ok || len(list) == 0 {
		return nil
	}
	var decls []any
	for _, item := range list {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		fn, _ := m["function"].(map[string]any)
		if fn == nil {
			continue
		}
		decl := map[string]any{"name": fn["name"]}
		if d := fn["description"]; d != nil {
			decl["description"] = d
		}
		if p := fn["parameters"]; p != nil {
			decl["parameters"] = p
		}
		decls = append(decls, decl)
	}
	if len(decls) == 0 {
		return nil
	}
	return []any{map[string]any{"functionDeclarations": decls}}
}

func candidateText(doc map[string]any) string {
	cands, _ := doc["candidates"].([]any)
	if len(cands) == 0 {
		return ""
	}
	c0, _ := cands[0].(map[string]any)
	content, _ := c0["content"].(map[string]any)
	if content == nil {
		return ""
	}
	parts, _ := content["parts"].([]any)
	var b strings.Builder
	for _, p := range parts {
		m, _ := p.(map[string]any)
		if s, _ := m["text"].(string); s != "" {
			b.WriteString(s)
		}
	}
	return b.String()
}

func asInt(v any) int64 {
	switch t := v.(type) {
	case float64:
		return int64(t)
	case int:
		return int64(t)
	case int64:
		return t
	case json.Number:
		n, _ := t.Int64()
		return n
	default:
		return 0
	}
}
