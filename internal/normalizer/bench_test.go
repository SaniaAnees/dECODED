package normalizer

import (
	"testing"

	"github.com/SaniaAnees/dECODED/internal/provider"
)

func detectBench(path string, body []byte) (provider.Provider, error) {
	return provider.Detect("http://localhost:8080"+path, body, nil)
}

func BenchmarkNormalizeAnthropic(b *testing.B) {
	body := []byte(`{
		"model":"claude-sonnet-4-5","max_tokens":8192,
		"system":"You are a coding agent.\nCurrent time: 2026-08-27T10:00:00.000Z\nsession_id=sess-bench\nFollow the repo.",
		"tools":[
			{"name":"read_file","description":"Read","input_schema":{"type":"object","properties":{"path":{"type":"string"}}}},
			{"name":"write_file","description":"Write","input_schema":{"type":"object","properties":{"path":{"type":"string"}}}},
			{"name":"grep","description":"Search","input_schema":{"type":"object","properties":{"q":{"type":"string"}}}},
			{"name":"bash","description":"Shell","input_schema":{"type":"object","properties":{"cmd":{"type":"string"}}}}
		],
		"messages":[
			{"role":"user","content":"read main.go"},
			{"role":"assistant","content":[{"type":"tool_use","id":"1","name":"read_file","input":{"path":"main.go"}}]},
			{"role":"user","content":[{"type":"tool_result","tool_use_id":"1","content":"package main"},{"type":"text","text":"now fix it"}]}
		]
	}`)
	p, err := detectBench("/v1/messages", body)
	if err != nil {
		b.Fatal(err)
	}
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, err := Normalize(body, p); err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkNormalizeOpenAI(b *testing.B) {
	body := []byte(`{
		"model":"gpt-4o",
		"messages":[
			{"role":"system","content":"You are a coding agent. Current time: 2026-08-27T10:00:00Z"},
			{"role":"user","content":"read main.go"},
			{"role":"assistant","content":null,"tool_calls":[{"id":"c1","type":"function","function":{"name":"read_file","arguments":"{}"}}]},
			{"role":"tool","tool_call_id":"c1","content":"ok"},
			{"role":"user","content":"thanks"}
		],
		"tools":[
			{"type":"function","function":{"name":"write_file","parameters":{"type":"object"}}},
			{"type":"function","function":{"name":"read_file","parameters":{"type":"object"}}}
		]
	}`)
	p, err := detectBench("/v1/chat/completions", body)
	if err != nil {
		b.Fatal(err)
	}
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, err := Normalize(body, p); err != nil {
			b.Fatal(err)
		}
	}
}
