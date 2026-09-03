package normalizer

import "sort"

var mediaTypes = map[string]struct{}{
	"document":        {},
	"image":           {},
	"image_url":       {},
	"input_image":     {},
	"input_file":      {},
	"file":            {},
	"input_image_url": {},
}

func isMediaType(t string) bool {
	_, ok := mediaTypes[t]
	return ok
}

func sortMedia(doc map[string]any) {
	// system[] is the legacy pile (persona, architecture.md, repo docs).
	// Do not hash-sort it: inserting a new doc into a sorted run would
	// reorder the frozen files and miss the prefix. Harness order stays.
	// New screenshots / research belong on the last user message (unsorted).
	if arr, ok := doc["messages"].([]any); ok {
		sortMediaInMessages(arr)
	}
	if arr, ok := doc["input"].([]any); ok {
		sortMediaInMessages(arr)
	}
}

func sortMediaInMessages(messages []any) {
	lastUser := lastUserIndex(messages)
	for i, raw := range messages {
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
		arr, ok := m["content"].([]any)
		if !ok || len(arr) < 2 {
			continue
		}
		sortMediaRuns(arr)
	}
}

func sortMediaRuns(content []any) {
	i := 0
	for i < len(content) {
		m, ok := content[i].(map[string]any)
		if !ok {
			i++
			continue
		}
		t, _ := m["type"].(string)
		if !isMediaType(t) {
			i++
			continue
		}
		j := i + 1
		for j < len(content) {
			m2, ok := content[j].(map[string]any)
			if !ok {
				break
			}
			t2, _ := m2["type"].(string)
			if !isMediaType(t2) || t2 != t {
				break
			}
			j++
		}
		if j-i > 1 {
			run := content[i:j]
			sort.SliceStable(run, func(a, b int) bool {
				return hashForToolSort(run[a]) < hashForToolSort(run[b])
			})
		}
		i = j
	}
}
