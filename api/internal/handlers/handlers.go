// Package handlers wires the HTTP routes on top of the upstream fetchers and
// the TTL cache.
package handlers

import (
	"context"
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"sync"
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
	PublicBase       string
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

	tMu     sync.Mutex
	tBuilt  map[string]*upstream.TorrentResult
	tMagnet map[string]string
	tBusy   map[string]bool
	tFail   map[string]time.Time
	mBusy   map[string]bool
	mFail   map[string]time.Time
	tBuild  sync.Mutex
}

func New(cfg Config) *Server {
	return &Server{
		cfg:     cfg,
		up:      upstream.New(),
		c:       cache.New(),
		tBuilt:  map[string]*upstream.TorrentResult{},
		tMagnet: map[string]string{},
		tBusy:   map[string]bool{},
		tFail:   map[string]time.Time{},
		mBusy:   map[string]bool{},
		mFail:   map[string]time.Time{},
	}
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
	api.GET("/torrents/:tag", s.torrentFile)
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
	s.attachTorrents(rels)
	s.maybeTorrentWork(rels)
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

// attachTorrents points downloads.torrent at the generated .torrent for
// releases that carry none, once the build has finished. Releases that ship
// a real .torrent asset get their derived magnet attached instead.
func (s *Server) attachTorrents(rels []upstream.Release) {
	s.tMu.Lock()
	defer s.tMu.Unlock()
	for i := range rels {
		r := &rels[i]
		if t := r.Downloads.Torrent; t != nil {
			if t.Magnet == "" {
				t.Magnet = s.tMagnet[r.Tag]
			}
			continue
		}
		g, ok := s.tBuilt[r.Tag]
		if !ok {
			continue
		}
		u := s.cfg.PublicBase + "/api/torrents/" + url.PathEscape(r.Tag)
		sum := sha256.Sum256(g.Data)
		r.Downloads.Torrent = &upstream.Asset{
			Name:      g.FileName,
			URL:       u,
			GitHubURL: u,
			SHA256:    hex.EncodeToString(sum[:]),
			Size:      int64(len(g.Data)),
			Magnet:    g.Magnet,
		}
	}
}

// maybeTorrentWork queues background work around releases: a magnet derived
// from every upstream .torrent asset that lacks one, and a full torrent build
// for the newest release of a channel with no .torrent asset at all. Older
// releases are not backfilled: each build burns GBs of bandwidth.
func (s *Server) maybeTorrentWork(rels []upstream.Release) {
	seen := map[string]bool{}
	for i := range rels {
		r := &rels[i]
		if t := r.Downloads.Torrent; t != nil && t.Magnet == "" {
			s.queueMagnetFetch(r)
		}
		if seen[r.Channel] {
			continue
		}
		seen[r.Channel] = true
		if r.Downloads.Torrent == nil && len(r.TorrentFiles()) > 0 {
			s.queueTorrentBuild(r)
		}
	}
}

func (s *Server) invalidateReleaseKeys() {
	for _, key := range []string{"releases", "releases:stable", "releases:beta", "releases:testing"} {
		s.c.Invalidate(key)
	}
}

func (s *Server) queueMagnetFetch(r *upstream.Release) {
	t := r.Downloads.Torrent
	if t == nil {
		return
	}
	u := t.CdnURL
	if u == "" {
		u = t.URL
	}
	if u == "" {
		return
	}
	s.tMu.Lock()
	if s.mBusy[r.Tag] || s.tMagnet[r.Tag] != "" {
		s.tMu.Unlock()
		return
	}
	if failedAt, ok := s.mFail[r.Tag]; ok && time.Since(failedAt) < time.Hour {
		s.tMu.Unlock()
		return
	}
	s.mBusy[r.Tag] = true
	s.tMu.Unlock()

	go func(tag, torrentURL, dn string) {
		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()
		mag, err := s.up.FetchTorrentMagnet(ctx, torrentURL, dn)
		s.tMu.Lock()
		delete(s.mBusy, tag)
		if err != nil {
			s.mFail[tag] = time.Now()
			s.tMu.Unlock()
			log.Printf("magnet derive %s failed: %v", tag, err)
			return
		}
		s.tMagnet[tag] = mag
		s.tMu.Unlock()
		s.invalidateReleaseKeys()
	}(r.Tag, u, "MeshChatX-"+r.Tag)
}

func (s *Server) queueTorrentBuild(r *upstream.Release) {
	s.tMu.Lock()
	if s.tBusy[r.Tag] || s.tBuilt[r.Tag] != nil {
		s.tMu.Unlock()
		return
	}
	if failedAt, ok := s.tFail[r.Tag]; ok && time.Since(failedAt) < time.Hour {
		s.tMu.Unlock()
		return
	}
	s.tBusy[r.Tag] = true
	s.tMu.Unlock()

	go func(tag string, seeds []string) {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()
		// Serialize builds: one multi-GB pull at a time.
		s.tBuild.Lock()
		defer s.tBuild.Unlock()
		res, err := s.up.BuildTorrent(ctx, r, seeds)
		s.tMu.Lock()
		delete(s.tBusy, tag)
		if err != nil {
			s.tFail[tag] = time.Now()
			s.tMu.Unlock()
			log.Printf("torrent build %s failed: %v", tag, err)
			return
		}
		s.tBuilt[tag] = res
		s.tMu.Unlock()
		// Drop the cached responses so the next request re-marshals with the
		// generated torrent attached.
		s.invalidateReleaseKeys()
		log.Printf("torrent build %s done: %s", tag, res.InfoHash)
	}(r.Tag, s.torrentSeeds(r.Channel))
}

func (s *Server) torrentSeeds(channel string) []string {
	return []string{
		strings.TrimRight(s.cfg.CdnBase, "/") + "/" + upstream.TrackForChannel(channel) + "/",
		"https://github.com/" + s.cfg.GitHubRepo + "/releases/download/",
	}
}

func (s *Server) torrentFile(c echo.Context) error {
	tag := c.Param("tag")
	s.tMu.Lock()
	g := s.tBuilt[tag]
	busy := s.tBusy[tag]
	s.tMu.Unlock()
	if g != nil {
		h := c.Response().Header()
		h.Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", g.FileName))
		h.Set("Cache-Control", "public, max-age=86400, immutable")
		return c.Blob(http.StatusOK, "application/x-bittorrent", g.Data)
	}
	if busy {
		c.Response().Header().Set("Retry-After", "30")
		return c.NoContent(http.StatusAccepted)
	}
	rels, err := s.releaseList(context.WithoutCancel(c.Request().Context()))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "upstream fetch failed").SetInternal(err)
	}
	for i := range rels {
		r := &rels[i]
		if r.Tag != tag {
			continue
		}
		if r.Downloads.Torrent != nil {
			return c.Redirect(http.StatusFound, r.Downloads.Torrent.URL)
		}
		if len(r.TorrentFiles()) == 0 {
			break
		}
		s.queueTorrentBuild(r)
		c.Response().Header().Set("Retry-After", "30")
		return c.NoContent(http.StatusAccepted)
	}
	return echo.NewHTTPError(http.StatusNotFound, "no torrent for "+tag)
}
