"""decodedd local proxy — prefix-normalizing daemon for AI coding agents.

Drop-in replacement for the Anthropic API base URL. Listens on localhost,
normalizes tool/system prefixes for KV-cache hits, and logs token/cost
telemetry to SQLite.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse
import uvicorn

from normalizer import NormalizeResult, normalize_request
from telemetry import RequestLog, Telemetry, model_prices

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

HOP_REQ = {
    "host",
    "content-length",
    "connection",
    "transfer-encoding",
    "accept-encoding",
    "keep-alive",
    "proxy-connection",
    "te",
    "trailer",
    "upgrade",
}
HOP_RES = {
    "content-encoding",
    "content-length",
    "connection",
    "transfer-encoding",
    "keep-alive",
    "proxy-connection",
    "te",
    "trailer",
    "upgrade",
}


class Config:
    host: str = os.getenv("PROXY_HOST", "127.0.0.1")
    port: int = int(os.getenv("PROXY_PORT", "8080"))
    target: str = os.getenv("PROXY_TARGET", "https://api.anthropic.com")
    db: Path = ROOT / os.getenv("TELEMETRY_DB", "telemetry.db")
    auto_cache: bool = os.getenv("AUTO_CACHE_CONTROL", "true").lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")


config = Config()


def _bool_flag(value: str) -> bool:
    return value.lower() in {"1", "true", "yes", "on"}


def resolve_path(full_path: str) -> str:
    path = full_path.lstrip("/")
    if path.startswith("v1/v1/"):
        path = path[3:]
    return path


def upstream_url(path: str) -> str:
    base = config.target.rstrip("/") + "/"
    return urljoin(base, path)


def filter_request_headers(request: Request) -> dict[str, str]:
    headers: dict[str, str] = {}
    for key, value in request.headers.items():
        if key.lower() in HOP_REQ:
            continue
        headers[key] = value
    if "x-api-key" not in {k.lower() for k in headers} and config.anthropic_api_key:
        headers["x-api-key"] = config.anthropic_api_key
    if "authorization" not in {k.lower() for k in headers} and config.openai_api_key:
        headers["authorization"] = f"Bearer {config.openai_api_key}"
    return headers


def filter_response_headers(headers: httpx.Headers) -> dict[str, str]:
    return {k: v for k, v in headers.items() if k.lower() not in HOP_RES}


def parse_usage(payload: dict[str, Any]) -> dict[str, int]:
    usage = payload.get("usage") or {}
    if not usage and isinstance(payload.get("message"), dict):
        usage = payload["message"].get("usage") or {}
    return {
        "input_tokens": int(usage.get("input_tokens") or 0),
        "output_tokens": int(usage.get("output_tokens") or 0),
        "cache_read_tokens": int(usage.get("cache_read_input_tokens") or 0),
        "cache_write_tokens": int(usage.get("cache_creation_input_tokens") or 0),
    }


class SseUsageTap:
    def __init__(self) -> None:
        self._buf = ""
        self.usage: dict[str, int] = {
            "input_tokens": 0,
            "output_tokens": 0,
            "cache_read_tokens": 0,
            "cache_write_tokens": 0,
        }

    def feed(self, chunk: bytes) -> None:
        self._buf += chunk.decode("utf-8", errors="ignore")
        while "\n\n" in self._buf:
            event, self._buf = self._buf.split("\n\n", 1)
            self._parse_event(event)

    def _parse_event(self, event: str) -> None:
        data_lines = [
            line[5:].lstrip() for line in event.split("\n") if line.startswith("data:")
        ]
        if not data_lines:
            return
        raw = "".join(data_lines).strip()
        if not raw or raw == "[DONE]":
            return
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError:
            return
        if not isinstance(obj, dict):
            return
        kind = obj.get("type")
        if kind == "message_start":
            message = obj.get("message") or {}
            if isinstance(message, dict):
                self._merge(parse_usage(message))
        elif kind in {"message_delta", "message_stop"}:
            self._merge(parse_usage(obj))

    def _merge(self, usage: dict[str, int]) -> None:
        for key, value in usage.items():
            if value:
                self.usage[key] = value


def log_line(tag: str, message: str) -> None:
    print(f"[{tag}] {message}", flush=True)


def emit_turn(
    *,
    path: str,
    method: str,
    result: NormalizeResult | None,
    matched: bool,
    status_code: int,
    usage: dict[str, int],
    stats: dict[str, Any],
) -> None:
    model = result.model if result else ""
    log_line("intercept", f"{method} /{path} - model: {model or 'unknown'}")
    if result:
        match_label = (
            "Prefix hash matched (byte-exact)"
            if matched
            else f"Prefix hash miss ({result.prefix_hash})"
        )
        log_line(
            "prefix-align",
            f"Sorted {result.tool_count} tool schemas -> {match_label}",
        )
    log_line(
        "upstream",
        f"Response {status_code} | tokens: "
        f"{{ input: {usage['input_tokens']}, "
        f"cache_read: {usage['cache_read_tokens']}, "
        f"cache_write: {usage['cache_write_tokens']} }}",
    )
    hit_pct = stats["cache_hit_rate"] * 100
    input_p, _, read_p, _ = model_prices(model)
    discount = (1 - read_p / input_p) * 100 if input_p else 0
    log_line(
        "stats",
        f"Cache Hit Rate: {hit_pct:.1f}% | "
        f"Turn Savings: ${stats['savings_usd']:.3f} "
        f"({discount:.0f}% off cached tokens)",
    )


def persist(
    telemetry: Telemetry,
    *,
    request: Request,
    path: str,
    result: NormalizeResult | None,
    matched: bool,
    status_code: int,
    usage: dict[str, int],
    started: float,
) -> dict[str, Any]:
    entry = RequestLog(
        method=request.method,
        path=f"/{path}",
        model=result.model if result else "",
        tool_count=result.tool_count if result else 0,
        tools_sorted=result.tools_sorted if result else 0,
        prefix_hash=result.prefix_hash if result else "",
        prefix_matched=int(matched),
        status_code=status_code,
        duration_ms=int((time.perf_counter() - started) * 1000),
        **usage,
    )
    stats = telemetry.log(entry)
    emit_turn(
        path=path,
        method=request.method,
        result=result,
        matched=matched,
        status_code=status_code,
        usage=usage,
        stats=stats,
    )
    return stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    if sys.stdout.encoding and sys.stdout.encoding.lower().replace("-", "") != "utf8":
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, OSError):
            pass

    db_path = config.db if config.db.is_absolute() else ROOT / config.db
    telemetry = Telemetry(db_path)
    timeout = httpx.Timeout(connect=10.0, read=None, write=60.0, pool=10.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=False) as client:
        app.state.http = client
        app.state.telemetry = telemetry
        log_line("proxy", f"Listening on http://{config.host}:{config.port}")
        log_line("proxy", f"Upstream {config.target}")
        yield
    telemetry.close()


app = FastAPI(title="decodedd-proxy", docs_url=None, redoc_url=None, lifespan=lifespan)


@app.get("/_decodedd/health")
async def health() -> dict[str, str]:
    return {"service": "decodedd-proxy", "status": "ok"}


@app.get("/_decodedd/stats")
async def stats(request: Request) -> dict[str, Any]:
    return request.app.state.telemetry.summary()


@app.api_route("/", methods=["GET", "HEAD"])
async def root() -> dict[str, str]:
    return {"service": "decodedd-proxy", "status": "ok"}


@app.api_route(
    "/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
)
async def proxy(full_path: str, request: Request) -> Response:
    path = resolve_path(full_path)
    url = upstream_url(path)
    started = time.perf_counter()
    telemetry: Telemetry = request.app.state.telemetry
    client: httpx.AsyncClient = request.app.state.http

    raw_body = await request.body()
    result: NormalizeResult | None = None
    matched = False
    outbound = raw_body
    headers = filter_request_headers(request)

    if raw_body and request.headers.get("content-type", "").startswith("application/json"):
        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError:
            payload = None
        if isinstance(payload, dict) and (
            "messages" in payload or "tools" in payload or "system" in payload
        ):
            result = normalize_request(payload, auto_cache=config.auto_cache)
            outbound = result.raw
            headers["content-type"] = "application/json"
            if result.model:
                previous = telemetry.last_prefix_hash(result.model)
                matched = bool(previous and previous == result.prefix_hash)

    try:
        upstream = await client.send(
            client.build_request(
                request.method,
                url,
                headers=headers,
                content=outbound or None,
                params=request.query_params,
            ),
            stream=True,
        )
    except httpx.RequestError as exc:
        log_line("upstream", f"Error contacting {url}: {exc}")
        return JSONResponse(
            {"error": "upstream_unreachable", "detail": str(exc)},
            status_code=502,
        )

    response_headers = filter_response_headers(upstream.headers)
    content_type = upstream.headers.get("content-type", "")
    is_sse = "text/event-stream" in content_type

    if is_sse:
        tap = SseUsageTap()

        async def stream():
            try:
                async for chunk in upstream.aiter_bytes():
                    tap.feed(chunk)
                    yield chunk
            finally:
                await upstream.aclose()
                if result is not None:
                    persist(
                        telemetry,
                        request=request,
                        path=path,
                        result=result,
                        matched=matched,
                        status_code=upstream.status_code,
                        usage=tap.usage,
                        started=started,
                    )

        return StreamingResponse(
            stream(),
            status_code=upstream.status_code,
            headers=response_headers,
            media_type=content_type,
        )

    body = await upstream.aread()
    await upstream.aclose()
    usage = {
        "input_tokens": 0,
        "output_tokens": 0,
        "cache_read_tokens": 0,
        "cache_write_tokens": 0,
    }
    if "application/json" in content_type:
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError:
            parsed = None
        if isinstance(parsed, dict):
            usage = parse_usage(parsed)

    if result is not None:
        persist(
            telemetry,
            request=request,
            path=path,
            result=result,
            matched=matched,
            status_code=upstream.status_code,
            usage=usage,
            started=started,
        )
    return Response(
        content=body,
        status_code=upstream.status_code,
        headers=response_headers,
        media_type=content_type or None,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="decodedd local prefix-cache proxy")
    parser.add_argument("--host", default=config.host, help="Bind host (default 127.0.0.1)")
    parser.add_argument("--port", type=int, default=config.port, help="Bind port (default 8080)")
    parser.add_argument(
        "--target",
        default=config.target,
        help="Upstream API base URL (default https://api.anthropic.com)",
    )
    parser.add_argument(
        "--db",
        default=str(config.db),
        help="SQLite telemetry path (default telemetry.db)",
    )
    parser.add_argument(
        "--auto-cache-control",
        default=str(config.auto_cache).lower(),
        help="Inject cache_control breakpoints (true/false)",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    config.host = args.host
    config.port = args.port
    config.target = args.target
    config.db = Path(args.db)
    config.auto_cache = _bool_flag(str(args.auto_cache_control))
    uvicorn.run(app, host=config.host, port=config.port, log_level="warning")
