"""SQLite telemetry for the local decodedd proxy.

Stores request metadata only — never prompt text, tools, or API keys.
"""

from __future__ import annotations

import sqlite3
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def model_prices(model: str) -> tuple[float, float, float, float]:
    """USD per million tokens: input, output, cache_read, cache_write."""
    name = (model or "").lower()
    if "opus" in name:
        return 15.0, 75.0, 1.50, 18.75
    if "haiku" in name:
        return 0.80, 4.0, 0.08, 1.00
    return 3.0, 15.0, 0.30, 3.75


def estimate_cost(
    model: str,
    *,
    input_tokens: int = 0,
    output_tokens: int = 0,
    cache_read_tokens: int = 0,
    cache_write_tokens: int = 0,
) -> tuple[float, float, float]:
    """Return (actual_usd, uncached_usd, savings_usd)."""
    input_p, output_p, read_p, write_p = model_prices(model)
    million = 1_000_000.0
    actual = (
        input_tokens * input_p
        + output_tokens * output_p
        + cache_read_tokens * read_p
        + cache_write_tokens * write_p
    ) / million
    total_input = input_tokens + cache_read_tokens + cache_write_tokens
    uncached = (total_input * input_p + output_tokens * output_p) / million
    savings = max(uncached - actual, 0.0)
    return actual, uncached, savings


def cache_hit_rate(
    input_tokens: int, cache_read_tokens: int, cache_write_tokens: int
) -> float:
    total = input_tokens + cache_read_tokens + cache_write_tokens
    if total <= 0:
        return 0.0
    return cache_read_tokens / total


@dataclass
class RequestLog:
    method: str
    path: str
    model: str
    tool_count: int
    tools_sorted: int
    prefix_hash: str
    prefix_matched: int
    status_code: int
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_write_tokens: int = 0
    duration_ms: int = 0


class Telemetry:
    def __init__(self, db_path: Path) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self) -> None:
        with self._lock:
            self._conn.execute(
                """
                CREATE TABLE IF NOT EXISTS requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts TEXT NOT NULL,
                    method TEXT NOT NULL,
                    path TEXT NOT NULL,
                    model TEXT,
                    tool_count INTEGER DEFAULT 0,
                    tools_sorted INTEGER DEFAULT 0,
                    prefix_hash TEXT,
                    prefix_matched INTEGER DEFAULT 0,
                    status_code INTEGER,
                    input_tokens INTEGER DEFAULT 0,
                    output_tokens INTEGER DEFAULT 0,
                    cache_read_tokens INTEGER DEFAULT 0,
                    cache_write_tokens INTEGER DEFAULT 0,
                    cache_hit_rate REAL DEFAULT 0,
                    cost_usd REAL DEFAULT 0,
                    savings_usd REAL DEFAULT 0,
                    duration_ms INTEGER DEFAULT 0
                )
                """
            )
            self._conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_requests_ts ON requests(ts)"
            )
            self._conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_requests_model ON requests(model)"
            )
            self._conn.commit()

    def last_prefix_hash(self, model: str) -> str | None:
        with self._lock:
            row = self._conn.execute(
                """
                SELECT prefix_hash FROM requests
                WHERE model = ? AND prefix_hash IS NOT NULL AND prefix_hash != ''
                ORDER BY id DESC
                LIMIT 1
                """,
                (model,),
            ).fetchone()
        return str(row["prefix_hash"]) if row else None

    def log(self, entry: RequestLog) -> dict[str, Any]:
        hit_rate = cache_hit_rate(
            entry.input_tokens, entry.cache_read_tokens, entry.cache_write_tokens
        )
        cost_usd, _, savings_usd = estimate_cost(
            entry.model,
            input_tokens=entry.input_tokens,
            output_tokens=entry.output_tokens,
            cache_read_tokens=entry.cache_read_tokens,
            cache_write_tokens=entry.cache_write_tokens,
        )
        with self._lock:
            self._conn.execute(
                """
                INSERT INTO requests (
                    ts, method, path, model, tool_count, tools_sorted,
                    prefix_hash, prefix_matched, status_code,
                    input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
                    cache_hit_rate, cost_usd, savings_usd, duration_ms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    utc_now(),
                    entry.method,
                    entry.path,
                    entry.model,
                    entry.tool_count,
                    entry.tools_sorted,
                    entry.prefix_hash,
                    entry.prefix_matched,
                    entry.status_code,
                    entry.input_tokens,
                    entry.output_tokens,
                    entry.cache_read_tokens,
                    entry.cache_write_tokens,
                    hit_rate,
                    cost_usd,
                    savings_usd,
                    entry.duration_ms,
                ),
            )
            self._conn.commit()
        return {
            "cache_hit_rate": hit_rate,
            "cost_usd": cost_usd,
            "savings_usd": savings_usd,
        }

    def summary(self) -> dict[str, Any]:
        with self._lock:
            row = self._conn.execute(
                """
                SELECT
                    COUNT(*) AS requests,
                    COALESCE(SUM(input_tokens), 0) AS input_tokens,
                    COALESCE(SUM(output_tokens), 0) AS output_tokens,
                    COALESCE(SUM(cache_read_tokens), 0) AS cache_read_tokens,
                    COALESCE(SUM(cache_write_tokens), 0) AS cache_write_tokens,
                    COALESCE(SUM(cost_usd), 0) AS cost_usd,
                    COALESCE(SUM(savings_usd), 0) AS savings_usd,
                    COALESCE(SUM(prefix_matched), 0) AS prefix_matches
                FROM requests
                """
            ).fetchone()
        data = dict(row)
        hit_rate = cache_hit_rate(
            int(data["input_tokens"]),
            int(data["cache_read_tokens"]),
            int(data["cache_write_tokens"]),
        )
        data["cache_hit_rate"] = hit_rate
        return data

    def close(self) -> None:
        with self._lock:
            self._conn.close()
