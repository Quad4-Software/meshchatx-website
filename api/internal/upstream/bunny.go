package upstream

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path"
	"strings"
)

type bunnyConfig struct {
	AccessKey string
	Zone      string
	Endpoint  string
	CdnBase   string
}

func (b bunnyConfig) enabled() bool {
	return strings.TrimSpace(b.AccessKey) != "" &&
		strings.TrimSpace(b.Zone) != "" &&
		strings.TrimSpace(b.CdnBase) != ""
}

type bunnyEntry struct {
	ObjectName  string `json:"ObjectName"`
	IsDirectory bool   `json:"IsDirectory"`
	Checksum    string `json:"Checksum"`
}

var bunnyTracks = map[string]struct{}{
	"release": {},
	"testing": {},
	"beta":    {},
	"nightly": {},
	"preview": {},
}

func normalizeStoragePath(p string) string {
	p = strings.Trim(strings.ReplaceAll(p, "\\", "/"), "/")
	if p == "" || p == "." {
		return ""
	}
	parts := make([]string, 0, 4)
	for _, part := range strings.Split(p, "/") {
		if part == "" || part == "." {
			continue
		}
		if part == ".." {
			return ""
		}
		parts = append(parts, part)
	}
	return strings.Join(parts, "/")
}

func (c *Client) listBunnyDir(ctx context.Context, b bunnyConfig, rel string) ([]bunnyEntry, error) {
	endpoint := strings.TrimRight(b.Endpoint, "/")
	zone := strings.Trim(b.Zone, "/")
	if endpoint == "" || zone == "" {
		return nil, nil
	}
	u := endpoint + "/" + zone + "/"
	rel = normalizeStoragePath(rel)
	if rel != "" {
		u += rel + "/"
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("AccessKey", b.AccessKey)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", c.userAgent)
	res, err := c.hc.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("bunny storage %s: %d", u, res.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, maxBody))
	if err != nil {
		return nil, err
	}
	var entries []bunnyEntry
	if err := json.Unmarshal(body, &entries); err != nil {
		return nil, err
	}
	return entries, nil
}

func (c *Client) bunnyCatalog(ctx context.Context, b bunnyConfig) map[string]string {
	out := map[string]string{}
	root, err := c.listBunnyDir(ctx, b, "")
	if err != nil {
		return out
	}
	for _, entry := range root {
		track := strings.TrimSpace(entry.ObjectName)
		if !entry.IsDirectory || track == "" || strings.HasPrefix(track, ".") {
			continue
		}
		if _, ok := bunnyTracks[track]; !ok {
			continue
		}
		kids, err := c.listBunnyDir(ctx, b, track)
		if err != nil {
			continue
		}
		for _, child := range kids {
			tag := strings.TrimSpace(child.ObjectName)
			if !child.IsDirectory || tag == "" || strings.HasPrefix(tag, ".") {
				continue
			}
			out[tag] = track + "/" + tag
		}
	}
	return out
}

func pathForBunnyTag(catalog map[string]string, tag string) string {
	tag = strings.TrimSpace(tag)
	if tag == "" {
		return ""
	}
	if p, ok := catalog[tag]; ok {
		return p
	}
	bare := strings.TrimPrefix(strings.TrimPrefix(tag, "v"), "V")
	for _, candidate := range []string{tag, "v" + bare, bare} {
		if p, ok := catalog[candidate]; ok {
			return p
		}
	}
	return ""
}

func (c *Client) walkBunnyAssets(ctx context.Context, b bunnyConfig, rel string) map[string]string {
	base := strings.TrimRight(b.CdnBase, "/")
	out := map[string]string{}
	queue := []string{normalizeStoragePath(rel)}
	for len(queue) > 0 {
		dir := queue[0]
		queue = queue[1:]
		entries, err := c.listBunnyDir(ctx, b, dir)
		if err != nil {
			continue
		}
		for _, entry := range entries {
			name := strings.TrimSpace(entry.ObjectName)
			if name == "" || strings.HasPrefix(name, ".") {
				continue
			}
			child := name
			if dir != "" {
				child = dir + "/" + name
			}
			if entry.IsDirectory {
				queue = append(queue, child)
				continue
			}
			out[strings.ToLower(name)] = base + "/" + path.Clean(child)
		}
	}
	return out
}

func applyCdnURL(a *Asset, cdn string) {
	if a == nil || cdn == "" {
		return
	}
	if a.GitHubURL == "" {
		a.GitHubURL = a.URL
	}
	a.CdnURL = cdn
	a.URL = cdn
}
