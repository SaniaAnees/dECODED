package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func main() {
	proxy := flag.String("proxy", "http://127.0.0.1:8080", "decoded proxy base")
	model := flag.String("model", "gemini-3.6-flash", "model name")
	dump := flag.String("dump", "cacheprobe-turns", "folder for each turn's request JSON")
	turns := flag.Int("turns", len(turnPrompts), "how many turns to send (use 2–4 to measure hits; free generateContent is ~20/day)")
	sleep := flag.Duration("sleep", 0, "wait between turns; keep 0 to measure cache (13s was RPM and hurts implicit hits)")
	dry := flag.Bool("dry", false, "write turn-1 JSON and exit (no API call)")
	native := flag.Bool("native", false, "POST generateContent directly; default OpenAI shape is already bridged to that path")
	mutateToolsAt := flag.Int("mutate-tools-at", 0, "1-based turn to add a third tool (0=off); expect a miss then re-warm")
	mutateFileAt := flag.Int("mutate-file-at", 0, "1-based turn to swap the frozen system file (0=off); expect a miss then re-warm")
	hard := flag.Bool("hard", false, "sharp tool replace + system clock prefix/suffix + file swaps")
	repo := flag.String("repo", defaultProbeRepo(), "project folder to freeze (sibling probe-workspace, not decodedd)")
	flag.Parse()

	probeRepo = resolveProbeRepo(*repo)

	if *dry {
		if err := writeTurn1JSON("testdata/manual/turn-01.request.json", *model); err != nil {
			fmt.Fprintf(os.Stderr, "dry write: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("wrote testdata/manual/turn-01.request.json")
		return
	}

	key := firstEnv("GEMINI_API_KEY", "GOOGLE_API_KEY", "OPENAI_API_KEY")
	if key == "" {
		fmt.Fprintln(os.Stderr, "set GEMINI_API_KEY (or GOOGLE_API_KEY) in this terminal")
		os.Exit(2)
	}
	if *turns < 1 {
		*turns = 1
	}
	if *turns > len(turnPrompts) {
		*turns = len(turnPrompts)
	}

	if _, err := os.Stat(filepath.Join(probeRepo, "main.go")); err != nil {
		fmt.Fprintf(os.Stderr, "probe workspace missing main.go at %s\n", probeRepo)
		os.Exit(2)
	}

	if err := os.MkdirAll(*dump, 0o755); err != nil {
		fmt.Fprintf(os.Stderr, "dump dir: %v\n", err)
		os.Exit(1)
	}

	if *native {
		runNative(clientConfig{
			proxy: *proxy,
			model: *model,
			dump:  *dump,
			turns: *turns,
			sleep: *sleep,
			key:   key,
		})
		return
	}

	client := &http.Client{Timeout: 120 * time.Second}
	url := strings.TrimRight(*proxy, "/") + "/v1/chat/completions"

	messages := []any{
		map[string]any{"role": "system", "content": stableSystem()},
	}

	printCacheWaitRules(*sleep, *turns, *model)
	if *hard {
		fmt.Println("hard schedule:")
		fmt.Println("  1-5   baseline tools + main.go")
		fmt.Println("  6-10  tools +run_shell")
		fmt.Println("  11-13 tools REPLACE delete_file+list_dir")
		fmt.Println("  14-16 tools RESTORE read_file+write_file")
		fmt.Println("  17-20 system clock PREFIX")
		fmt.Println("  21-23 file swap store.go + clock PREFIX")
		fmt.Println("  24-26 clock moved to SUFFIX")
		fmt.Println("  27-30 file back to main.go, clock SUFFIX")
	}
	if *mutateToolsAt > 0 {
		fmt.Printf("mutate: add run_shell tool from turn %d\n", *mutateToolsAt)
	}
	if *mutateFileAt > 0 {
		fmt.Printf("mutate: swap frozen system file to store.go from turn %d\n", *mutateFileAt)
	}
	fmt.Printf("workspace %s\n", probeRepo)
	fmt.Printf("POST %s  model=%s  turns=%d  json=%s\n", url, *model, *turns, *dump)
	fmt.Println("wire: OpenAI-compat /v1/chat/completions  (not Anthropic Messages). Mistral is the lab.")
	hits := 0
	var sumCached, sumPrompt int64
	for i := 0; i < *turns; i++ {
		turn := i + 1
		setup := setupForTurn(turn, *hard, *mutateToolsAt, *mutateFileAt)
		if m0, ok := messages[0].(map[string]any); ok {
			m0["content"] = setup.system
		}
		messages = append(messages, map[string]any{
			"role":    "user",
			"content": turnPrompts[i],
		})
		body := map[string]any{
			"model":      *model,
			"messages":   messages,
			"tools":      setup.tools,
			"max_tokens": 400,
		}
		raw, err := json.MarshalIndent(body, "", "  ")
		if err != nil {
			fmt.Fprintf(os.Stderr, "turn %d marshal: %v\n", i+1, err)
			os.Exit(1)
		}
		path := filepath.Join(*dump, fmt.Sprintf("turn-%02d.request.json", i+1))
		if err := os.WriteFile(path, raw, 0o644); err != nil {
			fmt.Fprintf(os.Stderr, "turn %d write: %v\n", i+1, err)
			os.Exit(1)
		}

		respBody, status, err := postJSON(client, url, key, raw)
		for try := 0; err == nil && status == 429 && try < 2; try++ {
			if dailyQuota429(respBody) {
				fmt.Fprintf(os.Stderr, "turn %d 429 daily/free-tier cap — stop. A 30s or 13s wait does not refill this.\n", i+1)
				break
			}
			fmt.Fprintf(os.Stderr, "turn %d HTTP 429 RPM — waiting 60s (try %d/2), not 13s\n", i+1, try+1)
			time.Sleep(60 * time.Second)
			respBody, status, err = postJSON(client, url, key, raw)
		}
		if err != nil {
			fmt.Fprintf(os.Stderr, "turn %d: %v\n", i+1, err)
			os.Exit(1)
		}
		respPath := filepath.Join(*dump, fmt.Sprintf("turn-%02d.response.json", i+1))
		_ = os.WriteFile(respPath, prettyJSON(respBody), 0o644)
		if status < 200 || status >= 300 {
			fmt.Fprintf(os.Stderr, "turn %d HTTP %d\n%s\n", i+1, status, truncate(string(respBody), 800))
			os.Exit(1)
		}

		cached := cachedTokens(respBody)
		prompt := promptTokens(respBody)
		if cached > 0 {
			hits++
		}
		sumCached += cached
		sumPrompt += prompt
		pct := 0.0
		if prompt > 0 {
			pct = 100 * float64(cached) / float64(prompt)
		}
		note := setup.mutate
		if i == 0 && cached == 0 {
			if note != "" {
				note += "; "
			}
			note += "fill — cached=0 on turn 1 is normal"
		}
		if prompt > 0 && prompt < 4096 {
			if note != "" {
				note += "; "
			}
			note += "prompt below Gemini 3.x ~4096 cache floor"
		}
		printTurnReport(turn, turnPrompts[i], replyText(respBody), pct, cached, prompt, note)

		asst, err := assistantMessage(respBody)
		if err != nil {
			fmt.Fprintf(os.Stderr, "turn %d parse assistant: %v\n", i+1, err)
			os.Exit(1)
		}
		messages = append(messages, asst)
		if i+1 < *turns && *sleep > 0 {
			time.Sleep(*sleep)
		}
	}
	overall := 0.0
	if sumPrompt > 0 {
		overall = 100 * float64(sumCached) / float64(sumPrompt)
	}
	reqPct := 0.0
	if *turns > 0 {
		reqPct = 100 * float64(hits) / float64(*turns)
	}
	fmt.Printf("\n===== done =====\ncache %.0f%% of all prompt tokens\n%d/%d turns had cached>0 (%.0f%% of turns)\n",
		overall, hits, *turns, reqPct)
}

func printTurnReport(turn int, q, a string, pct float64, cached, prompt int64, note string) {
	fmt.Printf("\n===== turn %02d =====\n", turn)
	fmt.Printf("cache %.0f%%   cached=%d   prompt=%d\n", pct, cached, prompt)
	if note != "" {
		fmt.Printf("note: %s\n", note)
	}
	fmt.Printf("Q: %s\n", strings.TrimSpace(q))
	fmt.Printf("A: %s\n", strings.TrimSpace(a))
}

func writeTurn1JSON(path, model string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	body := map[string]any{
		"model": model,
		"messages": []any{
			map[string]any{"role": "system", "content": stableSystem()},
			map[string]any{"role": "user", "content": turnPrompts[0]},
		},
		"tools":      stableTools(),
		"max_tokens": 1024,
	}
	raw, err := json.MarshalIndent(body, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, raw, 0o644)
}

func postJSON(client *http.Client, url, key string, raw []byte) ([]byte, int, error) {
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(raw))
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("x-goog-api-key", key)
	resp, err := client.Do(req)
	if err != nil {
		return nil, 0, fmt.Errorf("proxy not reachable (%s): %w", url, err)
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return nil, resp.StatusCode, err
	}
	return b, resp.StatusCode, nil
}

func assistantMessage(raw []byte) (map[string]any, error) {
	var doc map[string]any
	if err := json.Unmarshal(raw, &doc); err != nil {
		return nil, err
	}
	choices, _ := doc["choices"].([]any)
	if len(choices) == 0 {
		return nil, fmt.Errorf("no choices")
	}
	ch, _ := choices[0].(map[string]any)
	msg, _ := ch["message"].(map[string]any)
	if msg == nil {
		return nil, fmt.Errorf("no message")
	}
	return msg, nil
}

func cachedTokens(raw []byte) int64 {
	usage := usageObj(raw)
	if usage == nil {
		return 0
	}
	if n := asInt64(usage["cached_tokens"]); n > 0 {
		return n
	}
	if n := asInt64(usage["cachedContentTokenCount"]); n > 0 {
		return n
	}
	if n := asInt64(usage["cached_content_token_count"]); n > 0 {
		return n
	}
	details, _ := usage["prompt_tokens_details"].(map[string]any)
	if details == nil {
		return 0
	}
	return asInt64(details["cached_tokens"])
}

func promptTokens(raw []byte) int64 {
	usage := usageObj(raw)
	if usage == nil {
		return 0
	}
	if n := asInt64(usage["promptTokenCount"]); n > 0 {
		return n
	}
	if n := asInt64(usage["prompt_tokens"]); n > 0 {
		return n
	}
	return asInt64(usage["input_tokens"])
}

func usageObj(raw []byte) map[string]any {
	var doc map[string]any
	if err := json.Unmarshal(raw, &doc); err != nil {
		return nil
	}
	usage, _ := doc["usage"].(map[string]any)
	if usage != nil {
		return usage
	}
	meta, _ := doc["usageMetadata"].(map[string]any)
	return meta
}

func asInt64(v any) int64 {
	switch t := v.(type) {
	case float64:
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

func prettyJSON(raw []byte) []byte {
	var buf bytes.Buffer
	if json.Indent(&buf, raw, "", "  ") != nil {
		return raw
	}
	return buf.Bytes()
}

func printCacheWaitRules(sleep time.Duration, turns int, model string) {
	fmt.Println("wait rules:")
	fmt.Println("  cache measure: -sleep 0 (send the same prefix immediately; 13s wait is NOT cache TTL and hurts hits)")
	fmt.Println("  RPM 429: wait 60s, retry twice, then stop")
	fmt.Println("  daily/free-tier 429 (limit ~20 generateContent): stop; same-project new key will not help")
	fmt.Printf("  this run: sleep=%s  turns=%d  model=%s  (turn 1 fill, hits expected from turn 2+)\n", sleep, turns, model)
}

func dailyQuota429(body []byte) bool {
	s := strings.ToLower(string(body))
	// "Please retry in Ns" is per-minute RPM, even when the metric name says free_tier.
	if strings.Contains(s, "please retry in") {
		return false
	}
	return strings.Contains(s, "free_tier") ||
		strings.Contains(s, "generate_content_free_tier") ||
		(strings.Contains(s, "quota exceeded") && strings.Contains(s, "limit: 20"))
}

func firstEnv(keys ...string) string {
	for _, k := range keys {
		if v := strings.TrimSpace(os.Getenv(k)); v != "" {
			return v
		}
	}
	return ""
}

func replyText(raw []byte) string {
	var doc map[string]any
	if err := json.Unmarshal(raw, &doc); err != nil {
		return ""
	}
	choices, _ := doc["choices"].([]any)
	if len(choices) > 0 {
		ch, _ := choices[0].(map[string]any)
		msg, _ := ch["message"].(map[string]any)
		if msg != nil {
			if s, _ := msg["content"].(string); s != "" {
				return s
			}
		}
	}
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
	for _, p := range parts {
		m, _ := p.(map[string]any)
		if s, _ := m["text"].(string); s != "" {
			return s
		}
	}
	return ""
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}
