"""dECODED local proxy.

Listens on localhost:8080, normalizes LLM JSON so prefixes stay byte-exact,
forwards asynchronously to Groq or OpenRouter, and logs token usage to SQLite.

  POST /v1/chat/completions   OpenAI / Groq / OpenRouter shape
  POST /v1/messages           Anthropic shape (translated before forwarding)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncIterator

import httpx
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse

from cli_proxy.key_manager import (
    get_saved_key,
    load_key_sources,
    resolve_api_key,
)
from cli_proxy.normalizer import NormalizeResult, normalize_request
from cli_proxy.telemetry import Telemetry

load_key_sources()

# Groq and OpenRouter both speak OpenAI's /chat/completions protocol.
PROVIDERS = {
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "key_env": "GROQ_API_KEY",
        "default_model": "llama-3.3-70b-versatile",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "key_env": "OPENROUTER_API_KEY",
        "default_model": "openrouter/free",
    },
}

# In-memory map of model -> (prefix_hash, last_input_tokens).
# Used only when the upstream response has no cached_tokens field.
_prefix_memory: dict[str, tuple[str, int]] = {}


PACKAGE_DIR = Path(__file__).resolve().parent


def env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _telemetry_db() -> Path:
    """Keep the SQLite log next to the package (cli_proxy/telemetry.db)."""
    raw = env("TELEMETRY_DB")
    if raw and Path(raw).is_absolute():
        return Path(raw)
    return PACKAGE_DIR / (raw or "telemetry.db")


class Settings:
    """Runtime config, filled from .env and optional CLI flags.

    ``auto`` (default) sends fast Llama traffic to Groq and ``:free`` /
    ``org/model`` ids to OpenRouter. Pin ``groq`` or ``openrouter`` to force one.
    """

    host: str = env("PROXY_HOST", "127.0.0.1")
    port: int = int(env("PROXY_PORT", "8080") or "8080")
    provider: str = env("PROXY_PROVIDER", "auto").lower()
    db: Path = _telemetry_db()


def provider_key(provider: str) -> str:
    return get_saved_key(provider)


def provider_url(provider: str) -> str:
    override = env("PROXY_TARGET")
    if override and settings.provider == provider:
        return override.rstrip("/") + "/chat/completions"
    return PROVIDERS[provider]["base_url"].rstrip("/") + "/chat/completions"


def headers_for(provider: str, request: Request | None = None) -> dict[str, str]:
    incoming = dict(request.headers) if request is not None else None
    key, _source = resolve_api_key(provider, incoming)
    headers = {"content-type": "application/json"}
    if key:
        headers["authorization"] = f"Bearer {key}"
    if provider == "openrouter":
        headers["HTTP-Referer"] = "http://localhost:8080"
        headers["X-Title"] = "dECODED"
    return headers


def pick_provider(requested_model: str) -> str:
    """Choose Groq or OpenRouter for this request."""
    if settings.provider in PROVIDERS:
        return settings.provider
    name = (requested_model or "").strip()
    if "/" in name or name.endswith(":free"):
        return "openrouter"
    return "groq"


def model_for(provider: str, requested: str) -> str:
    """Map Claude/GPT names onto a model the chosen provider actually serves."""
    name = (requested or "").strip()
    default = env("DEFAULT_MODEL") or PROVIDERS[provider]["default_model"]
    if provider == "openrouter":
        if "/" in name or name.endswith(":free"):
            return name
        if name.lower().startswith("llama"):
            return "openrouter/free"
        return default
    lowered = name.lower()
    if lowered.startswith(("llama", "deepseek", "mixtral", "gemma", "qwen", "mistral", "compound")):
        return name
    return default


settings = Settings()


def log(message: str) -> None:
    print(f"[dECODED] {message}", flush=True)


def extract_usage(payload: dict[str, Any]) -> tuple[int, int]:
    """Return (input_tokens, cached_tokens) from an OpenAI-style body."""
    usage = payload.get("usage") or {}
    input_tokens = int(usage.get("prompt_tokens") or usage.get("input_tokens") or 0)
    details = usage.get("prompt_tokens_details") if isinstance(usage.get("prompt_tokens_details"), dict) else {}
    cached_tokens = int(
        details.get("cached_tokens")
        or usage.get("cached_tokens")
        or usage.get("cache_read_input_tokens")
        or 0
    )
    return input_tokens, cached_tokens


def estimate_cached_tokens(
    *,
    model: str,
    prefix: str,
    input_tokens: int,
    provider_cached: int,
) -> int:
    """Prefer the provider's cache counter; otherwise estimate from a matching prefix."""
    if provider_cached > 0:
        cached = provider_cached
    else:
        previous = _prefix_memory.get(model)
        if previous and previous[0] == prefix and input_tokens > 0:
            cached = min(previous[1], input_tokens)
        else:
            cached = 0
    _prefix_memory[model] = (prefix, input_tokens)
    return cached


def print_summary(model: str, input_tokens: int, cached_tokens: int, latency_ms: int) -> None:
    hit = (cached_tokens / input_tokens * 100) if input_tokens else 0.0
    log(
        f"Model: {model} | "
        f"Input Tokens: {input_tokens:,} | "
        f"Cached Tokens: {cached_tokens:,} ({hit:.1f}% Hit) | "
        f"Latency: {latency_ms}ms"
    )


def record_turn(
    telemetry: Telemetry,
    *,
    model: str,
    prefix: str,
    input_tokens: int,
    provider_cached: int,
    started: float,
) -> None:
    latency_ms = int((time.perf_counter() - started) * 1000)
    cached_tokens = estimate_cached_tokens(
        model=model,
        prefix=prefix,
        input_tokens=input_tokens,
        provider_cached=provider_cached,
    )
    telemetry.log(
        model=model,
        input_tokens=input_tokens,
        cached_tokens=cached_tokens,
        latency_ms=latency_ms,
    )
    print_summary(model, input_tokens, cached_tokens, latency_ms)


# --- Anthropic request  ->  OpenAI chat.completions -----------------------


def _text_from_blocks(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return str(content)
    parts = []
    for block in content:
        if isinstance(block, dict) and block.get("type") == "text":
            parts.append(block.get("text") or "")
        elif isinstance(block, str):
            parts.append(block)
    return "\n".join(parts)


def anthropic_to_openai(body: dict[str, Any]) -> dict[str, Any]:
    """Translate POST /v1/messages into Groq/OpenRouter's OpenAI schema."""
    messages: list[dict[str, Any]] = []

    system = body.get("system")
    if isinstance(system, str) and system:
        messages.append({"role": "system", "content": system})
    elif isinstance(system, list):
        text = _text_from_blocks(system)
        if text:
            messages.append({"role": "system", "content": text})

    for message in body.get("messages") or []:
        if not isinstance(message, dict):
            continue
        messages.extend(_convert_anthropic_message(message))

    openai_body: dict[str, Any] = {
        "model": body.get("model"),
        "messages": messages,
        "stream": bool(body.get("stream")),
        "max_tokens": int(body.get("max_tokens") or body.get("max_completion_tokens") or 4096),
    }
    for key in ("temperature", "top_p", "stop"):
        if key in body:
            openai_body[key] = body[key]

    tools = body.get("tools")
    if isinstance(tools, list) and tools:
        openai_body["tools"] = [_convert_tool(tool) for tool in tools if isinstance(tool, dict)]

    tool_choice = body.get("tool_choice")
    if isinstance(tool_choice, str):
        openai_body["tool_choice"] = tool_choice
    elif isinstance(tool_choice, dict):
        choice_type = tool_choice.get("type")
        if choice_type in {"auto", "any"}:
            openai_body["tool_choice"] = "auto" if choice_type == "auto" else "required"
        elif choice_type == "tool" and tool_choice.get("name"):
            openai_body["tool_choice"] = {
                "type": "function",
                "function": {"name": tool_choice["name"]},
            }

    return openai_body


def _convert_tool(tool: dict[str, Any]) -> dict[str, Any]:
    if tool.get("type") == "function" and isinstance(tool.get("function"), dict):
        return tool
    return {
        "type": "function",
        "function": {
            "name": tool.get("name"),
            "description": tool.get("description") or "",
            "parameters": tool.get("input_schema")
            or tool.get("parameters")
            or {"type": "object", "properties": {}},
        },
    }


def _convert_anthropic_message(message: dict[str, Any]) -> list[dict[str, Any]]:
    role = message.get("role") or "user"
    content = message.get("content")
    if not isinstance(content, list):
        return [{"role": role, "content": content}]

    converted: list[dict[str, Any]] = []
    text_parts: list[str] = []
    tool_calls: list[dict[str, Any]] = []

    for block in content:
        if not isinstance(block, dict):
            continue
        block_type = block.get("type")
        if block_type == "text":
            text_parts.append(block.get("text") or "")
        elif block_type == "tool_use":
            tool_calls.append(
                {
                    "id": block.get("id") or block.get("name"),
                    "type": "function",
                    "function": {
                        "name": block.get("name"),
                        "arguments": json.dumps(block.get("input") or {}, separators=(",", ":")),
                    },
                }
            )
        elif block_type == "tool_result":
            result = block.get("content")
            converted.append(
                {
                    "role": "tool",
                    "tool_call_id": block.get("tool_use_id"),
                    "content": result if isinstance(result, str) else json.dumps(result),
                }
            )

    if tool_calls:
        converted.append(
            {
                "role": "assistant",
                "content": "\n".join(text_parts) or None,
                "tool_calls": tool_calls,
            }
        )
    elif text_parts:
        converted.append({"role": role, "content": "\n".join(text_parts)})

    return converted


# --- OpenAI chat.completions  ->  Anthropic response ----------------------


def openai_to_anthropic(payload: dict[str, Any], model: str) -> dict[str, Any]:
    if payload.get("error"):
        error = payload["error"]
        message = error.get("message") if isinstance(error, dict) else str(error)
        return {"type": "error", "error": {"type": "api_error", "message": message}}

    choice = (payload.get("choices") or [{}])[0]
    message = choice.get("message") or {}
    content: list[dict[str, Any]] = []

    text = message.get("content") or ""
    if text:
        content.append({"type": "text", "text": text})

    for tool_call in message.get("tool_calls") or []:
        function = tool_call.get("function") or {}
        try:
            arguments = json.loads(function.get("arguments") or "{}")
        except json.JSONDecodeError:
            arguments = {"_raw": function.get("arguments")}
        content.append(
            {
                "type": "tool_use",
                "id": tool_call.get("id"),
                "name": function.get("name"),
                "input": arguments,
            }
        )

    finish = choice.get("finish_reason")
    stop_reason = {"stop": "end_turn", "length": "max_tokens", "tool_calls": "tool_use"}.get(
        finish, "end_turn"
    )
    input_tokens, _cached = extract_usage(payload)
    usage = payload.get("usage") or {}

    return {
        "id": payload.get("id") or "msg_decodedd",
        "type": "message",
        "role": "assistant",
        "model": model,
        "content": content or [{"type": "text", "text": ""}],
        "stop_reason": stop_reason,
        "stop_sequence": None,
        "usage": {
            "input_tokens": input_tokens,
            "output_tokens": int(usage.get("completion_tokens") or usage.get("output_tokens") or 0),
        },
    }


def sse(event: str, data: dict[str, Any]) -> bytes:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n".encode("utf-8")


class AnthropicStream:
    """Turn OpenAI SSE chunks into Anthropic ``message_*`` events."""

    def __init__(self, model: str) -> None:
        self.model = model
        self.buf = ""
        self.started = False
        self.text_open = False
        self.usage: dict[str, int] = {}
        self.tool_calls: dict[int, dict[str, str]] = {}

    def feed(self, chunk: bytes) -> list[bytes]:
        frames: list[bytes] = []
        self.buf += chunk.decode("utf-8", errors="ignore")
        while "\n\n" in self.buf:
            raw, self.buf = self.buf.split("\n\n", 1)
            frames.extend(self._handle_frame(raw))
        return frames

    def finish(self) -> list[bytes]:
        frames: list[bytes] = []
        if self.text_open:
            frames.append(sse("content_block_stop", {"type": "content_block_stop", "index": 0}))
            self.text_open = False
        next_index = 1 if self.started else 0
        for offset, tool in enumerate(self.tool_calls.values()):
            index = next_index + offset
            try:
                tool_input = json.loads(tool.get("arguments") or "{}")
            except json.JSONDecodeError:
                tool_input = {"_raw": tool.get("arguments")}
            frames.append(
                sse(
                    "content_block_start",
                    {
                        "type": "content_block_start",
                        "index": index,
                        "content_block": {
                            "type": "tool_use",
                            "id": tool.get("id"),
                            "name": tool.get("name"),
                            "input": tool_input,
                        },
                    },
                )
            )
            frames.append(sse("content_block_stop", {"type": "content_block_stop", "index": index}))
        if self.started:
            frames.append(
                sse(
                    "message_delta",
                    {
                        "type": "message_delta",
                        "delta": {"stop_reason": "tool_use" if self.tool_calls else "end_turn"},
                        "usage": {"output_tokens": int(self.usage.get("completion_tokens") or 0)},
                    },
                )
            )
            frames.append(sse("message_stop", {"type": "message_stop"}))
        return frames

    def _handle_frame(self, raw: str) -> list[bytes]:
        data_lines = [line[5:].lstrip() for line in raw.split("\n") if line.startswith("data:")]
        if not data_lines:
            return []
        payload = "".join(data_lines).strip()
        if not payload or payload == "[DONE]":
            return []
        try:
            obj = json.loads(payload)
        except json.JSONDecodeError:
            return []
        if not isinstance(obj, dict):
            return []

        if obj.get("usage"):
            self.usage = obj["usage"]

        choice = (obj.get("choices") or [{}])[0]
        delta = choice.get("delta") or {}
        frames: list[bytes] = []

        if not self.started:
            self.started = True
            frames.append(
                sse(
                    "message_start",
                    {
                        "type": "message_start",
                        "message": {
                            "id": obj.get("id") or "msg_decodedd",
                            "type": "message",
                            "role": "assistant",
                            "content": [],
                            "model": self.model,
                            "stop_reason": None,
                            "usage": {"input_tokens": 0, "output_tokens": 0},
                        },
                    },
                )
            )

        text = delta.get("content")
        if text:
            if not self.text_open:
                self.text_open = True
                frames.append(
                    sse(
                        "content_block_start",
                        {
                            "type": "content_block_start",
                            "index": 0,
                            "content_block": {"type": "text", "text": ""},
                        },
                    )
                )
            frames.append(
                sse(
                    "content_block_delta",
                    {
                        "type": "content_block_delta",
                        "index": 0,
                        "delta": {"type": "text_delta", "text": text},
                    },
                )
            )

        for tool_delta in delta.get("tool_calls") or []:
            index = int(tool_delta.get("index") or 0)
            slot = self.tool_calls.setdefault(index, {"id": "", "name": "", "arguments": ""})
            if tool_delta.get("id"):
                slot["id"] = tool_delta["id"]
            function = tool_delta.get("function") or {}
            if function.get("name"):
                slot["name"] = function["name"]
            if function.get("arguments"):
                slot["arguments"] += function["arguments"]

        return frames


class OpenAIUsageTap:
    """Pull ``usage`` out of an OpenAI SSE stream without changing the bytes."""

    def __init__(self) -> None:
        self.buf = ""
        self.input_tokens = 0
        self.cached_tokens = 0

    def feed(self, chunk: bytes) -> None:
        self.buf += chunk.decode("utf-8", errors="ignore")
        while "\n\n" in self.buf:
            raw, self.buf = self.buf.split("\n\n", 1)
            data_lines = [line[5:].lstrip() for line in raw.split("\n") if line.startswith("data:")]
            payload = "".join(data_lines).strip()
            if not payload or payload == "[DONE]":
                continue
            try:
                obj = json.loads(payload)
            except json.JSONDecodeError:
                continue
            if isinstance(obj, dict) and obj.get("usage"):
                self.input_tokens, self.cached_tokens = extract_usage(obj)


# --- FastAPI app ----------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    if sys.stdout.encoding and "utf" not in sys.stdout.encoding.lower():
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, OSError):
            pass

    load_key_sources()
    groq_ok = bool(provider_key("groq"))
    openrouter_ok = bool(provider_key("openrouter"))
    if not groq_ok and not openrouter_ok:
        log("No stored key yet — Cursor/Claude Code Authorization headers will be used")

    telemetry = Telemetry(settings.db)
    timeout = httpx.Timeout(connect=10.0, read=None, write=60.0, pool=10.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=False) as client:
        app.state.http = client
        app.state.telemetry = telemetry
        log(f"Listening on http://localhost:{settings.port}")
        yield
    telemetry.close()


app = FastAPI(title="dECODED Proxy", docs_url=None, redoc_url=None, lifespan=lifespan)


@app.get("/")
@app.get("/health")
@app.get("/_decodedd/health")
async def health() -> dict[str, Any]:
    return {
        "service": "decodedd-proxy",
        "status": "ok",
        "provider": settings.provider,
        "groq": bool(provider_key("groq")),
        "openrouter": bool(provider_key("openrouter")),
    }


@app.get("/_decodedd/stats")
async def stats(request: Request) -> dict[str, Any]:
    return request.app.state.telemetry.summary()


@app.post("/v1/chat/completions")
@app.post("/chat/completions")
async def chat_completions(request: Request):
    return await handle_llm_request(request, style="openai")


@app.post("/v1/messages")
@app.post("/messages")
async def messages(request: Request):
    return await handle_llm_request(request, style="anthropic")


async def send_upstream(
    client: httpx.AsyncClient,
    provider: str,
    payload: dict[str, Any],
    request: Request | None = None,
) -> httpx.Response | JSONResponse:
    incoming = dict(request.headers) if request is not None else None
    key, _source = resolve_api_key(provider, incoming)
    if not key:
        return JSONResponse(
            {
                "error": "missing_api_key",
                "detail": (
                    "Pass an Authorization header from Cursor/Claude Code, "
                    f"or run: decoded set-key {provider} <key>"
                ),
            },
            status_code=401,
        )
    try:
        return await client.send(
            client.build_request(
                "POST",
                provider_url(provider),
                headers=headers_for(provider, request),
                json=payload,
            ),
            stream=True,
        )
    except httpx.RequestError as exc:
        log(f"{provider} error: {exc}")
        return JSONResponse({"error": "upstream_unreachable", "detail": str(exc)}, status_code=502)


async def handle_llm_request(request: Request, *, style: str):
    """Shared path for both endpoints: normalize → (translate) → forward → log."""
    started = time.perf_counter()
    try:
        body = await request.json()
    except json.JSONDecodeError:
        return JSONResponse({"error": "invalid_json"}, status_code=400)
    if not isinstance(body, dict):
        return JSONResponse({"error": "body_must_be_object"}, status_code=400)

    normalized: NormalizeResult = normalize_request(body)
    payload = dict(normalized.body)

    if style == "anthropic":
        payload = anthropic_to_openai(payload)

    requested_model = str(payload.get("model") or "")
    provider = pick_provider(requested_model)
    payload["model"] = model_for(provider, requested_model)
    stream = bool(payload.get("stream"))
    if stream:
        payload["stream_options"] = {"include_usage": True}

    client: httpx.AsyncClient = request.app.state.http
    telemetry: Telemetry = request.app.state.telemetry

    upstream = await send_upstream(client, provider, payload, request)
    if isinstance(upstream, JSONResponse):
        return upstream

    # auto mode: if Groq rejects the call, retry once on OpenRouter.
    if (
        settings.provider == "auto"
        and provider == "groq"
        and upstream.status_code >= 400
        and provider_key("openrouter")
    ):
        status = upstream.status_code
        await upstream.aclose()
        provider = "openrouter"
        payload["model"] = model_for(provider, requested_model)
        log(f"Groq returned {status}; retrying OpenRouter ({payload['model']})")
        upstream = await send_upstream(client, provider, payload, request)
        if isinstance(upstream, JSONResponse):
            return upstream

    log(f"Upstream: {provider} model={payload['model']}")
    model = str(payload.get("model") or "unknown")
    content_type = upstream.headers.get("content-type") or ""
    if stream and "text/event-stream" in content_type:
        return await _stream_response(
            upstream,
            telemetry=telemetry,
            style=style,
            model=model,
            prefix=normalized.prefix_hash,
            started=started,
        )

    raw = await upstream.aread()
    await upstream.aclose()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return JSONResponse({"error": "upstream_not_json", "body": raw.decode("utf-8", "replace")}, status_code=502)

    input_tokens, provider_cached = extract_usage(data)
    record_turn(
        telemetry,
        model=model,
        prefix=normalized.prefix_hash,
        input_tokens=input_tokens,
        provider_cached=provider_cached,
        started=started,
    )

    if style == "anthropic":
        data = openai_to_anthropic(data, model)
    return JSONResponse(data, status_code=upstream.status_code)


async def _stream_response(
    upstream: httpx.Response,
    *,
    telemetry: Telemetry,
    style: str,
    model: str,
    prefix: str,
    started: float,
) -> StreamingResponse:
    translator = AnthropicStream(model) if style == "anthropic" else None
    tap = OpenAIUsageTap()

    async def generate() -> AsyncIterator[bytes]:
        try:
            async for chunk in upstream.aiter_bytes():
                tap.feed(chunk)
                if translator is None:
                    yield chunk
                else:
                    for frame in translator.feed(chunk):
                        yield frame
            if translator is not None:
                for frame in translator.finish():
                    yield frame
        finally:
            await upstream.aclose()
            input_tokens = tap.input_tokens
            provider_cached = tap.cached_tokens
            if translator is not None:
                input_tokens = int(
                    (translator.usage or {}).get("prompt_tokens")
                    or (translator.usage or {}).get("input_tokens")
                    or input_tokens
                )
                details = (translator.usage or {}).get("prompt_tokens_details") or {}
                if isinstance(details, dict) and details.get("cached_tokens"):
                    provider_cached = int(details["cached_tokens"])
            record_turn(
                telemetry,
                model=model,
                prefix=prefix,
                input_tokens=input_tokens,
                provider_cached=provider_cached,
                started=started,
            )

    return StreamingResponse(
        generate(),
        status_code=upstream.status_code,
        media_type="text/event-stream",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="dECODED local LLM proxy")
    parser.add_argument("--host", default=settings.host)
    parser.add_argument("--port", type=int, default=settings.port)
    parser.add_argument(
        "--provider",
        choices=["auto", "groq", "openrouter"],
        default=settings.provider,
        help="auto uses Groq first and OpenRouter for :free / org/model ids",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    settings.host = args.host
    settings.port = args.port
    settings.provider = args.provider
    uvicorn.run(app, host=settings.host, port=settings.port, log_level="warning")
