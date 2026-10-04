// Package cache provides a small in-memory TTL cache with singleflight
// de-duplication so concurrent misses hit the upstream once. Entries keep a
// precompressed gzip copy so the hot path never recompresses, and expired
// entries are served while a single background refresh runs.
package cache

import (
	"bytes"
	"compress/gzip"
	"sync"
	"time"

	"golang.org/x/sync/singleflight"
)

type entry struct {
	data      []byte
	gz        []byte
	etag      string
	fetchedAt time.Time
	expiresAt time.Time
}

// Cache stores marshalled JSON payloads keyed by name.
type Cache struct {
	mu  sync.RWMutex
	m   map[string]*entry
	sfg singleflight.Group
}

func New() *Cache {
	return &Cache{m: make(map[string]*entry)}
}

func gzipped(data []byte) []byte {
	var b bytes.Buffer
	w := gzip.NewWriter(&b)
	if _, err := w.Write(data); err != nil {
		return nil
	}
	if err := w.Close(); err != nil {
		return nil
	}
	return b.Bytes()
}

// GetOrFetch returns the cached payload when fresh. When the entry is stale a
// single background refresh is kicked off and the stale bytes are served right
// away; when the upstream fetch fails the stale entry is served too. Only the
// very first request for a key blocks on the fetch.
//
// Returns the raw bytes, their gzip encoding, the etag, and fetch time.
func (c *Cache) GetOrFetch(key string, ttl time.Duration, fn func() ([]byte, error)) ([]byte, []byte, string, time.Time, error) {
	c.mu.RLock()
	e, ok := c.m[key]
	c.mu.RUnlock()
	if ok && time.Now().Before(e.expiresAt) {
		return e.data, e.gz, e.etag, e.fetchedAt, nil
	}

	if ok {
		// Stale-while-revalidate: one in-flight refresh per key, stale served
		// to everyone until it lands.
		go c.sfg.Do(key, func() (any, error) {
			return c.refresh(key, ttl, fn)
		})
		return e.data, e.gz, e.etag, e.fetchedAt, nil
	}

	v, err, _ := c.sfg.Do(key, func() (any, error) {
		got, ferr := c.refresh(key, ttl, fn)
		if ferr != nil {
			c.mu.RLock()
			stale, has := c.m[key]
			c.mu.RUnlock()
			if has {
				return stale, nil
			}
			return nil, ferr
		}
		return got, nil
	})
	if err != nil {
		return nil, nil, "", time.Time{}, err
	}
	got := v.(*entry)
	return got.data, got.gz, got.etag, got.fetchedAt, nil
}

// refresh runs fn and stores the result. On error the previous entry is kept.
func (c *Cache) refresh(key string, ttl time.Duration, fn func() ([]byte, error)) (*entry, error) {
	data, err := fn()
	if err != nil {
		return nil, err
	}
	now := time.Now()
	e := &entry{
		data:      data,
		gz:        gzipped(data),
		etag:      etagOf(data),
		fetchedAt: now,
		expiresAt: now.Add(ttl),
	}
	c.mu.Lock()
	c.m[key] = e
	c.mu.Unlock()
	return e, nil
}

// Invalidate drops a key so the next request refetches.
func (c *Cache) Invalidate(key string) {
	c.mu.Lock()
	delete(c.m, key)
	c.mu.Unlock()
}
