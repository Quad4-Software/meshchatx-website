// Package cache provides a small in-memory TTL cache with singleflight
// de-duplication so concurrent misses hit the upstream once.
package cache

import (
	"sync"
	"time"

	"golang.org/x/sync/singleflight"
)

type entry struct {
	data      []byte
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

// GetOrFetch returns the cached payload when fresh, otherwise calls fn once
// (per key) and stores the result for ttl.
func (c *Cache) GetOrFetch(key string, ttl time.Duration, fn func() ([]byte, error)) ([]byte, string, time.Time, error) {
	c.mu.RLock()
	e, ok := c.m[key]
	c.mu.RUnlock()
	if ok && time.Now().Before(e.expiresAt) {
		return e.data, e.etag, e.fetchedAt, nil
	}

	v, err, _ := c.sfg.Do(key, func() (any, error) {
		// stale-if-error: serve the old entry when the upstream fails
		data, ferr := fn()
		if ferr != nil {
			c.mu.RLock()
			stale, has := c.m[key]
			c.mu.RUnlock()
			if has {
				return stale, nil
			}
			return nil, ferr
		}
		now := time.Now()
		e := &entry{
			data:      data,
			etag:      etagOf(data),
			fetchedAt: now,
			expiresAt: now.Add(ttl),
		}
		c.mu.Lock()
		c.m[key] = e
		c.mu.Unlock()
		return e, nil
	})
	if err != nil {
		return nil, "", time.Time{}, err
	}
	got := v.(*entry)
	return got.data, got.etag, got.fetchedAt, nil
}

// Invalidate drops a key so the next request refetches.
func (c *Cache) Invalidate(key string) {
	c.mu.Lock()
	delete(c.m, key)
	c.mu.Unlock()
}
