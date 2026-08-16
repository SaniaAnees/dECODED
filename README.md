# decoded

KV-cache optimization proxy for AI agents.

```bash
pip install decoded
decoded start
```

The proxy listens on `http://localhost:8080`. Point Cursor or Claude Code at it. Keys are resolved in this order:

1. `Authorization` / `x-api-key` on the incoming request
2. `~/.decodedd/.env` from `decoded set-key`
3. `./.env` in the current directory

## Commands

```bash
decoded start [--port 8080]
decoded set-key groq gsk_...
decoded set-key anthropic sk-ant-...
decoded set-key openrouter sk-or-...
```

`decoded start` prints:

```text
[dECODED] Listening on http://localhost:8080
```

The process starts even if no key is stored. Cursor can pass its own key on each request.

## Clients

```bash
export OPENAI_BASE_URL="http://localhost:8080/v1"
export ANTHROPIC_BASE_URL="http://localhost:8080"
```

- `POST /v1/chat/completions` — OpenAI / Groq / OpenRouter
- `POST /v1/messages` — Anthropic (translated before forwarding)

## Install from this repo

```bash
pip install .
decoded start
```
