# dECODED CLI proxy

Local FastAPI daemon. It listens on `http://localhost:8080`, sorts request JSON so prompt prefixes stay byte-exact, forwards to **Groq** or **OpenRouter**, and logs token usage to SQLite.

## Setup

```powershell
cd cli-proxy
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and set `GROQ_API_KEY` and/or `OPENROUTER_API_KEY`. `.env` is gitignored.

## Run

```powershell
python app.py
```

Switch provider:

```powershell
python app.py --provider auto
python app.py --provider groq
python app.py --provider openrouter
```

`auto` (default) sends Llama-style traffic to Groq and `org/model` or `:free` ids to OpenRouter. If Groq returns an error, the request is retried on OpenRouter. OpenRouter’s default is `openrouter/free`.

You should see:

```text
[dECODED Proxy] Listening on http://127.0.0.1:8080
[dECODED Proxy] Provider: groq (https://api.groq.com/openai/v1)
```

## Point a client at the proxy

OpenAI-compatible (Cursor, OpenCode, most SDKs):

```powershell
$env:OPENAI_BASE_URL="http://localhost:8080/v1"
$env:OPENAI_API_KEY="not-used-proxy-reads-dotenv"
```

Anthropic-compatible (Claude Code):

```powershell
$env:ANTHROPIC_BASE_URL="http://localhost:8080"
```

`POST /v1/messages` is translated to OpenAI `chat/completions` before it is sent upstream.

## Endpoints

| Method | Path | Behavior |
| --- | --- | --- |
| POST | `/v1/chat/completions` | Normalize JSON, forward to Groq/OpenRouter |
| POST | `/v1/messages` | Anthropic → OpenAI, then the same forward path |
| GET | `/health` | Liveness |
| GET | `/_decodedd/stats` | Aggregate token / cache totals |

Each turn prints:

```text
[dECODED Proxy] Model: llama-3.3-70b-versatile | Input Tokens: 4,500 | Cached Tokens: 4,000 (88.8% Hit) | Latency: 180ms
```

Telemetry is stored in `telemetry.db` (gitignored), table `request_logs`. Prompt bodies and API keys are not stored.

## Files

| File | Role |
| --- | --- |
| `app.py` | Server, provider auth, Anthropic compatibility, streaming |
| `normalizer.py` | Alphabetical JSON keys, tools sorted, system prompt at index 0 |
| `telemetry.py` | SQLite `request_logs` |
| `.env` | Local API keys |
