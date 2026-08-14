"""Deterministic JSON normalization for byte-exact prompt prefixes.

Anthropic (and other providers) cache on a byte-exact prompt prefix. Agent
CLIs often reshuffle tool schemas, JSON key order, and cache breakpoints
between turns, which silently busts the KV cache. This module makes the
stable prefix identical across turns:

- Recursively sort object keys
- Sort tool definitions by name
- Sort JSON Schema ``required`` lists (they are sets)
- Optionally inject ``cache_control`` on the last tool and the system prompt
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any


def canonical_dumps(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def _normalize(value: Any, key: str | None = None) -> Any:
    if isinstance(value, dict):
        return {k: _normalize(v, k) for k, v in value.items()}
    if isinstance(value, list):
        items = [_normalize(item, key) for item in value]
        if key == "tools":
            return sorted(
                items,
                key=lambda tool: (
                    str(tool.get("name", "")) if isinstance(tool, dict) else str(tool)
                ),
            )
        if key == "required":
            return sorted(items, key=lambda item: str(item))
        return items
    return value


def _has_cache_control(value: Any) -> bool:
    if isinstance(value, dict):
        if "cache_control" in value:
            return True
        return any(_has_cache_control(v) for v in value.values())
    if isinstance(value, list):
        return any(_has_cache_control(item) for item in value)
    return False


def _with_cache_control(block: dict[str, Any]) -> dict[str, Any]:
    if "cache_control" in block:
        return block
    return {**block, "cache_control": {"type": "ephemeral"}}


def inject_cache_control(body: dict[str, Any]) -> dict[str, Any]:
    """Add cache breakpoints on the tools prefix and the system prompt."""
    if _has_cache_control(body):
        return body

    out = dict(body)
    tools = out.get("tools")
    if isinstance(tools, list) and tools and isinstance(tools[-1], dict):
        tools = list(tools)
        tools[-1] = _with_cache_control(tools[-1])
        out["tools"] = tools

    system = out.get("system")
    if isinstance(system, str) and system:
        out["system"] = [
            {
                "type": "text",
                "text": system,
                "cache_control": {"type": "ephemeral"},
            }
        ]
    elif isinstance(system, list) and system and isinstance(system[-1], dict):
        system = list(system)
        system[-1] = _with_cache_control(system[-1])
        out["system"] = system

    return out


def prefix_material(body: dict[str, Any]) -> dict[str, Any]:
    """The prompt prefix that must stay byte-exact for cache hits."""
    return {
        "model": body.get("model"),
        "system": body.get("system"),
        "tools": body.get("tools"),
    }


def prefix_hash(body: dict[str, Any]) -> str:
    digest = hashlib.sha256(canonical_dumps(prefix_material(body)).encode("utf-8"))
    return digest.hexdigest()[:16]


@dataclass(frozen=True)
class NormalizeResult:
    body: dict[str, Any]
    raw: bytes
    model: str
    tool_count: int
    tools_sorted: int
    prefix_hash: str
    cache_control_injected: bool


def normalize_request(body: dict[str, Any], *, auto_cache: bool = True) -> NormalizeResult:
    original_tools = body.get("tools") if isinstance(body.get("tools"), list) else []
    original_names = [
        tool.get("name") for tool in original_tools if isinstance(tool, dict)
    ]

    normalized = _normalize(body)
    injected = False
    if auto_cache:
        before = canonical_dumps(normalized)
        normalized = inject_cache_control(normalized)
        injected = canonical_dumps(normalized) != before

    tools = normalized.get("tools") if isinstance(normalized.get("tools"), list) else []
    sorted_names = [tool.get("name") for tool in tools if isinstance(tool, dict)]
    tools_sorted = int(original_names != sorted_names and bool(original_names))

    raw = canonical_dumps(normalized).encode("utf-8")
    return NormalizeResult(
        body=normalized,
        raw=raw,
        model=str(normalized.get("model") or ""),
        tool_count=len(tools),
        tools_sorted=tools_sorted,
        prefix_hash=prefix_hash(normalized),
        cache_control_injected=injected,
    )
