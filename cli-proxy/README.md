# decodedd CLI proxy

Local-first prefix-cache proxy for AI coding agents (Claude Code, Cursor, OpenCode, AutoGen). It sits on `localhost:8080`, normalizes request JSON so tool/system prefixes stay byte-exact, forwards to the upstream API, and logs token/cost telemetry to SQLite.

API keys never leave this machine.

## Setup

```bash
cd cli-proxy
python -m venv .venv
```

Windows (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

macOS / Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and set `ANTHROPIC_API_KEY` (or pass the key from the client; the proxy forwards `x-api-key` when present).

## Run

```bash
python app.py --port 8080 --target https://api.anthropic.com
```

You should see:

```text
[proxy] Listening on http://127.0.0.1:8080
[proxy] Upstream https://api.anthropic.com
```

## Point an agent at the proxy

Claude Code / Anthropic SDK — prefer the host **without** a trailing `/v1` (the client already appends `/v1/messages`):

Windows (PowerShell):

```powershell
$env:ANTHROPIC_BASE_URL="http://localhost:8080"
```

macOS / Linux:

```bash
export ANTHROPIC_BASE_URL="http://localhost:8080"
```

`http://localhost:8080/v1` also works; duplicate `/v1/v1/` paths are rewritten.

## What it does

| Piece | File | Behavior |
| --- | --- | --- |
| Proxy server | `app.py` | Reverse-proxy with streaming SSE support |
| Prefix normalizer | `normalizer.py` | Canonical JSON, sorted tool schemas, optional `cache_control` |
| Telemetry | `telemetry.py` | SQLite log of tokens, cache hits, and estimated USD savings |

Local control endpoints (not forwarded upstream):

- `GET /_decodedd/health` — liveness
- `GET /_decodedd/stats` — aggregate cache hit rate and savings

Telemetry is written to `telemetry.db` (gitignored). Prompt bodies and API keys are not stored.

## Flags

| Flag | Default | Description |
| --- | --- | --- |
| `--host` | `127.0.0.1` | Bind address (localhost-only by default) |
| `--port` | `8080` | Bind port |
| `--target` | `https://api.anthropic.com` | Upstream API base URL |
| `--db` | `telemetry.db` | SQLite path |
| `--auto-cache-control` | `true` | Inject Anthropic cache breakpoints when missing |
