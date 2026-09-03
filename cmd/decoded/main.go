package main

import (
	"fmt"
	"os"
	"runtime"
	"strings"

	"github.com/SaniaAnees/dECODED/internal/proxy"
)

// Set by GoReleaser: -X main.version=...
var version = "dev"

func main() {
	if len(os.Args) < 2 {
		printUsage(os.Stderr)
		os.Exit(2)
	}
	switch os.Args[1] {
	case "start":
		addr := proxy.DefaultAddr
		fmt.Print(startBanner(addr, runtime.GOOS))
		if err := proxy.Start(addr); err != nil {
			fmt.Fprintf(os.Stderr, "decoded: %v\n", err)
			os.Exit(1)
		}
	case "version", "-v", "--version":
		fmt.Printf("decoded %s %s/%s\n", version, runtime.GOOS, runtime.GOARCH)
	default:
		printUsage(os.Stderr)
		os.Exit(2)
	}
}

func printUsage(w *os.File) {
	fmt.Fprintf(w, "usage: decoded start | decoded version\n")
	fmt.Fprintf(w, "  start    PAYG localhost proxy on %s\n", proxy.DefaultAddr)
	fmt.Fprintf(w, "  version  print build version\n")
}

func startBanner(addr, goos string) string {
	if strings.TrimSpace(addr) == "" {
		addr = proxy.DefaultAddr
	}
	openaiUp := envOr("DECODED_OPENAI_BASE_URL", "https://api.openai.com")
	anthUp := envOr("DECODED_ANTHROPIC_BASE_URL", "https://api.anthropic.com")

	var b strings.Builder
	fmt.Fprintf(&b, "decoded PAYG proxy  http://%s\n", addr)
	fmt.Fprintf(&b, "  health  http://%s/health\n", addr)
	fmt.Fprintf(&b, "  stats   http://%s/stats\n", addr)
	fmt.Fprintf(&b, "upstream openai    %s\n", openaiUp)
	fmt.Fprintf(&b, "upstream anthropic %s\n", anthUp)
	fmt.Fprintln(&b)
	fmt.Fprintln(&b, "This process talks to the lab. Your agent talks to this process.")
	fmt.Fprintln(&b, "Set DECODED_* on this process. Point the agent at localhost. Keys stay on your machine.")
	fmt.Fprintln(&b, "feedback  https://github.com/SaniaAnees/dECODED/issues")
	fmt.Fprintln(&b)
	if goos == "windows" {
		fmt.Fprintln(&b, "Agent (OpenAI-compatible / Mistral):")
		fmt.Fprintln(&b, `  $env:OPENAI_BASE_URL="http://127.0.0.1:8080/v1"`)
		fmt.Fprintln(&b, "Agent (Anthropic):")
		fmt.Fprintln(&b, `  $env:ANTHROPIC_BASE_URL="http://127.0.0.1:8080/v1"`)
		fmt.Fprintln(&b, "Example lab (same window as decoded start):")
		fmt.Fprintln(&b, `  $env:DECODED_OPENAI_BASE_URL="https://api.mistral.ai/v1"`)
		fmt.Fprintln(&b, `  $env:DECODED_UPSTREAM_PROFILE="mistral"`)
	} else {
		fmt.Fprintln(&b, "Agent (OpenAI-compatible / Mistral):")
		fmt.Fprintln(&b, `  export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"`)
		fmt.Fprintln(&b, "Agent (Anthropic):")
		fmt.Fprintln(&b, `  export ANTHROPIC_BASE_URL="http://localhost:8080/v1"`)
		fmt.Fprintln(&b, "Example lab (same shell as decoded start):")
		fmt.Fprintln(&b, `  export DECODED_OPENAI_BASE_URL="https://api.mistral.ai/v1"`)
		fmt.Fprintln(&b, `  export DECODED_UPSTREAM_PROFILE="mistral"`)
	}
	return b.String()
}

func envOr(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}
