# dECODED V1 Architecture

Zero-config KV-cache optimizer for AI coding agents.  
**Language: Go.** Optional Rust rewrite later if the V1 contract (below) is frozen.

V1 is **one Go binary** Pro and PAYG users both download. Two doors, same install:

- **PAYG:** localhost wire proxy → real KV-cache hits.
- **Pro (Cursor Pro, Claude Pro, Copilot):** MCP that **must work well** — not a stub. Same `decoded init`. No Cloudflare tunnel. No OAuth hijack.

Do not build a UI, a chat app, or the V2 harness until V1 done-criteria pass.

---

## What V1 is

**Download:** one binary (`decoded`) or `go install` / GitHub release. Pro users run `decoded init`. That **wires MCP** into Cursor / Claude Code / Copilot. PAYG users also run `decoded start` and set `ANTHROPIC_BASE_URL`.

### Door A — PAYG proxy

A local HTTP daemon on `127.0.0.1:8080` that:

1. Accepts the same traffic the agent already sends (`POST /v1/messages`, `POST /v1/chat/completions`).
2. Detects the **API shape** from request structure (JSON + path), not model name or domain.
3. Normalizes the body so the **cacheable prefix is byte-identical** across turns.
4. Forwards to the real provider with the **developer’s own auth header**.
5. Returns the upstream response.
6. Records cache stats from usage (`cache_read_input_tokens`, `cache_creation_input_tokens`, OpenAI `cached_tokens`).

Setup:

```bash
decoded start
export ANTHROPIC_BASE_URL="http://localhost:8080/v1"
```

Keys never leave the machine. Nothing is stored on a dECODED server. There is no hosted hop.

### Door B — Pro MCP (required, must be good)

Pro traffic never hits `:8080`. MCP is how Pro users get dECODED.

`decoded init` **must**:

- Detect Cursor, Claude Code, Copilot / VS Code, Codex.
- Write MCP config (`~/.cursor/mcp.json`, Claude user MCP, etc.) pointing at `decoded mcp` (stdio).
- Install a short **rule/skill** so the agent **prefers** dECODED tools over native Read/Grep/Bash.
- Print “Pro: MCP connected. PAYG: run decoded start.”

MCP tools (V1, production — not echo):

| Tool | Job |
|---|---|
| `decoded_read` | Read a file as **byte-stable AST content** (signatures / structural view of that file, deterministic encoding). Same file bytes → **identical tool-result bytes** every time. Unchanged re-read may return a **stable stub** (`hash` + `bytes` + `lines` + `path`) instead of a second AST dump — stub text is also frozen for that hash. Never include clocks, absolute volatile paths, or unsorted keys. |
| `decoded_search` | Search the repo; compact hits; **sorted** paths/lines; hard cap. Same query + same tree → same bytes. |
| `decoded_shell` | Run a command; **deterministic compressed** stdout for known CLIs (`git`, `npm`, …); **never compress stderr**. Strip timestamps and other volatile noise from stdout of those CLIs. Same command + same tree → same stdout bytes. |

Same rules as the proxy: **byte-stable** tool descriptions (no clocks), sorted names, never log secrets.

### Why Pro still gets cache hits (no proxy)

Cursor’s prompt prefix is **fixed and unknown**. dECODED does not see it, rewrite it, or put `cache_control` on it. Pro traffic **never** hits `:8080`.

Cursor slots MCP tool results **after** that prefix:

```
[ Cursor prefix — frozen, opaque to us ]
[ decoded_read / decoded_search / decoded_shell results — we own these bytes ]
[ current user turn / new tool calls — may change ]
```

If MCP payloads are byte-identical across turns, the stable content after Cursor’s prefix can KV-cache. **Same result as PAYG** (hit on stable content), **different lever** (freeze tool results, not the provider body).

We cannot measure Pro as Anthropic `cache_read_input_tokens` on localhost. Do not advertise Pro as 90% `cache_read`. Advertise: fewer tokens on read/shell, and stable MCP bytes so Cursor’s cache can hit.

Pro done-bar (must all be true):

- Pro user downloads the same binary PAYG does.
- After `decoded init` + IDE restart, MCP shows **connected**.
- Agent can complete a real task using `decoded_read` / `decoded_search` / `decoded_shell` instead of only native tools.
- `decoded_read` AST encoding is deterministic: two reads of the same file bytes → identical result bytes (or identical stub after first AST).
- Unchanged file re-read is **much smaller** than the first read (stub).
- `decoded_shell` stdout for a known CLI is deterministic for the same command + tree.
- We never tell Pro users to set `ANTHROPIC_BASE_URL` or open a tunnel.
- We never claim we know or can normalize Cursor’s prefix.

---

## What V1 is not

- Not “Pro via Cloudflare / ngrok / custom BASE_URL.” That does not work for default Cursor Pro or Claude OAuth.
- Not “rewrite Cursor’s system prompt.” Pro prefix is Cursor’s; we only freeze MCP tool results after it.
- Not AST-diff harness, WAL hydrate, TOON, LLMLingua. That is **V2**.
- V1 `decoded_read` AST is **per-file, byte-stable encoding**. It is not the V2 harness (whole-repo AST, WAL handles, `hydrate`, diffs in the suffix).
- Not a semantic cache that skips the model and replays old answers.

**Hit rate comes from a frozen prefix, not from Go vs Rust.**  
Go overhead here is ~3–8ms. A cache hit saves hundreds of ms of prefill. Language is irrelevant to 90%+ hits.

---

## Build order (locked)

```
1. Proxy core (provider, normalizer, proxy, stats)  →  PAYG hits proven
2. MCP + decoded init wiring                         →  Pro can download and use it
3. Ship V1 (both doors in one binary)
4. V2 harness later
```

MCP is **not** optional and **not** a later “v1.1 maybe.” Pro users must be able to download V1 and have it work.  
Implement proxy **first** only so MCP can share `normalizer` / stats — then MCP ships in the **same V1**.

No V2 while V1 is open.  
A later Rust port is a drop-in of this same contract.

---

## Repository (Go)

Place the daemon next to the existing `web/` landing app:

```
decodedd/
├── architecture.md          ← this file
├── web/                     ← landing site (do not mix into the proxy)
└── cmd/decoded/
    └── main.go              ← CLI entry: init | start | mcp | stats
└── internal/
    ├── provider/provider.go
    ├── normalizer/normalizer.go
    ├── proxy/proxy.go
    ├── stats/stats.go
    ├── mcp/mcp.go              ← stdio MCP for Pro
    └── initagent/init.go       ← write Cursor/Claude/Copilot MCP + rules
└── testdata/                ← golden JSON bodies for normalize
└── go.mod
└── README.md
```

CLI binary name: `decoded`.

---

## Module contracts

### 1. `internal/provider`

**Detective, not directory.** `provider.go` classifies the **wire shape** of an incoming request and returns what the normalizer may do. It does **not** hardcode vendor names, model lists, or upstream URLs.

```
Detect(requestURL string, body []byte, headers http.Header) (Provider, error)
```

Parse failure or ambiguity → `ShapeUnknown`, **fail-open** (forward body unchanged; never crash the proxy).

#### Separation of concerns

| Layer | Owns | Does not own |
|---|---|---|
| **Detect (shape)** | JSON fields, path suffix, message/tool block types | Model name, hostname, API key vendor |
| **Capabilities** | What normalizer may inject/strip | Whether upstream actually hit cache |
| **Route (config)** | Where to forward (`$DECODED_*_BASE_URL`) | Chosen from env + path, not from `claude` in model string |

Same binary serves Anthropic, OpenAI, Groq, OpenRouter, Together, Ollama, and arbitrary OpenAI-compat gateways. The developer points `ANTHROPIC_BASE_URL` or `OPENAI_BASE_URL` at localhost; upstream targets come from env defaults.

#### Shapes (structure detection)

Detect from **path suffix** (API contract, not domain) + **JSON body**. Domain is ignored.

| Path suffix | Body signals | Shape |
|---|---|---|
| `/v1/messages` | top-level `system` + `messages` + `max_tokens` | `anthropic-compatible` |
| `/v1/messages` | `messages` with `tool_use` / `tool_result` content blocks | `anthropic-compatible` |
| `/v1/messages` | tools use `input_schema` (not OpenAI `parameters`) | `anthropic-compatible` |
| `/v1/chat/completions` | `messages` + `model`; system inside `messages[]` | `openai-compatible` |
| `/v1/chat/completions` | assistant `tool_calls` + `role: "tool"` messages | `openai-compatible` |
| `/v1/responses` | `input` array + `model` (Responses API) | `openai-responses` |
| anything else + parseable JSON | heuristic tie-break (see below) | best guess |
| parse error | — | `unknown` → treat as `openai-compatible` for fail-open |

**Disambiguation when both could match** (e.g. OpenRouter, custom gateways on `/v1/chat/completions`):

1. Top-level `system` field present → `anthropic-compatible` (OpenAI puts system in `messages`).
2. Any message content block with `type: "tool_use"` or `"tool_result"` → `anthropic-compatible`.
3. Any assistant message with `tool_calls` or `role: "tool"` → `openai-compatible`.
4. Tools array: first tool has `input_schema` → anthropic; `function.parameters` → openai.
5. Request already has `cache_control` on a content block → anthropic-compatible.
6. Request has `prompt_cache_breakpoint` or `prompt_cache_options` → openai-compatible (GPT-5.6+ explicit cache).
7. Still tied → `openai-compatible` (fail-open default).

**Not used for detection:** `model` string, hostname, `Authorization` vs `x-api-key` (auth is forwarded as-is).

#### Go types

```go
type Shape string

const (
    ShapeAnthropic Shape = "anthropic-compatible"
    ShapeOpenAI    Shape = "openai-compatible"
    ShapeResponses Shape = "openai-responses"
    ShapeUnknown   Shape = "unknown"
)

// CacheMode tells normalizer what to do with cache markers — not whether upstream caches.
type CacheMode string

const (
    CacheExplicit CacheMode = "explicit" // normalizer MAY inject cache_control
    CacheImplicit CacheMode = "implicit" // prefix stability only; never inject cache_control
    CacheStrip    CacheMode = "strip"    // remove foreign cache_control / breakpoints before forward
    CacheNone     CacheMode = "none"     // no cache API; strip if present
)

type Provider struct {
    Shape              Shape
    Cache              CachePolicy
    AuthHeaderNames    []string // priority order for logging hints only; proxy forwards all incoming auth
    SessionAffinity    SessionPolicy
    UsageFields        UsageProfile // where to read cache stats from response JSON
}

type CachePolicy struct {
    Mode            CacheMode
    Marker          string // "cache_control" | "prompt_cache_breakpoint" | ""
    MaxBreakpoints  int    // 4 for Anthropic explicit; 0 otherwise
    MinPrefixTokens int    // upstream hint only; normalizer does not enforce (Anthropic 512–4096, OpenAI 1024+, Groq 128–1024, Gemini 2048–4096)
    TTLDefault      string // Anthropic ephemeral default "5m"; optional "1h"
}

type SessionPolicy struct {
    Required bool     // proxy should preserve/generate sticky key when true
    Fields   []string // "session_id", "prompt_cache_key", "user", header "x-session-affinity"
}

type UsageProfile struct {
    HitPaths  []string // try in order; first >0 wins
    WritePaths []string
}

// defaultsFor(shape) — verified response fields (2026-08-22):
//   anthropic: HitPaths=["usage.cache_read_input_tokens"], WritePaths=["usage.cache_creation_input_tokens"]
//   openai:    HitPaths=["usage.prompt_tokens_details.cached_tokens","usage.input_tokens_details.cached_tokens"]
//   deepseek:  HitPaths=["usage.prompt_cache_hit_tokens"]
//   openrouter: HitPaths=["usage.prompt_tokens_details.cached_tokens"]
// Fireworks cached count may appear only in response headers — proxy stats should read
// `fireworks-cached-prompt-tokens` when JSON usage lacks cached fields.
```

#### Capabilities by shape (normalizer contract)

These apply regardless of which company hosts the upstream. Vendor-specific behavior is **implicit vs explicit**, not a separate shape.

| Shape | Cache.Mode | Normalizer injects | Strip before forward | Session affinity |
|---|---|---|---|---|
| `anthropic-compatible` | `explicit` | `cache_control: { "type": "ephemeral" }` on last stable block (≤4 breakpoints) | — | optional `session_id` if present in body |
| `openai-compatible` | `implicit` | **nothing** | `cache_control` if agent sent Anthropic markers by mistake | optional `prompt_cache_key` / `user` |
| `openai-responses` | `implicit` | **nothing** | `cache_control`; preserve native `prompt_cache_*` if already set | `prompt_cache_key` |
| `unknown` | `implicit` | **nothing** | `cache_control` (fail-open safe default) | — |

**`SupportsCache` in normalizer terms** = `Cache.Mode == explicit` only. Groq/OpenAI/DeepSeek *do* cache upstream, but the normalizer must **not** add `cache_control` — that is implicit caching.

#### Verified upstream cache reference (official docs)

Shape detection stays vendor-agnostic. This table is for operators, stats parsing, and golden tests.  
Sources fetched and verified **2026-08-22**. Links are the canonical doc pages.

##### Summary matrix

| Upstream | Official doc | Cache type | Client must send | Normalizer (dECODED) | Hit metric (response) |
|---|---|---|---|---|---|
| **Anthropic** | [Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) | Explicit `cache_control` | Top-level or per-block `{ "type": "ephemeral" }`; optional `"ttl": "1h"` | **Inject** on stable blocks (≤4 breakpoints) | `usage.cache_read_input_tokens`, `usage.cache_creation_input_tokens` |
| **OpenAI** | [Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching) | Automatic prefix; GPT-5.6+ explicit breakpoints | Nothing (auto); optional `prompt_cache_key`, `prompt_cache_breakpoint`, `prompt_cache_options` | **Never** inject `cache_control` | `usage.prompt_tokens_details.cached_tokens` (Chat); `usage.input_tokens_details.cached_tokens` (Responses) |
| **Groq** | [Prompt caching](https://console.groq.com/docs/prompt-caching) | Automatic prefix | Nothing | **Never** inject | `usage.prompt_tokens_details.cached_tokens` |
| **OpenRouter** | [Prompt caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching) | Per upstream; translates markers | `session_id` or `x-session-id` for sticky routing; optional `cache_control` / `prompt_cache_breakpoint` | Inject on anthropic shape; strip stray markers on openai shape | `usage.prompt_tokens_details.cached_tokens`, `cache_write_tokens` |
| **Together AI** | [Dedicated caching](https://docs.together.ai/docs/dedicated-endpoints/requests#prompt-caching), [Serverless](https://docs.together.ai/docs/serverless/overview#cached-input-discounts) | Automatic prefix | Nothing — “no header, parameter, or account toggle” | **Never** inject | Model-dependent (catalog “Cached input pricing” column) |
| **DeepSeek** | [Context caching](https://api-docs.deepseek.com/guides/kv_cache) | Automatic disk prefix | Nothing — “enabled by default… without modifying code” | **Never** inject | `usage.prompt_cache_hit_tokens`, `usage.prompt_cache_miss_tokens` |
| **Fireworks** | [Prompt caching](https://docs.fireworks.ai/guides/prompt-caching), [Anthropic compat](https://docs.fireworks.ai/tools-sdks/anthropic-compatibility) | Automatic prefix (replica-local) | `x-session-affinity` header or `user` field; optional `prompt_cache_key`, `prompt_cache_isolation_key` | **Never** inject; **do not** put `cache_control` on tools (unsupported on Anthropic-compat surface) | Headers `fireworks-cached-prompt-tokens` (dedicated); body with `perf_metrics_in_response` |
| **Google Gemini** | [Context caching](https://ai.google.dev/gemini-api/docs/caching) | Implicit (Gemini 2.5+) | Nothing for implicit | **Never** inject Anthropic markers | `usage_metadata.total_cached_tokens` |
| **Ollama** | [Anthropic compat](https://docs.ollama.com/api/anthropic-compatibility) | **Not supported** | — | **Strip** `cache_control` | No cache fields documented |
| **Custom OpenAI-compat** | — | Assume none or vendor-specific implicit | — | **Strip** `cache_control` (fail-open) | — |

Optional env override when upstream is known but shape is generic openai:

`DECODED_UPSTREAM_PROFILE=ollama|fireworks|groq|…` — adjusts strip/affinity hints only; does not change shape detection.

##### Per-vendor verified details

**Anthropic** ([docs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching))

- Marker: `cache_control: { "type": "ephemeral" }` on content blocks, or top-level for automatic caching.
- TTL: default **5 minutes**; `"ttl": "1h"` optional on `cache_control`.
- Max breakpoints: **4** explicit; automatic caching uses one slot when combined with explicit.
- Minimum cacheable prefix (Claude API): **512–4096 tokens depending on model** (e.g. Sonnet 4.x/5.x at 1024; Opus 4.5/4.6 at 4096; Haiku 4.5 at 4096). Prompts below minimum are processed without error and without caching.
- Ordering: cache references `tools`, `system`, `messages` in that order up to the breakpoint.
- No `cache_control` on unsupported blocks → not applicable to dECODED (we only mark stable system/tools).

**OpenAI** ([docs](https://developers.openai.com/api/docs/guides/prompt-caching))

- **No `cache_control` field.** Automatic for eligible prompts **≥ 1,024 tokens** (`gpt-4o` and newer).
- Pre–GPT-5.6: best-effort prefix reuse; hits in **128-token increments**; min varies **1024–2048** by model.
- GPT-5.6+: explicit `prompt_cache_breakpoint: { "mode": "explicit" }` on supported content blocks; `prompt_cache_options.mode` / `ttl: "30m"`; implicit breakpoint at latest user/tool message by default.
- Sticky routing hint: `prompt_cache_key` (optional).
- GPT-5.6+ cache writes billed at **1.25×** input; reads at discounted rate.

**Groq** ([docs](https://console.groq.com/docs/prompt-caching))

- Automatic; **no `cache_control`**, no manual cache management.
- **Supported models (Groq doc, 2026-08-22):** `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `openai/gpt-oss-safeguard-20b` only. Other models may be added later — do not assume all Groq models cache.
- Minimum prefix: **128–1024 tokens**, model-dependent.
- TTL: **2 hours** without use; volatile memory only.
- Pricing: **50% off** cached input tokens; cached tokens excluded from rate limits (subtracted after processing).
- OpenRouter’s Groq section additionally lists Kimi K2 — treat as **OpenRouter-specific routing**, not Groq’s own model list.

**OpenRouter** ([docs](https://openrouter.ai/docs/guides/best-practices/prompt-caching))

- Translates: Anthropic `cache_control` ↔ OpenAI `prompt_cache_breakpoint` (TTL not fully translated).
- Sticky routing: **`session_id`** (body) or **`x-session-id`** (header), else `prompt_cache_key`; expires after **10 minutes** inactivity.
- Explicit `cache_control` required for Anthropic and Alibaba Qwen routes; implicit for OpenAI, DeepSeek, Groq, Grok, Moonshot, Z.AI, Gemini 2.5 implicit.
- Usage: `usage.prompt_tokens_details.cached_tokens`, `cache_write_tokens`, plus `cache_discount` on generation metadata.

**Together AI** ([dedicated](https://docs.together.ai/docs/dedicated-endpoints/requests#prompt-caching), [serverless](https://docs.together.ai/docs/serverless/overview#cached-input-discounts))

- **Enabled by default** on dedicated endpoints; no configuration.
- Serverless: automatic, prefix-based, **best-effort**, shared fleet, no retention control; only models with “Cached input pricing” in catalog.
- **No `cache_control` API parameter.**

**DeepSeek** ([docs](https://api-docs.deepseek.com/guides/kv_cache))

- Context caching on disk: **enabled by default**, no code changes, no client cache parameters.
- Prefix must **fully match** a persisted cache unit (exact prefix semantics; not mid-prompt partial match).
- Best-effort; not 100% hit rate; entries cleared after hours to days of disuse.
- Usage: `prompt_cache_hit_tokens`, `prompt_cache_miss_tokens`.

**Fireworks** ([caching](https://docs.fireworks.ai/guides/prompt-caching), [anthropic compat](https://docs.fireworks.ai/tools-sdks/anthropic-compatibility))

- Automatic prefix caching on by default; exact prefix match only.
- Serverless: cache is **per-replica** — use **`x-session-affinity`** or `user` for stickiness; also supports `prompt_cache_key`, `prompt_cache_isolation_key`.
- Anthropic-compat endpoint: tool schema fields **`cache_control`, `eager_input_streaming`, `allowed_callers`, `input_examples` are not supported** (official unsupported list).
- Monitoring: response headers `fireworks-prompt-tokens`, `fireworks-cached-prompt-tokens`.

**Google Gemini** ([docs](https://ai.google.dev/gemini-api/docs/caching))

- **Implicit caching** on Gemini 2.5+ by default; no client enablement.
- Minimum input tokens for implicit cache: **2048** (2.5 Flash/Pro per doc table); newer 3.x Flash models **4096**.
- Separate explicit `cachedContents` API (handle-based) — not Anthropic `cache_control`; out of V1 normalizer scope.
- Hit field: `usage_metadata.total_cached_tokens`.

**Ollama** ([anthropic compat](https://docs.ollama.com/api/anthropic-compatibility))

- Under **“Not supported”**: “Prompt caching — `cache_control` blocks for caching prefixes”.
- OpenAI-compat surface ([docs](https://docs.ollama.com/api/openai-compatibility)) also has no prompt-cache API documented.

#### Routing (config, not Detect)

```go
func UpstreamURL(shape Shape, path string) string
```

| Incoming path | Env var | Default |
|---|---|---|
| `/v1/messages` | `DECODED_ANTHROPIC_BASE_URL` | `https://api.anthropic.com` |
| `/v1/chat/completions` | `DECODED_OPENAI_BASE_URL` | `https://api.openai.com` |
| `/v1/responses` | `DECODED_OPENAI_BASE_URL` | `https://api.openai.com` |

Developer aiming Groq/Together/Ollama at the proxy sets `DECODED_OPENAI_BASE_URL` to that vendor’s `/v1` root. Shape stays `openai-compatible`; cache mode stays `implicit` or `strip` (Ollama).

#### Auth forwarding

Detect does **not** choose auth. Proxy copies incoming headers verbatim (never log values):

- `x-api-key`, `Authorization`, `anthropic-version`, `anthropic-beta`, `content-type`
- Session/sticky: `x-session-id`, `x-session-affinity` when present

`AuthHeaderNames` on `Provider` is documentation for tests only.

#### Detection algorithm (pseudocode)

```
func Detect(url, body, headers):
    path = url path suffix only
    doc, err = parseJSON(body)
    if err != nil:
        return Provider{Shape: ShapeUnknown, Cache: implicit+strip}

    switch {
    case path ends with "/v1/messages":
        shape = ShapeAnthropic
    case path ends with "/v1/responses":
        shape = ShapeResponses
    case path ends with "/v1/chat/completions":
        shape = detectChatShape(doc)  // heuristics above
    default:
        shape = detectChatShape(doc) or ShapeUnknown
    }

    cache, session, usage = defaultsFor(shape)
    return Provider{shape, cache, authHint(shape), session, usage}
```

#### Tests (`internal/provider/provider_test.go`)

Golden fixtures in `testdata/detect/` — one JSON (+ path) per case:

- Anthropic `/v1/messages` with tools
- OpenAI `/v1/chat/completions` with `tool_calls`
- OpenRouter anthropic-shaped on chat path (edge)
- Body with stray `cache_control` on openai shape → expect strip policy
- Malformed JSON → unknown, no panic
- Ollama-shaped minimal chat → openai-compatible, strip policy when `DECODED_STRIP_CACHE=1` or always strip `cache_control` on implicit shapes

### 2. `internal/normalizer`

`Normalize(body []byte, p Provider) ([]byte, error)`

This is the product. Output must be **byte-identical** across turns when system + tools + stable content have not changed.

Rules:

1. Sort tool definitions alphabetically by `name`.
2. Strip timestamps from system text (ISO-8601, Unix seconds, `Current time:`, `Today is:`, `Current Time:`).
3. Strip dynamic session IDs from system text (UUID v4, obvious `session_id=` / `sessionId` values).
4. Sort consecutive same-type content blocks (`document`, `image`) by SHA-256 of canonical JSON.
5. **If `p.Cache.Mode == explicit` (anthropic-compatible shape):** attach `cache_control: { "type": "ephemeral" }` on the last stable block (system if present, else last sorted tool). Do not exceed `p.Cache.MaxBreakpoints` (4). Do not move a block that already has `cache_control`.
6. **If `p.Cache.Mode == implicit` or `strip`:** never inject `cache_control` or `prompt_cache_breakpoint`; strip Anthropic `cache_control` from content blocks and tools before forward.
7. Do not rewrite the current user turn or `tool_result` / `tool_use` blocks (anthropic) / `tool` role messages (openai).

Deterministic JSON: sorted object keys when re-serializing is required; stable spacing. Golden tests in `testdata/` must fail the build if a second `Normalize` of the same input differs by one byte.

### 3. `internal/proxy`

`Start(addr string) error` — default `127.0.0.1:8080`.

| Incoming | Forward to |
|---|---|
| `POST /v1/messages` | Anthropic `$base/v1/messages` |
| `POST /v1/chat/completions` | OpenAI or Groq `$base/v1/chat/completions` |
| `GET /health` | local 200 `{ "ok": true }` |
| anything else | 404, or fail-open proxy of raw path if it is a known provider prefix |

On every POST:

1. Read body (+ path, headers).
2. `Detect(url, body, headers)` → `Normalize(body, p)`.
3. Forward **normalized** body to `UpstreamURL(p.Shape, path)` with **incoming auth headers copied** (`x-api-key`, `Authorization`, `anthropic-version`, `anthropic-beta`, `content-type`, session/sticky headers). **Never log header values.**
4. Stream the response back.
5. Parse usage JSON (non-stream, or the final stream chunk) and `stats.Record`.

**Fail open:** any detect/normalize/parse error → forward the **original** body and headers unchanged. Never block the developer.

Listen loopback only (`127.0.0.1`). Do not bind `0.0.0.0` in V1.

### 4. `internal/stats`

In-memory only. No database.

```
Record(usage)
Snapshot() → requests, hits, hitRate, tokensSaved, costSaved
```

- Hit: first nonzero among verified paths — Anthropic `cache_read_input_tokens`; OpenAI/OpenRouter `prompt_tokens_details.cached_tokens`; DeepSeek `prompt_cache_hit_tokens`; Fireworks header `fireworks-cached-prompt-tokens`.
- Tokens saved: those cache-read counts.
- Cost saved (V1 estimate): Anthropic cache-read ≈ **0.1×** list input price. Use a constant in code (document the model it assumes, e.g. Sonnet input $3/MTok). OpenAI cached ≈ **0.5×** input. Groq: tokens saved 0.

Log one line per request (no keys):  
`cache hit: read=N write=M` or `cache miss`.

### 5. `cmd/decoded` CLI

| Command | Behavior |
|---|---|
| `decoded start` | `proxy.Start("127.0.0.1:8080")`. Print listen URL and `export ANTHROPIC_BASE_URL=http://localhost:8080/v1`. |
| `decoded init` | Detect Cursor / Claude Code / Copilot / Codex. **Write MCP config + rules.** Pro users are done after this + IDE restart. PAYG: also print `decoded start` + `ANTHROPIC_BASE_URL`. |
| `decoded mcp` | stdio MCP server (IDE launches this). Required for Pro. |
| `decoded stats` | Print snapshot. Proxy stats from `127.0.0.1:8080/stats` when `start` is running. MCP can log local read/stub counts to stderr or a small stats file. |

### 6. `internal/mcp`

stdio MCP (JSON-RPC). IDE launches `decoded mcp`. Loopback only. No network.

- Tool schemas are **static** (no timestamps in descriptions). Names sorted: `decoded_read`, `decoded_search`, `decoded_shell`.
- **Cache lever:** every tool result that can land in Cursor’s context must be **byte-stable** for the same inputs. Cursor’s prefix is unknown; stability after that prefix is the whole Pro product.
- `decoded_read`: SHA-256 of file bytes. First call returns **byte-stable AST content** for that file (deterministic: sorted keys, stable spacing, no clocks). Later call with same hash returns a **stable stub** (`hash`, `bytes`, `lines`, `path`) — same stub text every time for that hash. Do not return a raw file dump as the default Pro form (dumps pick up noise; AST encoding is the frozen form).
- `decoded_search`: compact path+line hits, sorted, hard cap on result size. Deterministic for the same query + tree.
- `decoded_shell`: allowlist-friendly; **deterministic compressed** stdout of known CLIs; **never compress stderr**.
- Fail open: if a tool errors, return a short error string the agent can act on. Do not crash the MCP process.

### 7. `internal/initagent`

`decoded init` writes (merge, do not clobber unrelated MCP servers):

- Cursor: `~/.cursor/mcp.json` (Windows: `%USERPROFILE%\.cursor\mcp.json`)
- Claude Code: user-level MCP config Claude actually reads
- Copilot / VS Code: `.vscode/mcp.json` in cwd if that layout exists, else print the snippet

Also writes a short Cursor rule / Claude skill: “prefer decoded_* tools for read/search/shell.” Without this, Pro MCP is ignored.

---

## Request paths

**PAYG**

```
Agent (Claude Code API key / SDK / OpenCode)
        →  decoded proxy :8080  →  Provider API
        →  cache_read stats
```

**Pro (must work)**

```
Cursor / Claude Pro / Copilot
        →  local MCP (decoded mcp)  →  decoded_read / search / shell
        →  IDE cloud (unchanged)
```

Pro never sets `ANTHROPIC_BASE_URL` to localhost.

---

## Frozen prefix (why cache hits)

**PAYG — we own the prefix**

```
[ system (no clocks, no session ids) | tools A-Z | stable docs hashed ]
                                                      ^
                                                      cache_control (Anthropic only)
[ current user turn | tool results ]   ← may change every turn
```

One changed byte before the breakpoint → full miss.  
Model switch (Sonnet → Haiku) → miss. Expected.

**Pro — Cursor owns the prefix; we own the next slot**

```
[ Cursor prefix — fixed, unknown, not our job ]
[ MCP results: AST reads | deterministic shell | sorted search ]
                                                      ^
                                                      we freeze these bytes
[ current user turn | new tool calls ]   ← may change every turn
```

We do not detect, normalize, or `cache_control` Cursor’s prefix.  
We do make MCP payloads byte-identical so Cursor can cache **stable content after its prefix**.  
Same outcome (hit on frozen bytes). Different door.

---

## V1 done-criteria (must all pass before V2)

**PAYG**

- [ ] `decoded start` listens on `127.0.0.1:8080`
- [ ] Fail-open: poisoned normalizer still forwards original body
- [ ] Auth headers forwarded; never written to logs or disk
- [ ] Anthropic: tools sorted, timestamps stripped, `cache_control` on last stable block
- [ ] OpenAI/Groq: no illegal `cache_control`
- [ ] Golden test: `Normalize` twice on the same fixture → identical bytes
- [ ] Live: 3+ turn loop, unchanged system+tools, turn 2+ has `cache_read_input_tokens > 0` (Anthropic API key)
- [ ] `decoded stats` shows requests, hits, hitRate, tokensSaved

**Pro (not optional)**

- [ ] Same download as PAYG
- [ ] `decoded init` writes working MCP config for Cursor and Claude Code on Windows + macOS
- [ ] MCP connected in the IDE after restart
- [ ] `decoded_read` / `decoded_search` / `decoded_shell` usable on a real repo
- [ ] `decoded_read` AST is byte-identical across two calls on the same file hash
- [ ] Unchanged file re-read is a stub, not a full dump
- [ ] `decoded_shell` compressed stdout is byte-identical for the same known CLI + same tree (stderr still verbatim)
- [ ] README Pro path: `decoded init` only — no tunnel, no BASE_URL

PAYG target: **90%+ of prefix tokens from cache after turn 1** (measured).  
Pro target: **MCP is the product they download** — fewer tokens on reads/shell, byte-stable tool results so Cursor’s cache can hit after its unknown prefix. Do not advertise Pro as 90% Anthropic `cache_read`.

## V2 (after V1, not now)

Harness: tiny frozen prefix + AST signatures/diffs in the suffix + local WAL handles + `hydrate`. Store-lossless. No LLMLingua in the prefix. No whole-repo AST in Zone 1.

V1 already returns per-file AST from `decoded_read`. V2 is the harness around it (diffs in the suffix, WAL, `hydrate`) — not “add AST for the first time.”

## Rust later

Allowed as a second implementation of **this same contract**:

- Same CLI verbs
- Same ports and paths
- Same `testdata/` goldens

Do not start Rust until V1 goldens exist. Overhead 1–3ms vs 3–8ms will not change hit rate.

---

## Non-goals for this file’s implementation phase

Do not add: cloud gateway, key vault, Cloudflare tunnel, ngrok, subscription session stealing, database, dashboard UI, TypeScript rewrite of V1.
