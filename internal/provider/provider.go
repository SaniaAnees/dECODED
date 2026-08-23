// Package provider classifies an incoming API request by wire shape
// (JSON body + URL path suffix), not by model name or hostname.
package provider

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"os"
	"strings"
)

type Shape string

const (
	ShapeAnthropic Shape = "anthropic-compatible"
	ShapeOpenAI    Shape = "openai-compatible"
	ShapeResponses Shape = "openai-responses"
	ShapeUnknown   Shape = "unknown"
)

// CacheMode tells the normalizer what to do with cache markers — not whether
// upstream actually caches.
type CacheMode string

const (
	CacheExplicit CacheMode = "explicit" // normalizer MAY inject cache_control
	CacheImplicit CacheMode = "implicit" // prefix stability only; never inject cache_control
	CacheStrip    CacheMode = "strip"    // remove foreign cache_control / breakpoints before forward
	CacheNone     CacheMode = "none"     // no cache API; strip if present
)

type Provider struct {
	Shape           Shape
	Cache           CachePolicy
	AuthHeaderNames []string // priority order for logging hints only; proxy forwards all incoming auth
	SessionAffinity SessionPolicy
	UsageFields     UsageProfile // where to read cache stats from response JSON
}

type CachePolicy struct {
	Mode            CacheMode
	Marker          string // "cache_control" | "prompt_cache_breakpoint" | ""
	MaxBreakpoints  int    // 4 for Anthropic explicit; 0 otherwise
	MinPrefixTokens int    // upstream hint only; normalizer does not enforce
	TTLDefault      string // Anthropic ephemeral default "5m"; optional "1h"
}

type SessionPolicy struct {
	Required bool     // proxy should preserve/generate sticky key when true
	Fields   []string // "session_id", "prompt_cache_key", "user", header "x-session-affinity"
}

type UsageProfile struct {
	HitPaths   []string // try in order; first >0 wins
	WritePaths []string
}

func (p Provider) SupportsCache() bool {
	return p.Cache.Mode == CacheExplicit
}

var errNotJSONObject = errors.New("provider: body is not a JSON object")

// Detect classifies the request. Parse failure or empty body returns
// ShapeUnknown and a non-nil error; the Provider is still safe to use
// (fail-open). Shape detection ignores hostname, model name, and auth headers.
func Detect(requestURL string, body []byte, headers http.Header) (Provider, error) {
	path, _ := parseRequestURL(requestURL)

	doc, err := parseObject(body)
	if err != nil {
		return defaultsFor(ShapeUnknown), err
	}

	var shape Shape
	switch {
	case hasPathSuffix(path, "/v1/messages"):
		shape = ShapeAnthropic
	case hasPathSuffix(path, "/v1/responses"):
		shape = ShapeResponses
	case hasPathSuffix(path, "/v1/chat/completions"):
		shape = detectChatShape(doc, true)
	default:
		shape = detectChatShape(doc, false)
	}

	p := defaultsFor(shape)
	if shape != ShapeAnthropic && hasCacheControl(doc) {
		p.Cache.Mode = CacheStrip
	}
	return p, nil
}

func defaultsFor(shape Shape) Provider {
	p := shapeDefaults(shape)
	applyUpstreamProfile(&p)
	if stripCacheEnv() && p.Cache.Mode != CacheExplicit {
		p.Cache.Mode = CacheStrip
	}
	return p
}

func shapeDefaults(shape Shape) Provider {
	switch shape {
	case ShapeAnthropic:
		return Provider{
			Shape: ShapeAnthropic,
			Cache: CachePolicy{
				Mode:            CacheExplicit,
				Marker:          "cache_control",
				MaxBreakpoints:  4,
				MinPrefixTokens: 1024,
				TTLDefault:      "5m",
			},
			AuthHeaderNames: []string{"x-api-key", "Authorization", "anthropic-version", "anthropic-beta"},
			SessionAffinity: SessionPolicy{
				Required: false,
				Fields:   []string{"session_id"},
			},
			UsageFields: UsageProfile{
				HitPaths:   []string{"usage.cache_read_input_tokens"},
				WritePaths: []string{"usage.cache_creation_input_tokens"},
			},
		}
	case ShapeOpenAI:
		return Provider{
			Shape: ShapeOpenAI,
			Cache: CachePolicy{
				Mode:            CacheImplicit,
				Marker:          "",
				MaxBreakpoints:  0,
				MinPrefixTokens: 1024,
			},
			AuthHeaderNames: []string{"Authorization"},
			SessionAffinity: SessionPolicy{
				Required: false,
				Fields:   []string{"prompt_cache_key", "user"},
			},
			UsageFields: UsageProfile{
				HitPaths: []string{
					"usage.prompt_tokens_details.cached_tokens",
					"usage.input_tokens_details.cached_tokens",
				},
			},
		}
	case ShapeResponses:
		return Provider{
			Shape: ShapeResponses,
			Cache: CachePolicy{
				Mode:            CacheImplicit,
				Marker:          "",
				MaxBreakpoints:  0,
				MinPrefixTokens: 1024,
			},
			AuthHeaderNames: []string{"Authorization"},
			SessionAffinity: SessionPolicy{
				Required: false,
				Fields:   []string{"prompt_cache_key"},
			},
			UsageFields: UsageProfile{
				HitPaths: []string{
					"usage.input_tokens_details.cached_tokens",
					"usage.prompt_tokens_details.cached_tokens",
				},
			},
		}
	default:
		return Provider{
			Shape: ShapeUnknown,
			Cache: CachePolicy{
				Mode: CacheImplicit,
			},
			AuthHeaderNames: []string{"Authorization", "x-api-key"},
			SessionAffinity: SessionPolicy{Required: false},
		}
	}
}

func applyUpstreamProfile(p *Provider) {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("DECODED_UPSTREAM_PROFILE"))) {
	case "ollama":
		p.Cache = CachePolicy{Mode: CacheStrip}
		p.UsageFields = UsageProfile{}
	case "fireworks":
		if p.Cache.Mode == CacheExplicit {
			p.Cache.Mode = CacheImplicit
			p.Cache.Marker = ""
			p.Cache.MaxBreakpoints = 0
			p.Cache.TTLDefault = ""
		}
		p.SessionAffinity.Required = true
		p.SessionAffinity.Fields = mergeFields(p.SessionAffinity.Fields, "user", "x-session-affinity", "prompt_cache_key")
	case "groq":
		p.Cache.MinPrefixTokens = 128
	case "deepseek":
		p.UsageFields = UsageProfile{
			HitPaths:   []string{"usage.prompt_cache_hit_tokens"},
			WritePaths: []string{"usage.prompt_cache_miss_tokens"},
		}
	case "openrouter":
		p.SessionAffinity.Fields = mergeFields(p.SessionAffinity.Fields, "session_id", "x-session-id")
		if len(p.UsageFields.WritePaths) == 0 {
			p.UsageFields.WritePaths = []string{"usage.cache_write_tokens"}
		}
	case "gemini":
		p.Cache.MinPrefixTokens = 2048
		p.UsageFields = UsageProfile{
			HitPaths: []string{"usage_metadata.total_cached_tokens"},
		}
	}
}

func stripCacheEnv() bool {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("DECODED_STRIP_CACHE"))) {
	case "1", "true", "yes", "on":
		return true
	default:
		return false
	}
}

// UpstreamURL is routing config, not detection. Incoming path chooses the
// env var; shape is a fallback when the path is not a known API suffix.
func UpstreamURL(shape Shape, path string) string {
	reqPath, rawQuery := parseRequestURL(path)
	base := routeBase(shape, reqPath)
	return joinBasePath(base, reqPath, rawQuery)
}

func routeBase(shape Shape, path string) string {
	switch {
	case hasPathSuffix(path, "/v1/messages"):
		return envOr("DECODED_ANTHROPIC_BASE_URL", "https://api.anthropic.com")
	case hasPathSuffix(path, "/v1/chat/completions"), hasPathSuffix(path, "/v1/responses"):
		return envOr("DECODED_OPENAI_BASE_URL", "https://api.openai.com")
	case shape == ShapeAnthropic:
		return envOr("DECODED_ANTHROPIC_BASE_URL", "https://api.anthropic.com")
	default:
		return envOr("DECODED_OPENAI_BASE_URL", "https://api.openai.com")
	}
}

func envOr(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func joinBasePath(base, reqPath, rawQuery string) string {
	base = strings.TrimRight(strings.TrimSpace(base), "/")
	reqPath = normalizePath(reqPath)
	if reqPath != "" {
		if strings.HasSuffix(base, "/v1") && (reqPath == "/v1" || strings.HasPrefix(reqPath, "/v1/")) {
			reqPath = strings.TrimPrefix(reqPath, "/v1")
		}
		base += reqPath
	}
	if rawQuery != "" {
		base += "?" + rawQuery
	}
	return base
}

func detectChatShape(doc map[string]any, chatCompletionsPath bool) Shape {
	if s := disambiguate(doc); s != ShapeUnknown {
		return s
	}
	if chatCompletionsPath {
		return ShapeOpenAI
	}
	return ShapeUnknown
}

func disambiguate(doc map[string]any) Shape {
	if _, ok := doc["system"]; ok {
		return ShapeAnthropic
	}
	if hasContentType(doc, "tool_use", "tool_result") {
		return ShapeAnthropic
	}
	if hasOpenAIToolSignal(doc) {
		return ShapeOpenAI
	}
	if s := firstToolShape(doc); s != ShapeUnknown {
		return s
	}
	if hasCacheControl(doc) {
		return ShapeAnthropic
	}
	if hasKeyDeep(doc, "prompt_cache_breakpoint", "prompt_cache_options") {
		return ShapeOpenAI
	}
	if hasResponsesShape(doc) {
		return ShapeResponses
	}
	if _, ok := doc["messages"]; ok {
		return ShapeOpenAI
	}
	return ShapeUnknown
}

func hasResponsesShape(doc map[string]any) bool {
	if _, ok := doc["model"]; !ok {
		return false
	}
	_, ok := doc["input"].([]any)
	return ok
}

func hasOpenAIToolSignal(doc map[string]any) bool {
	for _, msg := range objectsIn(doc["messages"]) {
		role, _ := msg["role"].(string)
		if role == "tool" {
			return true
		}
		if v, ok := msg["tool_calls"]; ok && v != nil {
			return true
		}
	}
	return false
}

func firstToolShape(doc map[string]any) Shape {
	tools, ok := doc["tools"].([]any)
	if !ok || len(tools) == 0 {
		return ShapeUnknown
	}
	first, ok := tools[0].(map[string]any)
	if !ok {
		return ShapeUnknown
	}
	if _, ok := first["input_schema"]; ok {
		return ShapeAnthropic
	}
	if fn, ok := first["function"].(map[string]any); ok {
		if _, ok := fn["parameters"]; ok {
			return ShapeOpenAI
		}
	}
	return ShapeUnknown
}

func hasContentType(doc map[string]any, types ...string) bool {
	want := make(map[string]struct{}, len(types))
	for _, t := range types {
		want[t] = struct{}{}
	}
	for _, msg := range objectsIn(doc["messages"]) {
		for _, block := range objectsIn(msg["content"]) {
			t, _ := block["type"].(string)
			if _, ok := want[t]; ok {
				return true
			}
		}
	}
	return false
}

func hasCacheControl(v any) bool {
	return hasKeyDeep(v, "cache_control")
}

func hasKeyDeep(v any, keys ...string) bool {
	want := make(map[string]struct{}, len(keys))
	for _, k := range keys {
		want[k] = struct{}{}
	}
	var walk func(any) bool
	walk = func(x any) bool {
		switch t := x.(type) {
		case map[string]any:
			for k, child := range t {
				if _, ok := want[k]; ok {
					return true
				}
				if walk(child) {
					return true
				}
			}
		case []any:
			for _, child := range t {
				if walk(child) {
					return true
				}
			}
		}
		return false
	}
	return walk(v)
}

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

func parseObject(body []byte) (map[string]any, error) {
	if strings.TrimSpace(string(body)) == "" {
		return nil, errNotJSONObject
	}
	var doc map[string]any
	if err := json.Unmarshal(body, &doc); err != nil {
		return nil, errNotJSONObject
	}
	if doc == nil {
		return nil, errNotJSONObject
	}
	return doc, nil
}

func parseRequestURL(raw string) (path, rawQuery string) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "", ""
	}
	u, err := url.Parse(raw)
	if err != nil {
		path, query, _ := strings.Cut(raw, "?")
		return normalizePath(path), query
	}
	p := u.Path
	if p == "" && u.Opaque != "" {
		p = u.Opaque
	}
	return normalizePath(p), u.RawQuery
}

func normalizePath(p string) string {
	p = strings.TrimRight(p, "/")
	if p == "" {
		return ""
	}
	if !strings.HasPrefix(p, "/") {
		p = "/" + p
	}
	return p
}

func hasPathSuffix(path, suffix string) bool {
	path = strings.TrimRight(path, "/")
	suffix = strings.TrimRight(suffix, "/")
	return path == suffix || strings.HasSuffix(path, suffix)
}

func mergeFields(existing []string, extra ...string) []string {
	seen := make(map[string]struct{}, len(existing)+len(extra))
	out := make([]string, 0, len(existing)+len(extra))
	add := func(s string) {
		if s == "" {
			return
		}
		if _, ok := seen[s]; ok {
			return
		}
		seen[s] = struct{}{}
		out = append(out, s)
	}
	for _, s := range extra {
		add(s)
	}
	for _, s := range existing {
		add(s)
	}
	return out
}
