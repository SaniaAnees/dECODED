package normalizer

import (
	"bytes"
	"flag"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

var updateGoldens = flag.Bool("update", false, "update testdata/normalize golden files")

func goldenDir(t *testing.T) string {
	t.Helper()
	dir := filepath.Join("..", "..", "testdata", "normalize")
	if _, err := os.Stat(dir); err != nil {
		t.Fatalf("golden dir %s: %v", dir, err)
	}
	return dir
}

func pathForGolden(name string) string {
	switch {
	case strings.HasPrefix(name, "openai_"):
		return "/v1/chat/completions"
	case strings.HasPrefix(name, "responses_"):
		return "/v1/responses"
	default:
		return "/v1/messages"
	}
}

func TestGoldens(t *testing.T) {
	dir := goldenDir(t)
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatal(err)
	}
	n := 0
	for _, e := range entries {
		name := e.Name()
		if e.IsDir() || !strings.HasSuffix(name, ".json") || strings.HasSuffix(name, ".normalized.json") {
			continue
		}
		n++
		t.Run(name, func(t *testing.T) {
			inPath := filepath.Join(dir, name)
			body, err := os.ReadFile(inPath)
			if err != nil {
				t.Fatal(err)
			}
			p := detectFor(t, pathForGolden(name), body)
			out := assertIdempotent(t, body, p)

			wantPath := strings.TrimSuffix(inPath, ".json") + ".normalized.json"
			if *updateGoldens {
				if err := os.WriteFile(wantPath, append(out, '\n'), 0o644); err != nil {
					t.Fatal(err)
				}
				return
			}
			want, err := os.ReadFile(wantPath)
			if err != nil {
				t.Fatalf("read golden %s (run go test -update): %v", wantPath, err)
			}
			want = bytes.TrimSuffix(want, []byte("\n"))
			if !bytes.Equal(out, want) {
				t.Fatalf("golden mismatch\n got: %s\nwant: %s", out, want)
			}
		})
	}
	if n == 0 {
		t.Fatal("no golden inputs in testdata/normalize")
	}
}
