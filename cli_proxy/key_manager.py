"""Resolve and persist API keys.

Lookup order for each request:

1. ``Authorization`` / ``x-api-key`` on the incoming Cursor or Claude Code call
2. ``~/.decodedd/.env`` (written by ``decoded set-key``)
3. ``./.env`` in the current working directory (and ``cli_proxy/.env`` in this repo)

The proxy starts even when no key is stored. Cursor can still work by sending
its own Authorization header.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

CONFIG_DIR = Path.home() / ".decodedd"
CONFIG_ENV = CONFIG_DIR / ".env"

PROVIDER_TO_ENV = {
    "groq": "GROQ_API_KEY",
    "openrouter": "OPENROUTER_API_KEY",
    "anthropic": "ANTHROPIC_API_KEY",
    "openai": "OPENAI_API_KEY",
    "gemini": "GEMINI_API_KEY",
    "mistral": "MISTRAL_API_KEY",
}

# Values Cursor/Claude Code send when the real key lives on the proxy.
_PLACEHOLDERS = {
    "",
    "not-used",
    "not-used-proxy-reads-dotenv",
    "decoded",
    "dummy",
    "your-api-key",
    "sk-ant-...",
    "changeme",
}


class UnknownProviderError(ValueError):
    """Raised when ``decoded set-key`` gets a provider we do not store."""


def known_providers() -> list[str]:
    return sorted(PROVIDER_TO_ENV)


def project_env_paths() -> list[Path]:
    cwd = Path.cwd()
    package_env = Path(__file__).resolve().parent / ".env"
    return [cwd / ".env", package_env]


def _parse_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.is_file():
        return values
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def _write_env_file(path: Path, values: dict[str, str]) -> None:
    lines = [f"{key}={values[key]}" for key in sorted(values)]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    try:
        path.chmod(0o600)
    except OSError:
        pass


def save_key(provider: str, api_key: str) -> Path:
    """Save ``api_key`` for ``provider`` in ``~/.decodedd/.env``."""
    name = (provider or "").strip().lower()
    if name not in PROVIDER_TO_ENV:
        raise UnknownProviderError(
            f"Unknown provider {provider!r}. Choose from: {', '.join(known_providers())}"
        )
    key = (api_key or "").strip()
    if not key:
        raise ValueError("API key is empty.")

    CONFIG_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    values = _parse_env_file(CONFIG_ENV)
    values[PROVIDER_TO_ENV[name]] = key
    _write_env_file(CONFIG_ENV, values)
    return CONFIG_ENV


def get_saved_key(provider: str) -> str:
    """Return a stored key: user config, then project ``.env``, then process env."""
    env_name = PROVIDER_TO_ENV.get((provider or "").strip().lower(), "")
    if not env_name:
        return ""

    user_value = _parse_env_file(CONFIG_ENV).get(env_name, "").strip()
    if user_value:
        return user_value

    for path in project_env_paths():
        value = _parse_env_file(path).get(env_name, "").strip()
        if value:
            return value

    return os.getenv(env_name, "").strip()


def incoming_client_key(headers: dict[str, str] | None) -> str:
    """Pull a real key from Cursor / Claude Code request headers."""
    if not headers:
        return ""
    lowered = {str(key).lower(): str(value).strip() for key, value in headers.items()}

    auth = lowered.get("authorization", "")
    if auth.lower().startswith("bearer "):
        token = auth[7:].strip()
        if token.lower() not in _PLACEHOLDERS:
            return token

    x_api_key = lowered.get("x-api-key", "")
    if x_api_key.lower() not in _PLACEHOLDERS:
        return x_api_key
    return ""


def resolve_api_key(provider: str, headers: dict[str, str] | None = None) -> tuple[str, str]:
    """Return ``(key, source)`` where source is header, user, project, env, or none."""
    header_key = incoming_client_key(headers)
    if header_key:
        return header_key, "header"

    env_name = PROVIDER_TO_ENV.get((provider or "").strip().lower(), "")
    user_value = _parse_env_file(CONFIG_ENV).get(env_name, "").strip() if env_name else ""
    if user_value:
        return user_value, "user"

    for path in project_env_paths():
        value = _parse_env_file(path).get(env_name, "").strip() if env_name else ""
        if value:
            return value, "project"

    process_value = os.getenv(env_name, "").strip() if env_name else ""
    if process_value:
        return process_value, "env"
    return "", "none"


def load_key_sources() -> list[Path]:
    """Load dotenv files so PROXY_* settings resolve. Keys are still read via resolve_api_key."""
    loaded: list[Path] = []
    for path in project_env_paths():
        if path.is_file():
            load_dotenv(path, override=False)
            loaded.append(path)
    if CONFIG_ENV.is_file():
        load_dotenv(CONFIG_ENV, override=True)
        loaded.append(CONFIG_ENV)
    return loaded
