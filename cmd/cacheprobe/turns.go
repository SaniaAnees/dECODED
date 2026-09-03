package main

import (
	"os"
	"path/filepath"
)

// Mini coding session on probe-workspace (sibling of decodedd), not on this repo.
// Frozen catalog file stays still; only the last user line changes — like a real agent loop.
var turnPrompts = []string{
	"Store.Create is a stub. Implement it so duplicate SKU returns ErrDuplicateSKU, empty SKU/name is 400-class invalid, and a successful create is visible to Get. Show the exact function body.",
	"POST /items maps every Create error to 501. Map ErrDuplicateSKU to 409, invalid input to 400, and only ErrNotImplemented to 501. Name the helper and the switch.",
	"GET /items/ uses TrimPrefix, so GET /items/tea/extra still looks up sku tea/extra. Fix routing with PathValue or a strict one-segment rule. Show the handler.",
	"List() randomizes map order. Return items sorted by SKU so tests and cache keys are deterministic. Where does the sort live?",
	"UpdateStock is a stub. Reject delta that would make stock < 0 with a new ErrInsufficientStock. Show the lock order and the error.",
	"Add PATCH /items/{sku}/stock with JSON {\"delta\": n} wired to UpdateStock. What status on missing SKU vs insufficient stock?",
	"PricePaise is int. A client sent \"price\": 25.00. Do not add a float field. Show the decoder hook or reject with a clear error.",
	"NewStore seeds tea and samosa in code. Move seed data to a seed.json loaded at startup. What happens if the file is missing?",
	"There is no cart. Design Cart in store.go: Add(sku, qty), TotalPaise(), and what happens if tea stock is 12 and the cart asks 13.",
	"Checkout must be atomic: decrement stock for every line or roll back all. Show the lock and why two mutexes would deadlock.",
	"GET /items is unpaginated. Add cursor pagination ?limit=&after=sku without OFFSET. What is the next cursor when the last page is short?",
	"writeJSON ignores Encode errors. If Encode fails after WriteHeader(200), the client sees a truncated 200. Fix it. Show the order.",
	"ListenAndServe binds 127.0.0.1:7090 forever. Add a 3s shutdown on SIGINT that rejects new requests but finishes in-flight List. Sketch main.",
	"Add Bearer auth on POST/PATCH/DELETE only. GET stays public. Where is the middleware, and what is the 401 body?",
	"SKU must be [a-z0-9-]{2,32}. Reject Tea and tea_1. Show the regex and which layer (handler vs Store) owns it.",
	"Delete is a stub. If tea is in an open cart, refuse delete. If you have no cart yet, define the rule so adding cart later does not change Create.",
	"GET /health returns {ok:true} with no store ping. Make it fail 503 if the items map is nil. One if.",
	"Clients retry POST /items. Make Create idempotent with header Idempotency-Key. Same key + same body = 200 replay; same key + different body = 409.",
	"Log every write as JSON: method, sku, status, duration_ms. Do not log Authorization. Where does the wrapper sit so GET /items is not noisy?",
	"Add GET /items/{sku}/history that you cannot backfill. Return 501 with a body that names the missing WAL. Do not fake events.",
	"Store.mu is a Mutex. List holds it while copying. Under 10k items is that enough, or do you need RWMutex? Answer with the lock in List vs Create.",
	"go.mod is Go 1.22 but HandleFunc(\"GET /items\") needs 1.22 ServeMux patterns. What breaks on 1.21, and do we bump or rewrite?",
	"Write table tests for Create: empty sku, duplicate tea, new sku vada. What do you mock, and what is the third case's Get?",
	"README says checkout is missing. Write the README section for POST /cart/checkout as if we shipped the atomic version. Status codes only.",
	"PricePaise 2500 is 25.00 INR. Add a display helper that never rounds in the store. Where does formatting live so JSON stays int?",
	"Someone wants Mongo for items. Keep Store as an interface. What three methods are the V1 contract, and what does main inject?",
	"GET /items/{sku} and GET /items share a prefix. Prove with two curl lines that tea is not shadowed by the list handler after the routing fix.",
	"Stock field is public. A handler could set Stock=-1. Unexport it and add Stock() int. What compile errors do you expect in main.go?",
	"Add a request_id to every JSON error. It must not sit in the frozen catalog prefix. Where do you attach it so prefix cache still hits?",
	"Session check: if main.go and tools did not change, cached_tokens should be >0 from turn 2. Name the usage field in one sentence.",
}

var probeRepo string

func defaultProbeRepo() string {
	if v := os.Getenv("CACHEPROBE_REPO"); v != "" {
		return v
	}
	cwd, err := os.Getwd()
	if err != nil {
		return filepath.Join("..", "probe-workspace")
	}
	return filepath.Clean(filepath.Join(cwd, "..", "probe-workspace"))
}

func resolveProbeRepo(raw string) string {
	if raw == "" {
		raw = defaultProbeRepo()
	}
	if filepath.IsAbs(raw) {
		if _, err := os.Stat(filepath.Join(raw, "main.go")); err == nil {
			return raw
		}
	}
	for _, dir := range []string{".", "..", filepath.Join("..", ".."), filepath.Join("..", "..", "..")} {
		p := filepath.Join(dir, raw)
		if _, err := os.Stat(filepath.Join(p, "main.go")); err == nil {
			return p
		}
		p = filepath.Join(dir, "probe-workspace")
		if _, err := os.Stat(filepath.Join(p, "main.go")); err == nil {
			return p
		}
		p = filepath.Join(dir, "testdata", "probe-workspace")
		if _, err := os.Stat(filepath.Join(p, "main.go")); err == nil {
			return p
		}
	}
	return raw
}

type turnSetup struct {
	tools   []any
	system  string
	mutate  string
}

func setupForTurn(turn int, hard bool, mutateToolsAt, mutateFileAt int) turnSetup {
	if hard {
		return hardSetup(turn)
	}
	s := turnSetup{
		tools:  toolsForTurn(turn, mutateToolsAt),
		system: systemForTurn(turn, mutateFileAt),
	}
	if mutateToolsAt > 0 && turn == mutateToolsAt {
		s.mutate = "tools: added run_shell"
	}
	if mutateFileAt > 0 && turn == mutateFileAt {
		if s.mutate != "" {
			s.mutate += "; "
		}
		s.mutate += "file: system is now store.go"
	}
	return s
}

func hardSetup(turn int) turnSetup {
	s := hardState(turn)
	if turn > 1 && s.mutate != "" && hardState(turn-1).mutate == s.mutate {
		s.mutate = ""
	}
	return s
}

func hardState(turn int) turnSetup {
	switch {
	case turn <= 5:
		return turnSetup{tools: stableTools(), system: stableSystem()}
	case turn <= 10:
		return turnSetup{
			tools:  append(stableTools(), extraTool()),
			system: stableSystem(),
			mutate: "tools: +run_shell",
		}
	case turn <= 13:
		return turnSetup{
			tools:  alienTools(),
			system: stableSystem(),
			mutate: "tools: REPLACE with delete_file+list_dir",
		}
	case turn <= 16:
		return turnSetup{
			tools:  stableTools(),
			system: stableSystem(),
			mutate: "tools: RESTORE read_file+write_file",
		}
	case turn <= 20:
		return turnSetup{
			tools:  stableTools(),
			system: withClockPrefix(stableSystem()),
			mutate: "system: clock moved to PREFIX (should bust)",
		}
	case turn <= 23:
		return turnSetup{
			tools:  stableTools(),
			system: withClockPrefix(mutatedSystem()),
			mutate: "system: file swap store.go + clock still PREFIX",
		}
	case turn <= 26:
		return turnSetup{
			tools:  stableTools(),
			system: withClockSuffix(mutatedSystem()),
			mutate: "system: clock moved to SUFFIX (prefix should recover)",
		}
	default:
		return turnSetup{
			tools:  stableTools(),
			system: withClockSuffix(stableSystem()),
			mutate: "system: file back to main.go, clock still SUFFIX",
		}
	}
}

func alienTools() []any {
	return []any{
		namedTool("delete_file", "Delete a file in the workspace.", "path"),
		namedTool("list_dir", "List a directory in the workspace.", "path"),
	}
}

func namedTool(name, desc, param string) map[string]any {
	return map[string]any{
		"type": "function",
		"function": map[string]any{
			"name":        name,
			"description": desc,
			"parameters": map[string]any{
				"type": "object",
				"properties": map[string]any{
					param: map[string]any{"type": "string"},
				},
				"required": []any{param},
			},
		},
	}
}

const probeClock = "Current time: 2026-09-02T16:00:00Z\n"

func withClockPrefix(sys string) string {
	return probeClock + sys
}

func withClockSuffix(sys string) string {
	return sys + "\n" + probeClock
}

func toolsForTurn(turn, mutateAt int) []any {
	tools := stableTools()
	if mutateAt > 0 && turn >= mutateAt {
		tools = append(tools, extraTool())
	}
	return tools
}

func extraTool() map[string]any {
	return map[string]any{
		"type": "function",
		"function": map[string]any{
			"name":        "run_shell",
			"description": "Run a shell command in the workspace.",
			"parameters": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"command": map[string]any{"type": "string"},
				},
				"required": []any{"command"},
			},
		},
	}
}

func systemForTurn(turn, mutateAt int) string {
	if mutateAt > 0 && turn >= mutateAt {
		return mutatedSystem()
	}
	return stableSystem()
}

func mutatedSystem() string {
	file := readFrozen("store.go")
	return "" +
		"You are a coding agent on probe-workspace (snack shop API).\n" +
		"The harness already read store.go. That file is frozen below.\n" +
		"Propose concrete code. Do not call tools. Keep each answer under 120 words.\n\n" +
		"===== FROZEN FILE store.go =====\n" +
		file + "\n" +
		"===== END FILE =====\n" +
		repeatBlock("MUTATED_REPO_DOC ", 800)
}

func stableTools() []any {
	return []any{
		map[string]any{
			"type": "function",
			"function": map[string]any{
				"name":        "read_file",
				"description": "Read a file from the workspace.",
				"parameters": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"path": map[string]any{"type": "string"},
					},
					"required": []any{"path"},
				},
			},
		},
		map[string]any{
			"type": "function",
			"function": map[string]any{
				"name":        "write_file",
				"description": "Write a file in the workspace.",
				"parameters": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"path":    map[string]any{"type": "string"},
						"content": map[string]any{"type": "string"},
					},
					"required": []any{"path", "content"},
				},
			},
		},
	}
}

func stableSystem() string {
	file := readFrozen("main.go")
	return "" +
		"You are a coding agent on probe-workspace (snack shop API), not the dECODED repo.\n" +
		"The harness already read main.go. That file is frozen below.\n" +
		"Propose concrete code. Do not call tools. Keep each answer under 120 words.\n\n" +
		"===== FROZEN FILE main.go =====\n" +
		file + "\n" +
		"===== END FILE =====\n" +
		repeatBlock("STABLE_REPO_DOC ", 800)
}

func readFrozen(rel string) string {
	dirs := make([]string, 0, 6)
	if probeRepo != "" {
		dirs = append(dirs, probeRepo)
	}
	dirs = append(dirs, ".", "..", filepath.Join("..", ".."),
		filepath.Join("testdata", "probe-workspace"),
		filepath.Join("..", "testdata", "probe-workspace"),
		filepath.Join("..", "..", "testdata", "probe-workspace"),
		filepath.Join("..", "probe-workspace"),
		filepath.Join("..", "..", "probe-workspace"),
	)
	for _, dir := range dirs {
		b, err := os.ReadFile(filepath.Join(dir, rel))
		if err == nil {
			return string(b)
		}
	}
	return "// missing " + rel
}

func repeatBlock(s string, n int) string {
	b := make([]byte, 0, len(s)*n)
	for i := 0; i < n; i++ {
		b = append(b, s...)
	}
	return string(b)
}
