// Package normalizer produces deterministic JSON request bodies so PAYG
// coding agents get stable-prefix KV-cache hits.
//
// Pipeline order is frozen (architecture.md § internal/normalizer):
//
//	A parse → B sort tools → C move volatile to tail → D regex strip
//	(fallback only) → E sort media runs → F cache_control policy →
//	G protect zones (enforced inside C/E/F) → H canonical marshal
package normalizer

import (
	"errors"

	"github.com/SaniaAnees/dECODED/internal/provider"
)

var (
	ErrEmptyBody   = errors.New("normalizer: empty body")
	ErrInvalidJSON = errors.New("normalizer: invalid json object")
)

// Normalize returns deterministic JSON for KV-cache prefix stability.
// On failure it returns (nil, err). Errors never include API keys, auth
// headers, or the request body.
func Normalize(body []byte, p provider.Provider) ([]byte, error) {
	doc, err := parseBody(body)
	if err != nil {
		return nil, err
	}

	sortTools(doc)
	moveVolatile(doc, p)
	sortMedia(doc)
	applyCachePolicy(doc, p)

	out, err := marshalCanonical(doc)
	if err != nil {
		return nil, ErrInvalidJSON
	}
	return out, nil
}
