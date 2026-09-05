package normalizer

import "strings"

func openaiBreakpoint() map[string]any {
	return map[string]any{"mode": "explicit"}
}

func openaiBreakpointSupported(doc map[string]any) bool {
	if _, ok := doc["prompt_cache_options"]; ok {
		return true
	}
	if countPromptCacheBreakpoint(doc) > 0 {
		return true
	}
	m, _ := doc["model"].(string)
	m = strings.ToLower(m)
	return strings.Contains(m, "gpt-5.6") ||
		strings.Contains(m, "gpt-5.7") ||
		strings.Contains(m, "gpt-5.8") ||
		strings.Contains(m, "gpt-5.9")
}

func countPromptCacheBreakpoint(v any) int {
	n := 0
	var walk func(any)
	walk = func(x any) {
		switch t := x.(type) {
		case map[string]any:
			if _, ok := t["prompt_cache_breakpoint"]; ok {
				n++
			}
			for _, child := range t {
				walk(child)
			}
		case []any:
			for _, child := range t {
				walk(child)
			}
		}
	}
	walk(v)
	return n
}

func injectOpenAIBreakpoints(doc map[string]any) {
	if !openaiBreakpointSupported(doc) {
		return
	}
	stripMisplacedOpenAIBreakpoints(doc)
	if countPromptCacheBreakpoint(doc) >= 4 {
		return
	}
	block := lastOpenAIStableTextBlock(doc)
	if block == nil {
		return
	}
	if _, ok := block["prompt_cache_breakpoint"]; ok {
		return
	}
	block["prompt_cache_breakpoint"] = openaiBreakpoint()
}

func stripMisplacedOpenAIBreakpoints(doc map[string]any) {
	stripOpenAIBreakpointsInMessages(doc["messages"])
	stripOpenAIBreakpointsInMessages(doc["input"])
}

func stripOpenAIBreakpointsInMessages(raw any) {
	msgs, ok := raw.([]any)
	if !ok || len(msgs) == 0 {
		return
	}
	lastUser := lastUserIndex(msgs)
	for i, item := range msgs {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		if isVolatileMessage(m) || i == lastUser {
			delete(m, "prompt_cache_breakpoint")
			stripPromptCacheBreakpointDeep(m["content"])
			continue
		}
		stripUnstableOpenAIBlockMarkers(m)
	}
}

func stripPromptCacheBreakpointDeep(v any) {
	switch t := v.(type) {
	case map[string]any:
		delete(t, "prompt_cache_breakpoint")
		for _, child := range t {
			stripPromptCacheBreakpointDeep(child)
		}
	case []any:
		for _, child := range t {
			stripPromptCacheBreakpointDeep(child)
		}
	}
}

func stripUnstableOpenAIBlockMarkers(m map[string]any) {
	arr, ok := m["content"].([]any)
	if !ok {
		return
	}
	for _, b := range arr {
		bm, ok := b.(map[string]any)
		if !ok {
			continue
		}
		t, _ := bm["type"].(string)
		if isUnstableContentType(t) {
			delete(bm, "prompt_cache_breakpoint")
		}
	}
}

func lastOpenAIStableTextBlock(doc map[string]any) map[string]any {
	if b := lastStableTextInMessageList(doc["messages"]); b != nil {
		return b
	}
	return lastStableTextInMessageList(doc["input"])
}

func lastStableTextInMessageList(raw any) map[string]any {
	msgs, ok := raw.([]any)
	if !ok {
		return nil
	}
	lastUser := lastUserIndex(msgs)
	var last map[string]any
	for i, item := range msgs {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		if isProtectedMessage(m, i == lastUser) || isVolatileMessage(m) {
			continue
		}
		if roleOf(m) != "system" && roleOf(m) != "developer" {
			continue
		}
		if b := lastTextContentBlock(m); b != nil {
			last = b
		}
	}
	return last
}

func lastTextContentBlock(m map[string]any) map[string]any {
	switch c := m["content"].(type) {
	case string:
		if isVolatileText(c) {
			return nil
		}
		block := map[string]any{"type": "text", "text": c}
		m["content"] = []any{block}
		return block
	case []any:
		var last map[string]any
		for _, item := range c {
			b, ok := item.(map[string]any)
			if !ok {
				continue
			}
			if isVolatileBlock(b) {
				continue
			}
			t, _ := b["type"].(string)
			if t == "text" || t == "input_text" || t == "" {
				if _, ok := b["text"].(string); ok {
					last = b
				}
			}
		}
		return last
	default:
		return nil
	}
}
