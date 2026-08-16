"""Deterministic, in-memory JSON normalization.

LLM prompt caches only hit when the *prefix* of a request is byte-exact.
Agent CLIs often shuffle JSON key order, tool schemas, and the system
message position between turns. This module makes that prefix stable:

1. Recursively sort every object’s keys alphabetically.
2. Sort tool definitions by name (and JSON Schema ``required`` lists).
3. Pin the system prompt at messages index 0.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any


def canonical_dumps(obj: Any) -> str:
    """Stable JSON: sorted keys, no extra whitespace."""
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def _sort_value(value: Any, parent_key: str | None = None) -> Any:
    """Walk the tree. Dict keys are sorted; a few lists are sorted too."""
    if isinstance(value, dict):
        return {key: _sort_value(value[key], key) for key in sorted(value, key=str)}

    if isinstance(value, list):
        items = [_sort_value(item, parent_key) for item in value]
        if parent_key == "tools":
            return sorted(items, key=_tool_sort_key)
        if parent_key == "required":
            return sorted(items, key=lambda item: str(item))
        return items

    return value


def _tool_sort_key(tool: Any) -> str:
    if not isinstance(tool, dict):
        return str(tool)
    function = tool.get("function") if isinstance(tool.get("function"), dict) else {}
    return str(function.get("name") or tool.get("name") or "")


def pin_system_prompt(body: dict[str, Any]) -> dict[str, Any]:
    """Ensure the static system prompt lives at messages[0]."""
    messages = body.get("messages")
    if not isinstance(messages, list) or not messages:
        return body

    system_msgs = []
    other_msgs = []
    for message in messages:
        if isinstance(message, dict) and message.get("role") == "system":
            system_msgs.append(message)
        else:
            other_msgs.append(message)

    if not system_msgs:
        return body

    pinned = dict(body)
    pinned["messages"] = system_msgs + other_msgs
    return pinned


def prefix_material(body: dict[str, Any]) -> dict[str, Any]:
    """The part of the request that must stay identical for a cache hit."""
    system = body.get("system")
    messages = body.get("messages") if isinstance(body.get("messages"), list) else []
    if system is None:
        system = [m for m in messages if isinstance(m, dict) and m.get("role") == "system"]
    return {
        "model": body.get("model"),
        "system": system,
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
    prefix_hash: str


def normalize_request(body: dict[str, Any], *, auto_cache: bool = False) -> NormalizeResult:
    """Return a cache-friendly copy of the request body."""
    del auto_cache

    pinned = pin_system_prompt(body)
    normalized = _sort_value(pinned)
    tools = normalized.get("tools") if isinstance(normalized.get("tools"), list) else []

    return NormalizeResult(
        body=normalized,
        raw=canonical_dumps(normalized).encode("utf-8"),
        model=str(normalized.get("model") or ""),
        tool_count=len(tools),
        prefix_hash=prefix_hash(normalized),
    )
