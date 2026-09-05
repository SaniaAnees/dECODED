package normalizer

import "sort"

func sortTools(doc map[string]any) {
	raw, ok := doc["tools"].([]any)
	if !ok || len(raw) < 2 {
		return
	}
	type item struct {
		v    any
		name string
		hash string
	}
	items := make([]item, len(raw))
	for i, v := range raw {
		items[i] = item{v: v, name: toolName(v), hash: hashForToolSort(v)}
	}
	sort.SliceStable(items, func(i, j int) bool {
		if items[i].name != items[j].name {
			return items[i].name < items[j].name
		}
		return items[i].hash < items[j].hash
	})
	out := make([]any, len(items))
	for i, it := range items {
		out[i] = it.v
	}
	doc["tools"] = out
}

// hashForToolSort ignores cache_control so injecting a marker on the last
// tool cannot change sort order (idempotence).
func hashForToolSort(v any) string {
	m, ok := v.(map[string]any)
	if !ok {
		return hashCanonical(v)
	}
	if _, has := m["cache_control"]; !has {
		return hashCanonical(v)
	}
	cp := make(map[string]any, len(m)-1)
	for k, val := range m {
		if k == "cache_control" {
			continue
		}
		cp[k] = val
	}
	return hashCanonical(cp)
}

// toolName prefers OpenAI function.name, else top-level name (Anthropic).
func toolName(v any) string {
	m, ok := v.(map[string]any)
	if !ok {
		return ""
	}
	if fn, ok := m["function"].(map[string]any); ok {
		if n, ok := fn["name"].(string); ok && n != "" {
			return n
		}
	}
	if n, ok := m["name"].(string); ok {
		return n
	}
	return ""
}
