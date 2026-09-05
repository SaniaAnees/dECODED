package normalizer

import "github.com/SaniaAnees/dECODED/internal/provider"

func ephemeralCacheControl() map[string]any {
	return map[string]any{"type": "ephemeral"}
}

func applyCachePolicy(doc map[string]any, p provider.Provider) {
	if p.Cache.Mode == provider.CacheExplicit && p.Shape == provider.ShapeAnthropic {
		injectCacheControl(doc, p)
		return
	}
	stripCacheControl(doc)
	if p.Cache.Mode == provider.CacheStrip || p.Cache.Mode == provider.CacheNone {
		return
	}
	if p.Shape == provider.ShapeOpenAI || p.Shape == provider.ShapeResponses {
		injectOpenAIBreakpoints(doc)
	}
}

func stripCacheControl(v any) {
	switch t := v.(type) {
	case map[string]any:
		delete(t, "cache_control")
		for _, child := range t {
			stripCacheControl(child)
		}
	case []any:
		for _, child := range t {
			stripCacheControl(child)
		}
	}
}

func countCacheControl(v any) int {
	n := 0
	var walk func(any)
	walk = func(x any) {
		switch t := x.(type) {
		case map[string]any:
			if _, ok := t["cache_control"]; ok {
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

func hasCacheControl(m map[string]any) bool {
	_, ok := m["cache_control"]
	return ok
}

func markEphemeral(m map[string]any) bool {
	if m == nil || hasCacheControl(m) {
		return false
	}
	m["cache_control"] = ephemeralCacheControl()
	return true
}

func lastToolObject(doc map[string]any) map[string]any {
	arr, ok := doc["tools"].([]any)
	if !ok || len(arr) == 0 {
		return nil
	}
	for i := len(arr) - 1; i >= 0; i-- {
		if m, ok := arr[i].(map[string]any); ok {
			return m
		}
	}
	return nil
}

func ensureSystemBlocksForMarker(doc map[string]any) {
	s, ok := doc["system"].(string)
	if !ok {
		return
	}
	doc["system"] = []any{
		map[string]any{
			"type": "text",
			"text": s,
		},
	}
}

func lastStableSystemText(doc map[string]any) map[string]any {
	arr, ok := doc["system"].([]any)
	if !ok {
		return nil
	}
	var last map[string]any
	for _, b := range arr {
		m, ok := b.(map[string]any)
		if !ok {
			continue
		}
		if isVolatileBlock(m) {
			continue
		}
		t, _ := m["type"].(string)
		if t != "text" && t != "" {
			continue
		}
		if _, ok := m["text"].(string); ok {
			last = m
		}
	}
	return last
}

var unstableContentTypes = map[string]struct{}{
	"tool_use":    {},
	"tool_result": {},
	"thinking":    {},
	"tool_calls":  {},
}

func isUnstableContentType(t string) bool {
	_, ok := unstableContentTypes[t]
	return ok
}

// stripMisplacedCacheControl removes stickers that would hash a changing
// suffix: volatile carrier, current user turn, and tool_use / tool_result /
// thinking blocks.
// Remaining budget is then filled on last tool / stable system / stable media.
func stripMisplacedCacheControl(doc map[string]any) {
	if arr, ok := doc["system"].([]any); ok {
		for _, b := range arr {
			m, ok := b.(map[string]any)
			if !ok {
				continue
			}
			if isVolatileBlock(m) {
				delete(m, "cache_control")
			}
		}
	}

	msgs, ok := doc["messages"].([]any)
	if !ok || len(msgs) == 0 {
		return
	}
	lastUser := lastUserIndex(msgs)
	for i, raw := range msgs {
		m, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		if isVolatileMessage(m) || i == lastUser {
			stripCacheControl(m)
			continue
		}
		stripUnstableBlockMarkers(m)
	}
}

func stripUnstableBlockMarkers(m map[string]any) {
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
			delete(bm, "cache_control")
		}
	}
}

func lastStableMediaBlock(doc map[string]any) map[string]any {
	var last map[string]any
	if arr, ok := doc["system"].([]any); ok {
		for _, b := range arr {
			m, ok := b.(map[string]any)
			if !ok {
				continue
			}
			if isVolatileBlock(m) {
				continue
			}
			t, _ := m["type"].(string)
			if isMediaType(t) {
				last = m
			}
		}
	}
	msgs, ok := doc["messages"].([]any)
	if !ok {
		return last
	}
	lastUser := lastUserIndex(msgs)
	for i, raw := range msgs {
		m, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		if isProtectedMessage(m, i == lastUser) {
			continue
		}
		if isVolatileMessage(m) {
			continue
		}
		content, ok := m["content"].([]any)
		if !ok {
			continue
		}
		for _, b := range content {
			bm, ok := b.(map[string]any)
			if !ok {
				continue
			}
			t, _ := bm["type"].(string)
			if t == "tool_use" || t == "tool_result" || t == "thinking" || t == "tool_calls" {
				continue
			}
			if isMediaType(t) {
				last = bm
			}
		}
	}
	return last
}

func injectCacheControl(doc map[string]any, p provider.Provider) {
	// Never emit top-level request cache_control.
	delete(doc, "cache_control")

	_, systemIsString := doc["system"].(string)
	if systemIsString {
		ensureSystemBlocksForMarker(doc)
	}
	stripMisplacedCacheControl(doc)

	maxBP := p.Cache.MaxBreakpoints
	if maxBP <= 0 {
		maxBP = 4
	}
	remaining := maxBP - countCacheControl(doc)
	if remaining <= 0 {
		return
	}

	try := func(m map[string]any) {
		if remaining <= 0 || m == nil {
			return
		}
		if markEphemeral(m) {
			remaining--
		}
	}

	try(lastToolObject(doc))

	if remaining > 0 {
		if _, ok := doc["system"].([]any); ok {
			try(lastStableSystemText(doc))
		}
	}

	if remaining > 0 {
		try(lastStableMediaBlock(doc))
	}
}
