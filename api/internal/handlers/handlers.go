// Package handlers wires the HTTP routes on top of the upstream fetchers and
// the TTL cache.
package handlers

import (
	"context"
	"embed"
	"encoding/json"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/quad4-software/meshchatx-site-api/internal/cache"
	"github.com/quad4-software/meshchatx-site-api/internal/upstream"
)

//go:embed roadmap.json
var roadmapFS embed.FS

type Config struct {
	GitHubRepo       string
	CdnBase          string
	DirectoryURL     string
	ChangelogURL     string
	RoadmapURL       string
	PreferCDN        bool
	BunnyStorageZone string
	BunnyStorageKey  string
	BunnyStorageURL  string
	TTLReleases      time.Duration
	TTLInterfaces    time.Duration
	TTLChangelog     time.Duration
	TTLRoadmap       time.Duration
}

func (cfg Config) cdn() upstream.CDN {
	return upstream.CDN{
		Base:            cfg.CdnBase,
		Prefer:          cfg.PreferCDN,
		StorageZone:     cfg.BunnyStorageZone,
		StorageKey:      cfg.BunnyStorageKey,
		StorageEndpoint: cfg.BunnyStorageURL,
	}
}

type Server struct {
	cfg Config
	up  *upstream.Client
	c   *cache.Cache
}

func New(cfg Config) *Server {
	return &Server{cfg: cfg, up: upstream.New(), c: cache.New()}
}

// Routes registers all endpoints on e.
func (s *Server) Routes(e *echo.Echo) {
	e.GET("/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})
	api := e.Group("/api")
	api.GET("/releases", s.releases)
	api.GET("/releases/:channel", s.releases)
	api.GET("/interfaces", s.interfaces)
	api.GET("/changelog", s.changelog)
	api.GET("/roadmap", s.roadmap)
}

// respond serves the cached JSON bytes with ETag / cache headers. The cached
// payload ships with a precompressed gzip copy, so the hot path never
// recompresses per request.
func (s *Server) respond(c echo.Context, key string, ttl time.Duration, fetch func(ctx context.Context) ([]byte, error)) error {
	// Fetches may run in a background stale-while-revalidate refresh, so they
	// must not die with the request that happened to trigger them.
	ctx := context.WithoutCancel(c.Request().Context())
	data, gz, etag, fetchedAt, err := s.c.GetOrFetch(key, ttl, func() ([]byte, error) {
		return fetch(ctx)
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "upstream fetch failed").SetInternal(err)
	}
	if inm := c.Request().Header.Get("If-None-Match"); inm != "" && inm == etag {
		return c.NoContent(http.StatusNotModified)
	}
	h := c.Response().Header()
	h.Set("ETag", etag)
	h.Set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
	h.Set("Last-Modified", fetchedAt.UTC().Format(http.TimeFormat))
	h.Add("Vary", "Accept-Encoding")
	if acceptsGzip(c.Request()) && gz != nil {
		h.Set("Content-Encoding", "gzip")
		return c.Blob(http.StatusOK, "application/json; charset=utf-8", gz)
	}
	return c.Blob(http.StatusOK, "application/json; charset=utf-8", data)
}

// acceptsGzip reports whether the request allows a gzip response body.
func acceptsGzip(r *http.Request) bool {
	for _, part := range strings.Split(r.Header.Get("Accept-Encoding"), ",") {
		enc := strings.ToLower(strings.TrimSpace(strings.SplitN(part, ";", 2)[0]))
		if enc == "gzip" || enc == "*" {
			return true
		}
	}
	return false
}

// releaseList returns the upstream release list through a shared cache key so
// all releases routes hit GitHub at most once per TTL.
func (s *Server) releaseList(ctx context.Context) ([]upstream.Release, error) {
	raw, _, _, _, err := s.c.GetOrFetch("releases:upstream", s.cfg.TTLReleases, func() ([]byte, error) {
		rels, err := s.up.Releases(ctx, s.cfg.GitHubRepo, s.cfg.cdn())
		if err != nil {
			return nil, err
		}
		return json.Marshal(rels)
	})
	if err != nil {
		return nil, err
	}
	var rels []upstream.Release
	if err := json.Unmarshal(raw, &rels); err != nil {
		return nil, err
	}
	return rels, nil
}

func (s *Server) releases(c echo.Context) error {
	ch := c.Param("channel")
	key := "releases"
	if ch != "" {
		key = "releases:" + ch
	}
	return s.respond(c, key, s.cfg.TTLReleases, func(ctx context.Context) ([]byte, error) {
		rels, err := s.releaseList(ctx)
		if err != nil {
			return nil, err
		}
		if ch != "" {
			filtered := []upstream.Release{}
			for _, r := range rels {
				if r.Channel == ch {
					filtered = append(filtered, r)
				}
			}
			return json.Marshal(map[string]any{"channel": ch, "releases": filtered})
		}
		byChannel := map[string][]upstream.Release{"stable": {}, "beta": {}, "testing": {}}
		for _, r := range rels {
			byChannel[r.Channel] = append(byChannel[r.Channel], r)
		}
		return json.Marshal(map[string]any{
			"channels": byChannel,
			"stable":   firstOrNil(byChannel["stable"]),
			"beta":     firstOrNil(byChannel["beta"]),
			"testing":  firstOrNil(byChannel["testing"]),
			"count":    len(rels),
		})
	})
}

func firstOrNil(rs []upstream.Release) any {
	if len(rs) == 0 {
		return nil
	}
	return rs[0]
}

func (s *Server) interfaces(c echo.Context) error {
	return s.respond(c, "interfaces", s.cfg.TTLInterfaces, func(ctx context.Context) ([]byte, error) {
		payload, err := s.up.Interfaces(ctx, s.cfg.DirectoryURL)
		if err != nil {
			return nil, err
		}
		return json.Marshal(payload)
	})
}

func (s *Server) changelog(c echo.Context) error {
	return s.respond(c, "changelog", s.cfg.TTLChangelog, func(ctx context.Context) ([]byte, error) {
		entries, err := s.up.Changelog(ctx, s.cfg.ChangelogURL)
		if err != nil {
			return nil, err
		}
		return json.Marshal(map[string]any{"entries": entries})
	})
}

func (s *Server) roadmap(c echo.Context) error {
	return s.respond(c, "roadmap", s.cfg.TTLRoadmap, func(ctx context.Context) ([]byte, error) {
		var items []upstream.RoadmapItem
		if s.cfg.RoadmapURL != "" {
			live, err := s.up.Roadmap(ctx, s.cfg.RoadmapURL)
			if err == nil {
				items = live
			}
		}
		if items == nil {
			raw, err := roadmapFS.ReadFile("roadmap.json")
			if err != nil {
				return nil, err
			}
			if err := json.Unmarshal(raw, &items); err != nil {
				return nil, err
			}
		}
		rels, err := s.releaseList(ctx)
		if err != nil {
			return nil, err
		}
		published := upstream.PublishedVersions(rels)
		sort.Strings(published)
		resolved := upstream.ResolveRoadmap(items, published)
		return json.Marshal(map[string]any{
			"items":     resolved,
			"published": published,
		})
	})
}
