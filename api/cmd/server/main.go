// MeshChatX site API - thin cached proxy over GitHub releases, the RNS
// interface directory, and the repo changelog. Keeps the static Astro site
// from needing a rebuild for fresh data.
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/quad4-software/meshchatx-site-api/internal/handlers"
)

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func envDur(key string, def time.Duration) time.Duration {
	if v := os.Getenv(key); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
	}
	return def
}

func envBool(key string, def bool) bool {
	switch os.Getenv(key) {
	case "1", "true", "yes":
		return true
	case "0", "false", "no":
		return false
	}
	return def
}

func main() {
	cfg := handlers.Config{
		GitHubRepo:       env("GITHUB_REPO", "Quad4-Software/MeshChatX"),
		CdnBase:          env("CDN_BASE", "https://cdn.quad4.io"),
		DirectoryURL:     env("DIRECTORY_URL", "https://directory.rns.recipes/api/directory/submitted?search=&type=&status=online"),
		ChangelogURL:     env("CHANGELOG_URL", "https://raw.githubusercontent.com/Quad4-Software/MeshChatX/master/CHANGELOG.md"),
		RoadmapURL:       env("ROADMAP_URL", ""),
		PreferCDN:        envBool("PREFER_CDN", true),
		BunnyStorageZone: env("BUNNY_STORAGE_ZONE", "quad4"),
		BunnyStorageKey:  env("BUNNY_STORAGE_ACCESS_KEY", ""),
		BunnyStorageURL:  env("BUNNY_STORAGE_ENDPOINT", "https://ny.storage.bunnycdn.com"),
		TTLReleases:      envDur("TTL_RELEASES", 15*time.Minute),
		TTLInterfaces:    envDur("TTL_INTERFACES", 12*time.Hour),
		TTLChangelog:     envDur("TTL_CHANGELOG", 15*time.Minute),
		TTLRoadmap:       envDur("TTL_ROADMAP", 15*time.Minute),
	}
	srv := handlers.New(cfg)

	e := echo.New()
	e.HideBanner = true
	e.HidePort = true
	e.Use(middleware.Recover())
	// Gzip happens in the handler: cached payloads store precompressed bytes.
	e.Use(middleware.Secure())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{
			"https://meshchatx.com",
			"https://*.meshchatx.com",
			"http://localhost:*",
			"http://127.0.0.1:*",
			"http://[::1]:*",
		},
		AllowMethods: []string{http.MethodGet, http.MethodHead},
		AllowHeaders: []string{echo.HeaderAccept, "If-None-Match"},
		MaxAge:       600,
	}))
	// modest rate limit: 30 req/s burst 60 per IP
	e.Use(middleware.RateLimiter(middleware.NewRateLimiterMemoryStoreWithConfig(
		middleware.RateLimiterMemoryStoreConfig{Rate: 30, Burst: 60, ExpiresIn: 3 * time.Minute},
	)))
	e.Use(middleware.TimeoutWithConfig(middleware.TimeoutConfig{Timeout: 25 * time.Second}))
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		Skipper:   func(c echo.Context) bool { return c.Path() == "/healthz" },
		LogStatus: true, LogURI: true, LogLatency: true, LogRemoteIP: true,
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			log.Printf("%s %s status=%d latency=%s ip=%s", c.Request().Method, v.URI, v.Status, v.Latency, v.RemoteIP)
			return nil
		},
	}))

	srv.Routes(e)

	addr := env("ADDR", ":8090")
	go func() {
		if err := e.Start(addr); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()
	log.Printf("site api listening on %s", addr)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := e.Shutdown(ctx); err != nil {
		log.Fatalf("shutdown: %v", err)
	}
}
