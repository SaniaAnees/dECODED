package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type clientConfig struct {
	proxy string
	model string
	dump  string
	turns int
	sleep time.Duration
	key   string
}

func runNative(cfg clientConfig) {
	client := &http.Client{Timeout: 120 * time.Second}
	url := strings.TrimRight(cfg.proxy, "/") + "/v1beta/models/" + cfg.model + ":generateContent"

	contents := []any{}
	printCacheWaitRules(cfg.sleep, cfg.turns, cfg.model)
	fmt.Printf("POST %s  native generateContent  turns=%d\n", url, cfg.turns)
	hits := 0
	var sumCached, sumPrompt int64

	for i := 0; i < cfg.turns; i++ {
		contents = append(contents, map[string]any{
			"role":  "user",
			"parts": []any{map[string]any{"text": turnPrompts[i]}},
		})
		body := map[string]any{
			"system_instruction": map[string]any{
				"parts": []any{map[string]any{"text": stableSystem()}},
			},
			"contents": contents,
			"generationConfig": map[string]any{
				"maxOutputTokens": 64,
			},
		}
		raw, err := json.MarshalIndent(body, "", "  ")
		if err != nil {
			fmt.Fprintf(os.Stderr, "turn %d marshal: %v\n", i+1, err)
			os.Exit(1)
		}
		path := filepath.Join(cfg.dump, fmt.Sprintf("native-%02d.request.json", i+1))
		if err := os.WriteFile(path, raw, 0o644); err != nil {
			fmt.Fprintf(os.Stderr, "turn %d write: %v\n", i+1, err)
			os.Exit(1)
		}

		respBody, status, err := postGeminiNative(client, url, cfg.key, raw)
		for try := 0; err == nil && status == 429 && try < 2; try++ {
			if dailyQuota429(respBody) {
				fmt.Fprintf(os.Stderr, "turn %d 429 daily/free-tier cap — stop. A 30s or 13s wait does not refill this.\n", i+1)
				break
			}
			fmt.Fprintf(os.Stderr, "turn %d HTTP 429 RPM — waiting 60s (try %d/2), not 13s\n", i+1, try+1)
			time.Sleep(60 * time.Second)
			respBody, status, err = postGeminiNative(client, url, cfg.key, raw)
		}
		if err != nil {
			fmt.Fprintf(os.Stderr, "turn %d: %v\n", i+1, err)
			os.Exit(1)
		}
		_ = os.WriteFile(filepath.Join(cfg.dump, fmt.Sprintf("native-%02d.response.json", i+1)), prettyJSON(respBody), 0o644)
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
		note := ""
		if i == 0 && cached == 0 {
			note = "  (fill — cached=0 on turn 1 is normal)"
		}
		fmt.Printf("turn %02d  cache %.0f%%  cached=%d  prompt=%d  reply=%q%s\n", i+1, pct, cached, prompt, replyText(respBody), note)

		modelTurn, err := geminiModelContent(respBody)
		if err != nil {
			fmt.Fprintf(os.Stderr, "turn %d parse model: %v\n", i+1, err)
			os.Exit(1)
		}
		contents = append(contents, modelTurn)
		if i+1 < cfg.turns && cfg.sleep > 0 {
			time.Sleep(cfg.sleep)
		}
	}
	overall := 0.0
	if sumPrompt > 0 {
		overall = 100 * float64(sumCached) / float64(sumPrompt)
	}
	fmt.Printf("done  cache %.0f%% of prompt tokens  (%d/%d turns had cached>0)\n", overall, hits, cfg.turns)
}

func geminiModelContent(raw []byte) (map[string]any, error) {
	var doc map[string]any
	if err := json.Unmarshal(raw, &doc); err != nil {
		return nil, err
	}
	cands, _ := doc["candidates"].([]any)
	if len(cands) == 0 {
		return nil, fmt.Errorf("no candidates")
	}
	c0, _ := cands[0].(map[string]any)
	content, _ := c0["content"].(map[string]any)
	if content == nil {
		return nil, fmt.Errorf("no content")
	}
	if content["role"] == nil {
		content["role"] = "model"
	}
	return content, nil
}

func postGeminiNative(client *http.Client, url, key string, raw []byte) ([]byte, int, error) {
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(raw))
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	// generateContent wants an API key header, not Bearer (Bearer is treated as OAuth and 401s).
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
