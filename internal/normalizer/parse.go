package normalizer

import (
	"bytes"
	"encoding/json"
	"io"
)

func parseBody(body []byte) (map[string]any, error) {
	trimmed := bytes.TrimSpace(body)
	if len(trimmed) == 0 {
		return nil, ErrEmptyBody
	}

	dec := json.NewDecoder(bytes.NewReader(trimmed))
	dec.UseNumber()

	var v any
	if err := dec.Decode(&v); err != nil {
		return nil, ErrInvalidJSON
	}
	obj, ok := v.(map[string]any)
	if !ok || obj == nil {
		return nil, ErrInvalidJSON
	}
	if _, err := dec.Token(); err != io.EOF {
		return nil, ErrInvalidJSON
	}
	return obj, nil
}
