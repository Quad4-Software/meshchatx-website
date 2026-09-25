package upstream

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"sync"
)

type Asset struct {
	Name   string `json:"name"`
	URL    string `json:"url"`
	SHA256 string `json:"sha256,omitempty"`
}

type Downloads struct {
	AppImageAmd64  *Asset `json:"appImageAmd64"`
	AppImageArm64  *Asset `json:"appImageArm64"`
	DebAmd64       *Asset `json:"debAmd64"`
	DebArm64       *Asset `json:"debArm64"`
	RpmAmd64       *Asset `json:"rpmAmd64"`
	Wheel          *Asset `json:"wheel"`
	WinInstaller   *Asset `json:"winInstaller"`
	WinPortable    *Asset `json:"winPortable"`
	MacDmg         *Asset `json:"macDmg"`
	MacDmgX64      *Asset `json:"macDmgX64"`
	PyzPy311X64    *Asset `json:"pyzPy311X64"`
	PyzPy311Arm64  *Asset `json:"pyzPy311Arm64"`
	PyzPy314X64    *Asset `json:"pyzPy314X64"`
	PyzPy314Arm64  *Asset `json:"pyzPy314Arm64"`
	Apk            *Asset `json:"apk"`
	AlpineApk      *Asset `json:"alpineApk"`
	Flatpak        *Asset `json:"flatpak"`
	Sbom           *Asset `json:"sbom"`
}

type Release struct {
	Tag         string    `json:"tag"`
	Version     string    `json:"version"`
	Name        string    `json:"name"`
	Body        string    `json:"body"`
	PublishedAt string    `json:"publishedAt"`
	Prerelease  bool      `json:"prerelease"`
	Channel     string    `json:"channel"`
	ReleaseURL  string    `json:"releaseUrl"`
	Downloads   Downloads `json:"downloads"`
}

type ghAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	Digest             string `json:"digest"`
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
			return &Asset{Name: a.Name, URL: a.BrowserDownloadURL, SHA256: shaOf(a)}
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
			pick(assets, func(n string) bool { return strings.HasSuffix(n, ".appimage") && strings.Contains(n, "linux") && reX64.MatchString(n) && !reArm.MatchString(n) }),
			pick(assets, func(n string) bool { return strings.HasSuffix(n, ".appimage") && strings.Contains(n, "linux") && !reX64.MatchString(n) && !reArm.MatchString(n) }),
			pick(assets, func(n string) bool { return notMacWin(n) && reX64.MatchString(n) && !reArm.MatchString(n) }),
		),
		AppImageArm64: firstNonNil(
			pick(assets, func(n string) bool { return strings.HasSuffix(n, ".appimage") && strings.Contains(n, "linux") && reArm.MatchString(n) }),
			pick(assets, func(n string) bool { return notMacWin(n) && reArm.MatchString(n) }),
		),
		DebAmd64: pick(assets, func(n string) bool { return strings.HasSuffix(n, ".deb") && reX64.MatchString(n) && !reArm.MatchString(n) }),
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
		PyzPy311X64:   pick(assets, func(n string) bool { return strings.HasSuffix(n, ".pyz") && strings.Contains(n, "py311") && reX64.MatchString(n) && !reArm.MatchString(n) }),
		PyzPy311Arm64: pick(assets, func(n string) bool { return strings.HasSuffix(n, ".pyz") && strings.Contains(n, "py311") && reArm.MatchString(n) }),
		PyzPy314X64:   pick(assets, func(n string) bool { return strings.HasSuffix(n, ".pyz") && strings.Contains(n, "py314") && reX64.MatchString(n) && !reArm.MatchString(n) }),
		PyzPy314Arm64: pick(assets, func(n string) bool { return strings.HasSuffix(n, ".pyz") && strings.Contains(n, "py314") && reArm.MatchString(n) }),
		Apk:           pick(assets, func(n string) bool { return strings.HasSuffix(n, ".apk") && !strings.Contains(n, "alpine") && !strings.Contains(n, "linux") }),
		AlpineApk:     pick(assets, func(n string) bool { return strings.HasSuffix(n, ".apk") && strings.Contains(n, "alpine") }),
		Flatpak:       pick(assets, func(n string) bool { return strings.HasSuffix(n, ".flatpak") }),
		Sbom:          pick(assets, func(n string) bool { return strings.HasSuffix(n, "sbom.cyclonedx.json") }),
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

// Releases fetches the GitHub release list, classifies channels, and swaps in
// CDN mirror URLs when the file exists on cdnBase.
func (c *Client) Releases(ctx context.Context, repo, cdnBase string, preferCdn bool) ([]Release, error) {
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
			Tag:         r.TagName,
			Version:     versionDisplay(r.TagName),
			Name:        orEmpty(r.Name, r.TagName),
			Body:        r.Body,
			PublishedAt: r.Published,
			Prerelease:  r.Prerelease,
			Channel:     ch,
			ReleaseURL:  r.HTMLURL,
			Downloads:   matchDownloads(r.Assets),
		})
	}
	if preferCdn && cdnBase != "" {
		c.preferCdn(ctx, out, cdnBase)
	}
	return out, nil
}

var cdnTrack = map[string]string{"stable": "release", "beta": "beta", "testing": "testing"}

// preferCdn HEAD-probes the CDN mirror per asset and swaps the URL when it exists.
func (c *Client) preferCdn(ctx context.Context, rels []Release, cdnBase string) {
	var wg sync.WaitGroup
	var mu sync.Mutex
	sem := make(chan struct{}, 8)
	for ri := range rels {
		r := &rels[ri]
		track := cdnTrack[r.Channel]
		assets := []*Asset{
			r.Downloads.AppImageAmd64, r.Downloads.AppImageArm64, r.Downloads.DebAmd64, r.Downloads.DebArm64,
			r.Downloads.RpmAmd64, r.Downloads.Wheel, r.Downloads.WinInstaller, r.Downloads.WinPortable,
			r.Downloads.MacDmg, r.Downloads.MacDmgX64, r.Downloads.PyzPy311X64, r.Downloads.PyzPy311Arm64,
			r.Downloads.PyzPy314X64, r.Downloads.PyzPy314Arm64, r.Downloads.Apk, r.Downloads.AlpineApk,
			r.Downloads.Flatpak, r.Downloads.Sbom,
		}
		for _, a := range assets {
			if a == nil {
				continue
			}
			a := a
			wg.Add(1)
			sem <- struct{}{}
			go func() {
				defer wg.Done()
				defer func() { <-sem }()
				url := fmt.Sprintf("%s/%s/%s/%s", cdnBase, track, urlPathEscape(r.Tag), urlPathEscape(a.Name))
				if c.HeadOK(ctx, url) {
					mu.Lock()
					a.URL = url
					mu.Unlock()
				}
			}()
		}
	}
	wg.Wait()
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
