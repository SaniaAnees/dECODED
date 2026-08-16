"""Local SQLite logging. Metadata only — never prompts or API keys."""

from __future__ import annotations

import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


class Telemetry:
    def __init__(self, db_path: Path) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._create_table()

    def _create_table(self) -> None:
        with self._lock:
            self._conn.execute(
                """
                CREATE TABLE IF NOT EXISTS request_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    model TEXT,
                    input_tokens INTEGER DEFAULT 0,
                    cached_tokens INTEGER DEFAULT 0,
                    latency_ms INTEGER DEFAULT 0
                )
                """
            )
            self._conn.commit()

    def log(
        self,
        *,
        model: str,
        input_tokens: int,
        cached_tokens: int,
        latency_ms: int,
    ) -> None:
        with self._lock:
            self._conn.execute(
                """
                INSERT INTO request_logs (
                    timestamp, model, input_tokens, cached_tokens, latency_ms
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (utc_now(), model, input_tokens, cached_tokens, latency_ms),
            )
            self._conn.commit()

    def summary(self) -> dict[str, Any]:
        with self._lock:
            row = self._conn.execute(
                """
                SELECT
                    COUNT(*) AS requests,
                    COALESCE(SUM(input_tokens), 0) AS input_tokens,
                    COALESCE(SUM(cached_tokens), 0) AS cached_tokens,
                    COALESCE(AVG(latency_ms), 0) AS avg_latency_ms
                FROM request_logs
                """
            ).fetchone()
        data = dict(row)
        input_tokens = int(data["input_tokens"])
        cached_tokens = int(data["cached_tokens"])
        data["cache_hit_rate"] = (cached_tokens / input_tokens) if input_tokens else 0.0
        return data

    def close(self) -> None:
        with self._lock:
            self._conn.close()
