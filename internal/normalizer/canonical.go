package normalizer

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
)

func marshalCanonical(v any) ([]byte, error) {
	var buf bytes.Buffer
	if err := writeCanonical(&buf, v); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func hashCanonical(v any) string {
	b, err := marshalCanonical(v)
	if err != nil {
		sum := sha256.Sum256([]byte(fmt.Sprintf("%T", v)))
		return hex.EncodeToString(sum[:])
	}
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:])
}

func writeCanonical(buf *bytes.Buffer, v any) error {
	switch t := v.(type) {
	case nil:
		buf.WriteString("null")
		return nil
	case bool:
		if t {
			buf.WriteString("true")
		} else {
			buf.WriteString("false")
		}
		return nil
	case json.Number:
		s := string(t)
		if s == "" {
			buf.WriteString("0")
			return nil
		}
		buf.WriteString(s)
		return nil
	case string:
		return writeJSONString(buf, t)
	case map[string]any:
		keys := make([]string, 0, len(t))
		for k := range t {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		buf.WriteByte('{')
		for i, k := range keys {
			if i > 0 {
				buf.WriteByte(',')
			}
			if err := writeJSONString(buf, k); err != nil {
				return err
			}
			buf.WriteByte(':')
			if err := writeCanonical(buf, t[k]); err != nil {
				return err
			}
		}
		buf.WriteByte('}')
		return nil
	case []any:
		buf.WriteByte('[')
		for i, item := range t {
			if i > 0 {
				buf.WriteByte(',')
			}
			if err := writeCanonical(buf, item); err != nil {
				return err
			}
		}
		buf.WriteByte(']')
		return nil
	case float64:
		buf.WriteString(strconv.FormatFloat(t, 'f', -1, 64))
		return nil
	case int:
		buf.WriteString(strconv.Itoa(t))
		return nil
	case int64:
		buf.WriteString(strconv.FormatInt(t, 10))
		return nil
	case uint64:
		buf.WriteString(strconv.FormatUint(t, 10))
		return nil
	default:
		enc := json.NewEncoder(buf)
		enc.SetEscapeHTML(false)
		if err := enc.Encode(t); err != nil {
			return err
		}
		if buf.Len() > 0 && buf.Bytes()[buf.Len()-1] == '\n' {
			buf.Truncate(buf.Len() - 1)
		}
		return nil
	}
}

func writeJSONString(buf *bytes.Buffer, s string) error {
	enc := json.NewEncoder(buf)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(s); err != nil {
		return err
	}
	if buf.Len() > 0 && buf.Bytes()[buf.Len()-1] == '\n' {
		buf.Truncate(buf.Len() - 1)
	}
	return nil
}
