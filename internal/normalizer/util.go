package normalizer

func objectsIn(v any) []map[string]any {
	arr, ok := v.([]any)
	if !ok {
		return nil
	}
	out := make([]map[string]any, 0, len(arr))
	for _, item := range arr {
		if m, ok := item.(map[string]any); ok {
			out = append(out, m)
		}
	}
	return out
}

func roleOf(m map[string]any) string {
	s, _ := m["role"].(string)
	return s
}

func lastUserIndex(messages []any) int {
	last := -1
	for i, item := range messages {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		if roleOf(m) == "user" {
			last = i
		}
	}
	return last
}

func insertAt(arr []any, idx int, v any) []any {
	if idx < 0 {
		idx = 0
	}
	if idx > len(arr) {
		idx = len(arr)
	}
	out := make([]any, 0, len(arr)+1)
	out = append(out, arr[:idx]...)
	out = append(out, v)
	out = append(out, arr[idx:]...)
	return out
}

func isProtectedMessage(m map[string]any, isLastUser bool) bool {
	if isLastUser {
		return true
	}
	switch roleOf(m) {
	case "assistant", "tool":
		return true
	default:
		return false
	}
}
