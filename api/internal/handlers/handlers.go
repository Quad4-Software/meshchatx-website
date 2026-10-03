// Package handlers wires the HTTP routes on top of the upstream fetchers and
// the TTL cache.
package handlers

import (
	"embed"
	"encoding/json"
	"net/http"
	"sort"
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

// respond serves the cached JSON bytes with ETag / cache headers.
func (s *Server) respond(c echo.Context, key string, ttl time.Duration, fetch func() ([]byte, error)) error {
	data, etag, fetchedAt, err := s.c.GetOrFetch(key, ttl, fetch)
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
	return c.Blob(http.StatusOK, "application/json; charset=utf-8", data)
}

func (s *Server) releases(c echo.Context) error {
	key := "releases"
	return s.respond(c, key, s.cfg.TTLReleases, func() ([]byte, error) {
		rels, err := s.up.Releases(c.Request().Context(), s.cfg.GitHubRepo, s.cfg.cdn())
		if err != nil {
			return nil, err
		}
		ch := c.Param("channel")
		if ch != "" {
			var filtered []upstream.Release
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
	return s.respond(c, "interfaces", s.cfg.TTLInterfaces, func() ([]byte, error) {
		payload, err := s.up.Interfaces(c.Request().Context(), s.cfg.DirectoryURL)
		if err != nil {
			return nil, err
		}
		return json.Marshal(payload)
	})
}

func (s *Server) changelog(c echo.Context) error {
	return s.respond(c, "changelog", s.cfg.TTLChangelog, func() ([]byte, error) {
		entries, err := s.up.Changelog(c.Request().Context(), s.cfg.ChangelogURL)
		if err != nil {
			return nil, err
		}
		return json.Marshal(map[string]any{"entries": entries})
	})
}

func (s *Server) roadmap(c echo.Context) error {
	return s.respond(c, "roadmap", s.cfg.TTLRoadmap, func() ([]byte, error) {
		var items []upstream.RoadmapItem
		if s.cfg.RoadmapURL != "" {
			live, err := s.up.Roadmap(c.Request().Context(), s.cfg.RoadmapURL)
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
		rels, err := s.up.Releases(c.Request().Context(), s.cfg.GitHubRepo, upstream.CDN{})
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
