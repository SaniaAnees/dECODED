# dECODED

[github.com/SaniaAnees/dECODED](https://github.com/SaniaAnees/dECODED)

Localhost PAYG proxy for coding agents. Detects API shape, runs `Normalize` so the lab’s prefix cache can hit, then forwards **your** key to **your** lab. Loopback only (`127.0.0.1:8080`). Keys never leave the machine. There is no hosted hop.

## Install

Two commands. Copy the one for your machine.

**macOS / Linux**

```bash
curl -fsSL https://raw.githubusercontent.com/SaniaAnees/dECODED/main/install.sh | sh
decoded start
```

**Windows** (PowerShell)

```powershell
irm https://raw.githubusercontent.com/SaniaAnees/dECODED/main/install.ps1 | iex
decoded start
```

`install.sh` is one script: it picks the Darwin or Linux binary. From a clone: `go install ./cmd/decoded`.

## PAYG

Two processes. Do not mix the env vars.

**1. Proxy** (this binary talks to the lab):

```powershell
$env:DECODED_OPENAI_BASE_URL="https://api.mistral.ai/v1"
$env:DECODED_UPSTREAM_PROFILE="mistral"
decoded start
```

```bash
export DECODED_OPENAI_BASE_URL="https://api.mistral.ai/v1"
export DECODED_UPSTREAM_PROFILE="mistral"
decoded start
```

**2. Agent** (points at DecodeD, sends the same lab key as `Authorization`):

```powershell
$env:OPENAI_BASE_URL="http://127.0.0.1:8080/v1"
$env:OPENAI_API_KEY="your-lab-key"
```

Anthropic-shaped agents:

```powershell
$env:ANTHROPIC_BASE_URL="http://127.0.0.1:8080/v1"
```

Set `DECODED_ANTHROPIC_BASE_URL` on the **proxy** process if you are not using `https://api.anthropic.com`.

Health: `http://127.0.0.1:8080/health`  
Cache counters: `http://127.0.0.1:8080/stats`

Defaults if you omit lab URLs: OpenAI → `https://api.openai.com`, Anthropic → `https://api.anthropic.com`. Mistral is the path we have measured `cached_tokens` on; other labs may return `cached=0` even when the body is clean.

## Build

```bash
go test ./...
go build -o decoded ./cmd/decoded
```

Tagged GitHub Releases (`v0.1.0`, …) attach macOS/Linux/Windows binaries via GoReleaser.

## Feedback

Waste, great, or a change — open an issue (no API keys):

https://github.com/SaniaAnees/dECODED/issues/new/choose
