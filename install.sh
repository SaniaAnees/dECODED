#!/bin/sh
# Install decoded to ~/.local/bin (or $BIN_DIR).
# Usage: curl -fsSL https://raw.githubusercontent.com/SaniaAnees/dECODED/main/install.sh | sh
set -e

REPO="${DECODED_REPO:-SaniaAnees/dECODED}"
MODULE="github.com/${REPO}/cmd/decoded"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"
BIN_NAME="decoded"

os=$(uname -s)
arch=$(uname -m)
case "$arch" in
x86_64 | amd64) arch=amd64 ;;
aarch64 | arm64) arch=arm64 ;;
*)
	echo "decoded install: unsupported arch $arch" >&2
	exit 1
	;;
esac

mkdir -p "$BIN_DIR"

install_from_release() {
	asset="${BIN_NAME}_${os}_${arch}.tar.gz"
	url="https://github.com/${REPO}/releases/latest/download/${asset}"
	tmp=$(mktemp -d)
	trap 'rm -rf "$tmp"' EXIT
	if ! curl -fsSL "$url" -o "$tmp/$asset"; then
		return 1
	fi
	tar -xzf "$tmp/$asset" -C "$tmp"
	src=$(find "$tmp" -type f -name "$BIN_NAME" | head -n 1)
	if [ -z "$src" ]; then
		return 1
	fi
	cp "$src" "$BIN_DIR/$BIN_NAME"
	chmod +x "$BIN_DIR/$BIN_NAME"
	return 0
}

install_with_go() {
	if ! command -v go >/dev/null 2>&1; then
		return 1
	fi
	echo "decoded install: no GitHub release yet, using go install"
	GOBIN="$BIN_DIR" go install "${MODULE}@latest"
}

if install_from_release; then
	echo "installed $BIN_DIR/$BIN_NAME (release)"
elif install_with_go; then
	echo "installed $BIN_DIR/$BIN_NAME (go install)"
else
	echo "decoded install: need a GitHub release or Go 1.22+" >&2
	echo "  go install ${MODULE}@latest" >&2
	exit 1
fi

echo "run: decoded start"
case ":$PATH:" in
*":$BIN_DIR:"*) ;;
*)
	echo "add to PATH:  export PATH=\"$BIN_DIR:\$PATH\""
	;;
esac
