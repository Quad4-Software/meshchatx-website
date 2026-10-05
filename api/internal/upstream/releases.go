package upstream

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"sync"
)

type Asset struct {
	Name      string `json:"name"`
	URL       string `json:"url"`
	GitHubURL string `json:"githubUrl,omitempty"`
	CdnURL    string `json:"cdnUrl,omitempty"`
	SHA256    string `json:"sha256,omitempty"`
	Size      int64  `json:"size,omitempty"`
	Magnet    string `json:"magnet,omitempty"`
}

type Downloads struct {
	AppImageAmd64 *Asset `json:"appImageAmd64"`
	AppImageArm64 *Asset `json:"appImageArm64"`
	DebAmd64      *Asset `json:"debAmd64"`
	DebArm64      *Asset `json:"debArm64"`
	RpmAmd64      *Asset `json:"rpmAmd64"`
	Wheel         *Asset `json:"wheel"`
	WinInstaller  *Asset `json:"winInstaller"`
	WinPortable   *Asset `json:"winPortable"`
	MacDmg        *Asset `json:"macDmg"`
	MacDmgX64     *Asset `json:"macDmgX64"`
	PyzPy311X64   *Asset `json:"pyzPy311X64"`
	PyzPy311Arm64 *Asset `json:"pyzPy311Arm64"`
	PyzPy314X64   *Asset `json:"pyzPy314X64"`
	PyzPy314Arm64 *Asset `json:"pyzPy314Arm64"`
	Apk           *Asset `json:"apk"`
	AlpineApk     *Asset `json:"alpineApk"`
	Flatpak       *Asset `json:"flatpak"`
	Sbom          *Asset `json:"sbom"`
	Torrent       *Asset `json:"torrent,omitempty"`
}

type Release struct {
	Tag             string    `json:"tag"`
	Version         string    `json:"version"`
	Name            string    `json:"name"`
	Body            string    `json:"body"`
	PublishedAt     string    `json:"publishedAt"`
	Prerelease      bool      `json:"prerelease"`
	Channel         string    `json:"channel"`
	ReleaseURL      string    `json:"releaseUrl"`
	Downloads       Downloads `json:"downloads"`
	DownloadServer  string    `json:"downloadServer,omitempty"`
	DownloadServers []string  `json:"downloadServers,omitempty"`
}

type ghAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	Digest             string `json:"digest"`
	Size               int64  `json:"size"`
}

type ghRelease struct {
	TagName    string    `json:"tag_name"`
	Name       string    `json:"name"`
	Body       string    `json:"body"`
	Published  string    `json:"published_at"`
	Prerelease bool      `json:"prerelease"`
	Draft      bool      `json:"draft"`
	HTMLURL    string    `json:"html_url"`
	Assets     []ghAsset `json:"assets"`
}

var (
	reTesting = regexp.MustCompile(`(?i)^(nightly|testing)(-|$)`)
	reBeta    = regexp.MustCompile(`(?i)^(beta|preview)(-|$)`)
	rePreTag  = regexp.MustCompile(`(?i)(alpha|beta|rc|dev|pre)`)
	reArm     = regexp.MustCompile(`(?i)(arm64|aarch64)`)
	reX64     = regexp.MustCompile(`(?i)(amd64|x86_64|x64)`)
)

func channelForTag(tag string, ghPrerelease bool) string {
	t := strings.TrimSpace(tag)
	if reTesting.MatchString(t) {
		return "testing"
	}
	if reBeta.MatchString(t) {
		return "beta"
	}
	display := strings.TrimPrefix(strings.TrimPrefix(t, "v"), "V")
	if rePreTag.MatchString(display) || ghPrerelease {
		return "testing"
	}
	return "stable"
}

func versionDisplay(tag string) string {
	return strings.TrimPrefix(strings.TrimPrefix(tag, "v"), "V")
}

func shaOf(a ghAsset) string {
	return strings.TrimPrefix(a.Digest, "sha256:")
}

func pick(assets []ghAsset, pred func(string) bool) *Asset {
	for _, a := range assets {
		n := strings.ToLower(a.Name)
		if pred(n) {
			return &Asset{Name: a.Name, URL: a.BrowserDownloadURL, GitHubURL: a.BrowserDownloadURL, SHA256: shaOf(a), Size: a.Size}
		}
	}
	return nil
}

func matchDownloads(assets []ghAsset) Downloads {
	notMacWin := func(n string) bool {
		return strings.HasSuffix(n, ".appimage") &&
			!(strings.Contains(n, "darwin") || strings.Contains(n, "macos") ||
				regexp.MustCompile(`\bmac\b|\bwin\b|windows`).MatchString(n))
	}
	return Downloads{
		AppImageAmd64: firstNonNil(
			pick(assets, func(n string) bool {
				return strings.HasSuffix(n, ".appimage") && strings.Contains(n, "linux") && reX64.MatchString(n) && !reArm.MatchString(n)
			}),
			pick(assets, func(n string) bool {
				return strings.HasSuffix(n, ".appimage") && strings.Contains(n, "linux") && !reX64.MatchString(n) && !reArm.MatchString(n)
			}),
			pick(assets, func(n string) bool { return notMacWin(n) && reX64.MatchString(n) && !reArm.MatchString(n) }),
		),
		AppImageArm64: firstNonNil(
			pick(assets, func(n string) bool {
				return strings.HasSuffix(n, ".appimage") && strings.Contains(n, "linux") && reArm.MatchString(n)
			}),
			pick(assets, func(n string) bool { return notMacWin(n) && reArm.MatchString(n) }),
		),
		DebAmd64: pick(assets, func(n string) bool {
			return strings.HasSuffix(n, ".deb") && reX64.MatchString(n) && !reArm.MatchString(n)
		}),
		DebArm64: pick(assets, func(n string) bool { return strings.HasSuffix(n, ".deb") && reArm.MatchString(n) }),
		RpmAmd64: pick(assets, func(n string) bool { return strings.HasSuffix(n, ".rpm") && reX64.MatchString(n) }),
		Wheel: firstNonNil(
			pick(assets, func(n string) bool { return strings.HasSuffix(n, "-py3-none-any.whl") }),
			pick(assets, func(n string) bool { return strings.HasSuffix(n, ".whl") }),
		),
		WinInstaller: pick(assets, func(n string) bool { return strings.Contains(n, "win") && strings.HasSuffix(n, "installer.exe") }),
		WinPortable:  pick(assets, func(n string) bool { return strings.Contains(n, "win") && strings.HasSuffix(n, "portable.exe") }),
		MacDmg: pick(assets, func(n string) bool {
			return strings.HasSuffix(n, ".dmg") && reArm.MatchString(n) && !strings.Contains(n, ".cosign.") && !strings.HasSuffix(n, ".sha256")
		}),
		MacDmgX64: pick(assets, func(n string) bool {
			return strings.HasSuffix(n, ".dmg") && reX64.MatchString(n) && !reArm.MatchString(n) && !strings.Contains(n, ".cosign.") && !strings.HasSuffix(n, ".sha256")
		}),
		PyzPy311X64: pick(assets, func(n string) bool {
			return strings.HasSuffix(n, ".pyz") && strings.Contains(n, "py311") && reX64.MatchString(n) && !reArm.MatchString(n)
		}),
		PyzPy311Arm64: pick(assets, func(n string) bool {
			return strings.HasSuffix(n, ".pyz") && strings.Contains(n, "py311") && reArm.MatchString(n)
		}),
		PyzPy314X64: pick(assets, func(n string) bool {
			return strings.HasSuffix(n, ".pyz") && strings.Contains(n, "py314") && reX64.MatchString(n) && !reArm.MatchString(n)
		}),
		PyzPy314Arm64: pick(assets, func(n string) bool {
			return strings.HasSuffix(n, ".pyz") && strings.Contains(n, "py314") && reArm.MatchString(n)
		}),
		Apk: pick(assets, func(n string) bool {
			return strings.HasSuffix(n, ".apk") && !strings.Contains(n, "alpine") && !strings.Contains(n, "linux")
		}),
		AlpineApk: pick(assets, func(n string) bool { return strings.HasSuffix(n, ".apk") && strings.Contains(n, "alpine") }),
		Flatpak:   pick(assets, func(n string) bool { return strings.HasSuffix(n, ".flatpak") }),
		Sbom:      pick(assets, func(n string) bool { return strings.HasSuffix(n, "sbom.cyclonedx.json") }),
		Torrent:   pick(assets, func(n string) bool { return strings.HasSuffix(n, ".torrent") }),
	}
}

func firstNonNil(a ...*Asset) *Asset {
	for _, x := range a {
		if x != nil {
			return x
		}
	}
	return nil
}

type CDN struct {
	Base            string
	Prefer          bool
	StorageZone     string
	StorageKey      string
	StorageEndpoint string
}

func (c CDN) bunny() bunnyConfig {
	return bunnyConfig{
		AccessKey: c.StorageKey,
		Zone:      c.StorageZone,
		Endpoint:  c.StorageEndpoint,
		CdnBase:   c.Base,
	}
}

// Releases fetches the GitHub release list, classifies channels, and swaps in
// CDN mirror URLs. When a Storage AccessKey is set the zone is listed; otherwise
// each asset is HEAD-probed on the public CDN.
func (c *Client) Releases(ctx context.Context, repo string, cdn CDN) ([]Release, error) {
	var gh []ghRelease
	url := fmt.Sprintf("https://api.github.com/repos/%s/releases?per_page=50", repo)
	if err := c.getJSON(ctx, url, &gh); err != nil {
		return nil, err
	}
	out := make([]Release, 0, len(gh))
	for _, r := range gh {
		if r.Draft {
			continue
		}
		ch := channelForTag(r.TagName, r.Prerelease)
		out = append(out, Release{
			Tag:             r.TagName,
			Version:         versionDisplay(r.TagName),
			Name:            orEmpty(r.Name, r.TagName),
			Body:            r.Body,
			PublishedAt:     r.Published,
			Prerelease:      r.Prerelease,
			Channel:         ch,
			ReleaseURL:      r.HTMLURL,
			Downloads:       matchDownloads(r.Assets),
			DownloadServer:  "github",
			DownloadServers: []string{"github"},
		})
	}
	if cdn.Prefer && cdn.Base != "" {
		if cdn.bunny().enabled() {
			c.preferBunnyStorage(ctx, out, cdn.bunny())
		} else {
			c.preferCdn(ctx, out, cdn.Base)
		}
	}
	return out, nil
}

func downloadAssets(d *Downloads) []*Asset {
	return []*Asset{
		d.AppImageAmd64, d.AppImageArm64, d.DebAmd64, d.DebArm64,
		d.RpmAmd64, d.Wheel, d.WinInstaller, d.WinPortable,
		d.MacDmg, d.MacDmgX64, d.PyzPy311X64, d.PyzPy311Arm64,
		d.PyzPy314X64, d.PyzPy314Arm64, d.Apk, d.AlpineApk,
		d.Flatpak, d.Sbom, d.Torrent,
	}
}

func markDownloadServers(r *Release) {
	bunny, github := false, false
	for _, a := range downloadAssets(&r.Downloads) {
		if a == nil {
			continue
		}
		if a.CdnURL != "" {
			bunny = true
		}
		if a.GitHubURL != "" {
			github = true
		}
	}
	servers := make([]string, 0, 2)
	if bunny {
		servers = append(servers, "bunny")
	}
	if github {
		servers = append(servers, "github")
	}
	r.DownloadServers = servers
	if bunny {
		r.DownloadServer = "bunny"
	} else {
		r.DownloadServer = "github"
	}
}

func (c *Client) preferBunnyStorage(ctx context.Context, rels []Release, b bunnyConfig) {
	catalog := c.bunnyCatalog(ctx, b)
	for i := range rels {
		r := &rels[i]
		path := pathForBunnyTag(catalog, r.Tag)
		if path == "" {
			markDownloadServers(r)
			continue
		}
		files := c.walkBunnyAssets(ctx, b, path)
		for _, a := range downloadAssets(&r.Downloads) {
			if a == nil {
				continue
			}
			if cdn, ok := files[strings.ToLower(a.Name)]; ok {
				applyCdnURL(a, cdn)
			}
		}
		markDownloadServers(r)
	}
}

var cdnTrack = map[string]string{"stable": "release", "beta": "beta", "testing": "testing"}

// TrackForChannel maps a release channel to its CDN directory.
func TrackForChannel(ch string) string {
	return cdnTrack[ch]
}

// preferCdn HEAD-probes the CDN mirror per asset and swaps the URL when it exists.
func (c *Client) preferCdn(ctx context.Context, rels []Release, cdnBase string) {
	var wg sync.WaitGroup
	var mu sync.Mutex
	sem := make(chan struct{}, 8)
	for ri := range rels {
		r := &rels[ri]
		track := cdnTrack[r.Channel]
		for _, a := range downloadAssets(&r.Downloads) {
			if a == nil {
				continue
			}
			a := a
			wg.Add(1)
			sem <- struct{}{}
			go func() {
				defer wg.Done()
				defer func() { <-sem }()
				url := fmt.Sprintf("%s/%s/%s/%s", strings.TrimRight(cdnBase, "/"), track, urlPathEscape(r.Tag), urlPathEscape(a.Name))
				if c.HeadOK(ctx, url) {
					mu.Lock()
					applyCdnURL(a, url)
					mu.Unlock()
				}
			}()
		}
	}
	wg.Wait()
	for i := range rels {
		markDownloadServers(&rels[i])
	}
}

func urlPathEscape(s string) string {
	// GitHub tags and asset names are already URL-safe in practice; replace the
	// two chars that could appear and break the path.
	r := strings.NewReplacer(" ", "%20", "+", "%2B", "#", "%23", "?", "%3F")
	return r.Replace(s)
}

func orEmpty(s, fallback string) string {
	if s == "" {
		return fallback
	}
	return s
}
