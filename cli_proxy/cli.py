"""Command-line interface for the decoded proxy.

``decoded start`` and ``decoded set-key`` are the two user-facing commands.
"""

from __future__ import annotations

import sys

import click
import uvicorn

from cli_proxy import __version__
from cli_proxy.key_manager import UnknownProviderError, load_key_sources, save_key


def _configure_stdio() -> None:
    if sys.stdout.encoding and "utf" not in sys.stdout.encoding.lower():
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, OSError):
            pass


@click.group(context_settings={"help_option_names": ["-h", "--help"]})
@click.version_option(version=__version__, prog_name="decoded")
def main() -> None:
    """KV-cache optimization proxy for AI agents."""
    _configure_stdio()


@main.command()
@click.option("--port", default=8080, show_default=True, type=int, help="Listen port.")
@click.option("--host", default="127.0.0.1", show_default=True, help="Bind address.")
@click.option(
    "--provider",
    default="auto",
    type=click.Choice(["auto", "groq", "openrouter"], case_sensitive=False),
    show_default=True,
    help="auto uses Groq first and OpenRouter for :free / org/model ids.",
)
def start(port: int, host: str, provider: str) -> None:
    """Start the local proxy (default http://localhost:8080)."""
    load_key_sources()

    from cli_proxy.app import app, settings

    settings.host = host
    settings.port = port
    settings.provider = provider.lower()
    uvicorn.run(app, host=host, port=port, log_level="warning")


@main.command("set-key")
@click.argument("provider")
@click.argument("api_key")
def set_key_command(provider: str, api_key: str) -> None:
    """Save an API key to ~/.decodedd/.env.

    Example: decoded set-key groq gsk_...
    """
    try:
        save_key(provider, api_key)
    except UnknownProviderError as exc:
        raise click.ClickException(str(exc)) from exc
    except ValueError as exc:
        raise click.ClickException(str(exc)) from exc
    click.echo(f"[dECODED] Key saved for {provider}")


if __name__ == "__main__":
    main()
