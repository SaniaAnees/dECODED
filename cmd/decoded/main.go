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
	base := fmt.Sprintf("http://%s", addr)
	var b strings.Builder
	fmt.Fprintf(&b, "decoded PAYG proxy  %s\n", base)
	fmt.Fprintf(&b, "  health  %s/health\n", base)
	fmt.Fprintf(&b, "  stats   %s/stats\n", base)
	fmt.Fprintln(&b)
	if goos == "windows" {
		fmt.Fprintln(&b, "Agent shell (second terminal):")
		fmt.Fprintf(&b, "  $env:ANTHROPIC_BASE_URL=\"%s/v1\"\n", base)
		fmt.Fprintf(&b, "  $env:OPENAI_BASE_URL=\"%s/v1\"\n", base)
	} else {
		fmt.Fprintln(&b, "Agent shell (second terminal):")
		fmt.Fprintf(&b, "  export ANTHROPIC_BASE_URL=\"%s/v1\"\n", base)
		fmt.Fprintf(&b, "  export OPENAI_BASE_URL=\"%s/v1\"\n", base)
	}
	return b.String()
}
