package cache

import (
	"crypto/sha256"
	"encoding/base64"
)

func etagOf(b []byte) string {
	sum := sha256.Sum256(b)
	return `"` + base64.RawURLEncoding.EncodeToString(sum[:12]) + `"`
}
