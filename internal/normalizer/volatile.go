package normalizer

import (
	"regexp"
	"sort"
	"strings"
	"unicode"

	"github.com/SaniaAnees/dECODED/internal/provider"
)

// volatilePrefix labels the dedicated carrier so a second Normalize can
// find it without treating it as stable system text.
const volatilePrefix = "Volatile context:"

type volatileItem struct {
	kind  string // datetime | label | session_id | uuid
	key   string // display key; for labels, the original label text
	value string
}

func (it volatileItem) line() string {
	switch it.kind {
	case "session_id":
		return "session_id=" + it.value
	case "label":
		return it.key + ": " + it.value
	default:
		return it.kind + ": " + it.value
	}
}

func (it volatileItem) dedupKey() string {
	v := it.value
	if it.kind == "uuid" {
		v = strings.ToLower(v)
	}
	return it.kind + "\x00" + strings.ToLower(it.key) + "\x00" + v
}

type volatileSpan struct {
	start, end int
	item       volatileItem
}

var (
	reISO8601 = regexp.MustCompile(
		`\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})`,
	)
	reLabeledTime = regexp.MustCompile(
		`(?i)(Current time|Today is)[ \t]*:[ \t]*`,
	)
	reUUIDv4 = regexp.MustCompile(
		`(?i)\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b`,
	)
	reSessionID = regexp.MustCompile(
		`(?i)(^|[^A-Za-z0-9])((?:session_id|sessionId|session-id)[ \t]*[=:][ \t]*)([^\s"']+)`,
	)
)

func findISO8601(s string) []volatileSpan {
	idx := reISO8601.FindAllStringIndex(s, -1)
	out := make([]volatileSpan, 0, len(idx))
	for _, p := range idx {
		out = append(out, volatileSpan{
			start: p[0],
			end:   p[1],
			item:  volatileItem{kind: "datetime", key: "datetime", value: s[p[0]:p[1]]},
		})
	}
	return out
}

func findLabeledTime(s string) []volatileSpan {
	idxs := reLabeledTime.FindAllStringSubmatchIndex(s, -1)
	out := make([]volatileSpan, 0, len(idxs))
	for _, m := range idxs {
		if len(m) < 4 {
			continue
		}
		start := m[0]
		label := canonicalLabel(s[m[2]:m[3]])
		rest := s[m[1]:]
		end := m[1]
		val := ""
		if iso := reISO8601.FindStringIndex(rest); iso != nil && iso[0] == 0 {
			end = m[1] + iso[1]
			val = rest[:iso[1]]
		} else {
			nl := strings.IndexByte(rest, '\n')
			if nl < 0 {
				nl = len(rest)
			}
			end = m[1] + nl
			val = strings.TrimSpace(rest[:nl])
		}
		if val == "" {
			continue
		}
		out = append(out, volatileSpan{
			start: start,
			end:   end,
			item:  volatileItem{kind: "label", key: label, value: val},
		})
	}
	return out
}

func canonicalLabel(label string) string {
	switch strings.ToLower(strings.TrimSpace(label)) {
	case "current time":
		return "Current time"
	case "today is":
		return "Today is"
	default:
		return strings.TrimSpace(label)
	}
}

func findUUIDv4(s string) []volatileSpan {
	idx := reUUIDv4.FindAllStringIndex(s, -1)
	out := make([]volatileSpan, 0, len(idx))
	for _, p := range idx {
		out = append(out, volatileSpan{
			start: p[0],
			end:   p[1],
			item:  volatileItem{kind: "uuid", key: "uuid", value: s[p[0]:p[1]]},
		})
	}
	return out
}

func findSessionID(s string) []volatileSpan {
	matches := reSessionID.FindAllStringSubmatchIndex(s, -1)
	out := make([]volatileSpan, 0, len(matches))
	for _, m := range matches {
		if len(m) < 8 {
			continue
		}
		// group 2 = key+sep, group 3 = value; start after the prefix char (group 1)
		start, end := m[4], m[7]
		if start < 0 || end < 0 {
			continue
		}
		out = append(out, volatileSpan{
			start: start,
			end:   end,
			item:  volatileItem{kind: "session_id", key: "session_id", value: s[m[6]:m[7]]},
		})
	}
	return out
}

func detectVolatile(s string) ([]volatileItem, []volatileSpan) {
	raw := make([]volatileSpan, 0, 8)
	raw = append(raw, findLabeledTime(s)...)
	raw = append(raw, findSessionID(s)...)
	raw = append(raw, findUUIDv4(s)...)
	raw = append(raw, findISO8601(s)...)
	if len(raw) == 0 {
		return nil, nil
	}

	sort.SliceStable(raw, func(i, j int) bool {
		if raw[i].start != raw[j].start {
			return raw[i].start < raw[j].start
		}
		li := raw[i].end - raw[i].start
		lj := raw[j].end - raw[j].start
		return li > lj // longer span wins on the same start
	})

	chosen := make([]volatileSpan, 0, len(raw))
	for _, sp := range raw {
		overlap := false
		for _, c := range chosen {
			if sp.start < c.end && sp.end > c.start {
				overlap = true
				break
			}
		}
		if !overlap {
			chosen = append(chosen, sp)
		}
	}
	sort.Slice(chosen, func(i, j int) bool { return chosen[i].start < chosen[j].start })

	items := make([]volatileItem, 0, len(chosen))
	seen := make(map[string]struct{}, len(chosen))
	for _, sp := range chosen {
		k := sp.item.dedupKey()
		if _, ok := seen[k]; ok {
			continue
		}
		seen[k] = struct{}{}
		items = append(items, sp.item)
	}
	return items, chosen
}

func removeSpans(s string, spans []volatileSpan) string {
	if len(spans) == 0 {
		return s
	}
	cp := append([]volatileSpan(nil), spans...)
	sort.Slice(cp, func(i, j int) bool { return cp[i].start > cp[j].start })
	b := []byte(s)
	for _, sp := range cp {
		if sp.start < 0 || sp.end > len(b) || sp.start > sp.end {
			continue
		}
		b = append(b[:sp.start], b[sp.end:]...)
	}
	return string(b)
}

func collapseStableText(s string) string {
	s = strings.ReplaceAll(s, "\r\n", "\n")
	s = strings.ReplaceAll(s, "\r", "\n")
	lines := strings.Split(s, "\n")
	out := make([]string, 0, len(lines))
	prevEmpty := false
	for _, line := range lines {
		line = strings.TrimSpace(collapseHorizontal(line))
		empty := line == ""
		if empty && prevEmpty {
			continue
		}
		out = append(out, line)
		prevEmpty = empty
	}
	return strings.TrimSpace(strings.Join(out, "\n"))
}

func collapseHorizontal(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	prevSpace := false
	for _, r := range s {
		if r == ' ' || r == '\t' || r == '\v' || r == '\f' || unicode.Is(unicode.Zs, r) && r != '\n' {
			if !prevSpace {
				b.WriteByte(' ')
				prevSpace = true
			}
			continue
		}
		prevSpace = false
		b.WriteRune(r)
	}
	return b.String()
}

func extractFromText(s string) (cleaned string, items []volatileItem) {
	items, spans := detectVolatile(s)
	if len(spans) == 0 {
		return s, nil
	}
	return collapseStableText(removeSpans(s, spans)), items
}

func formatVolatile(items []volatileItem) string {
	var b strings.Builder
	b.WriteString(volatilePrefix)
	b.WriteByte('\n')
	for i, it := range items {
		if i > 0 {
			b.WriteByte('\n')
		}
		b.WriteString(it.line())
	}
	return b.String()
}

func isVolatileText(s string) bool {
	return strings.HasPrefix(strings.TrimSpace(s), volatilePrefix)
}

func isVolatileBlock(m map[string]any) bool {
	txt, ok := m["text"].(string)
	return ok && isVolatileText(txt)
}

func isVolatileMessage(m map[string]any) bool {
	switch c := m["content"].(type) {
	case string:
		return isVolatileText(c)
	case []any:
		if len(c) != 1 {
			return false
		}
		b, ok := c[0].(map[string]any)
		if !ok {
			return false
		}
		return isVolatileBlock(b)
	default:
		return false
	}
}

func mergeItems(dst []volatileItem, extra []volatileItem) []volatileItem {
	if len(extra) == 0 {
		return dst
	}
	seen := make(map[string]struct{}, len(dst)+len(extra))
	for _, it := range dst {
		seen[it.dedupKey()] = struct{}{}
	}
	for _, it := range extra {
		k := it.dedupKey()
		if _, ok := seen[k]; ok {
			continue
		}
		seen[k] = struct{}{}
		dst = append(dst, it)
	}
	return dst
}

func appendUniqueItems(dst []volatileItem, extra ...volatileItem) []volatileItem {
	return mergeItems(dst, extra)
}

func carrierBlock(text string) map[string]any {
	return map[string]any{
		"type": "text",
		"text": text,
	}
}

func carrierMessageOpenAI(text string) map[string]any {
	return map[string]any{
		"role":    "system",
		"content": text,
	}
}

func detachAnthropicSystemCarrier(doc map[string]any) string {
	arr, ok := doc["system"].([]any)
	if !ok {
		return ""
	}
	var text string
	kept := make([]any, 0, len(arr))
	for _, b := range arr {
		m, ok := b.(map[string]any)
		if !ok {
			kept = append(kept, b)
			continue
		}
		if isVolatileBlock(m) {
			if text == "" {
				text, _ = m["text"].(string)
			}
			continue
		}
		kept = append(kept, b)
	}
	if len(kept) == 0 {
		delete(doc, "system")
	} else {
		doc["system"] = kept
	}
	return strings.TrimSpace(text)
}

func extractAnthropicSystem(doc map[string]any) []volatileItem {
	sys, ok := doc["system"]
	if !ok {
		return nil
	}
	switch s := sys.(type) {
	case string:
		cleaned, items := extractFromText(s)
		if len(items) == 0 {
			return nil
		}
		if cleaned == "" {
			delete(doc, "system")
		} else {
			doc["system"] = cleaned
		}
		return items
	case []any:
		var items []volatileItem
		kept := make([]any, 0, len(s))
		for _, b := range s {
			m, ok := b.(map[string]any)
			if !ok {
				kept = append(kept, b)
				continue
			}
			t, _ := m["type"].(string)
			if t == "text" || t == "" {
				if txt, ok := m["text"].(string); ok {
					cleaned, got := extractFromText(txt)
					items = appendUniqueItems(items, got...)
					if cleaned == "" {
						continue
					}
					m["text"] = cleaned
				}
			}
			kept = append(kept, m)
		}
		if len(kept) == 0 {
			delete(doc, "system")
		} else {
			doc["system"] = kept
		}
		return items
	default:
		return nil
	}
}

func attachAnthropicCarrier(doc map[string]any, text string) {
	if text == "" {
		return
	}
	block := carrierBlock(text)

	sys, ok := doc["system"]
	if !ok {
		doc["system"] = []any{block}
		return
	}
	switch s := sys.(type) {
	case string:
		if strings.TrimSpace(s) == "" {
			doc["system"] = []any{block}
			return
		}
		doc["system"] = []any{
			map[string]any{"type": "text", "text": s},
			block,
		}
	case []any:
		doc["system"] = append(s, block)
	default:
		doc["system"] = []any{block}
	}
}

func extractOpenAISystemMessages(messages []any) ([]any, []volatileItem, string) {
	var items []volatileItem
	var existing string
	kept := make([]any, 0, len(messages))
	for _, raw := range messages {
		m, ok := raw.(map[string]any)
		if !ok {
			kept = append(kept, raw)
			continue
		}
		if isVolatileMessage(m) {
			if existing == "" {
				switch c := m["content"].(type) {
				case string:
					existing = c
				case []any:
					if len(c) > 0 {
						if b, ok := c[0].(map[string]any); ok {
							existing, _ = b["text"].(string)
						}
					}
				}
			}
			continue
		}
		if roleOf(m) == "system" {
			newContent, got := extractFromContent(m["content"])
			items = appendUniqueItems(items, got...)
			if got != nil {
				if isEmptyContent(newContent) {
					continue
				}
				m["content"] = newContent
			}
		}
		kept = append(kept, m)
	}
	return kept, items, strings.TrimSpace(existing)
}

func extractFromContent(content any) (any, []volatileItem) {
	switch c := content.(type) {
	case string:
		cleaned, items := extractFromText(c)
		if len(items) == 0 {
			return c, nil
		}
		return cleaned, items
	case []any:
		var items []volatileItem
		kept := make([]any, 0, len(c))
		changed := false
		for _, b := range c {
			m, ok := b.(map[string]any)
			if !ok {
				kept = append(kept, b)
				continue
			}
			t, _ := m["type"].(string)
			if t == "text" || t == "" {
				if txt, ok := m["text"].(string); ok {
					cleaned, got := extractFromText(txt)
					if len(got) > 0 {
						changed = true
						items = appendUniqueItems(items, got...)
						if cleaned == "" {
							continue
						}
						m["text"] = cleaned
					}
				}
			}
			kept = append(kept, m)
		}
		if !changed {
			return c, nil
		}
		return kept, items
	default:
		return content, nil
	}
}

func isEmptyContent(c any) bool {
	switch t := c.(type) {
	case string:
		return strings.TrimSpace(t) == ""
	case []any:
		return len(t) == 0
	default:
		return t == nil
	}
}

func insertOpenAICarrier(messages []any, text string) []any {
	carrier := carrierMessageOpenAI(text)
	lastUser := lastUserIndex(messages)
	if lastUser >= 0 {
		return insertAt(messages, lastUser, carrier)
	}
	return append(messages, carrier)
}

func extractResponsesInstructions(doc map[string]any) []volatileItem {
	s, ok := doc["instructions"].(string)
	if !ok {
		return nil
	}
	cleaned, items := extractFromText(s)
	if len(items) == 0 {
		return nil
	}
	if cleaned == "" {
		delete(doc, "instructions")
	} else {
		doc["instructions"] = cleaned
	}
	return items
}

func insertResponsesCarrier(doc map[string]any, text string) bool {
	if arr, ok := doc["input"].([]any); ok {
		carrier := map[string]any{
			"role":    "system",
			"content": text,
		}
		lastUser := lastUserIndex(arr)
		if lastUser >= 0 {
			doc["input"] = insertAt(arr, lastUser, carrier)
		} else {
			doc["input"] = append(arr, carrier)
		}
		return true
	}
	if _, ok := doc["messages"].([]any); ok {
		return false
	}
	return false
}

func fallbackStripInstructions(doc map[string]any) {
	s, ok := doc["instructions"].(string)
	if !ok {
		return
	}
	cleaned, items := extractFromText(s)
	if len(items) == 0 {
		return
	}
	if cleaned == "" {
		delete(doc, "instructions")
	} else {
		doc["instructions"] = cleaned
	}
}

// moveVolatile implements Stage C (primary) and Stage D (fallback).
//
// Anthropic: a user-role carrier would sit immediately before the last user
// turn and always create consecutive user messages (invalid Messages API).
// Volatile therefore lands as a trailing system text block AFTER any
// cache_control on stable system text — still after the last breakpoint,
// never under a marker.
//
// OpenAI: a dedicated role=system message is inserted after cleaned system
// messages and immediately before the last role=user message.
//
// Fallback strip (no carrier) only runs when there is no legal attachment
// point (Responses-like bodies with instructions but no input/messages).
func moveVolatile(doc map[string]any, p provider.Provider) {
	switch p.Shape {
	case provider.ShapeAnthropic:
		moveAnthropic(doc)
	case provider.ShapeOpenAI:
		moveOpenAI(doc)
	case provider.ShapeResponses:
		moveResponses(doc)
	default:
		if _, ok := doc["messages"].([]any); ok {
			if _, ok := doc["system"]; ok {
				moveAnthropic(doc)
				moveOpenAI(doc)
				return
			}
			moveOpenAI(doc)
			return
		}
		if _, ok := doc["system"]; ok {
			moveAnthropic(doc)
			return
		}
		fallbackStripInstructions(doc)
	}
}

func moveAnthropic(doc map[string]any) {
	existing := detachAnthropicSystemCarrier(doc)
	items := extractAnthropicSystem(doc)
	if len(items) == 0 && existing == "" {
		return
	}
	text := existing
	if len(items) > 0 {
		text = formatVolatile(items)
	}
	attachAnthropicCarrier(doc, text)
}

func moveOpenAI(doc map[string]any) {
	msgs, ok := doc["messages"].([]any)
	if !ok {
		return
	}
	kept, items, existing := extractOpenAISystemMessages(msgs)
	if len(items) == 0 && existing == "" {
		doc["messages"] = kept
		return
	}
	text := existing
	if len(items) > 0 {
		text = formatVolatile(items)
	}
	doc["messages"] = insertOpenAICarrier(kept, text)
}

func moveResponses(doc map[string]any) {
	var items []volatileItem
	var existing string
	if arr, ok := doc["input"].([]any); ok {
		var kept []any
		kept, items, existing = extractOpenAISystemMessages(arr)
		doc["input"] = kept
	}
	items = appendUniqueItems(items, extractResponsesInstructions(doc)...)
	if len(items) == 0 && existing == "" {
		return
	}
	text := existing
	if len(items) > 0 {
		text = formatVolatile(items)
	}
	if insertResponsesCarrier(doc, text) {
		return
	}
	// Stage D fallback: no input/messages attachment point. Volatility
	// was already stripped from instructions by extractResponsesInstructions.
}
