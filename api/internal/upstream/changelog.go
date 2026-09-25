package upstream

import (
	"context"
	"regexp"
	"strings"
)

type ChangelogEntry struct {
	Version    string `json:"version"`
	Date       string `json:"date"`
	Anchor     string `json:"anchor"`
	Body       string `json:"body"`
	Unreleased bool   `json:"unreleased"`
}

var headRe = regexp.MustCompile(`(?m)^##\s+\[?([^\]\s]+)\]?(?:\s*-\s*(.+?))?\s*$`)
var nonAnchor = regexp.MustCompile(`[^\w.-]+`)

// Changelog parses the repo's CHANGELOG.md into entries.
func (c *Client) Changelog(ctx context.Context, rawURL string) ([]ChangelogEntry, error) {
	md, err := c.getText(ctx, rawURL)
	if err != nil {
		return nil, err
	}
	heads := headRe.FindAllStringSubmatchIndex(md, -1)
	entries := make([]ChangelogEntry, 0, len(heads))
	for i, h := range heads {
		version := md[h[2]:h[3]]
		date := ""
		if h[5] != -1 {
			date = strings.TrimSpace(md[h[4]:h[5]])
		}
		start := h[1]
		end := len(md)
		if i+1 < len(heads) {
			end = heads[i+1][0]
		}
		body := strings.TrimSpace(md[start:end])
		anchor := "v-" + strings.ToLower(nonAnchor.ReplaceAllString(version, "-"))
		entries = append(entries, ChangelogEntry{
			Version:    version,
			Date:       date,
			Anchor:     anchor,
			Body:       body,
			Unreleased: strings.Contains(strings.ToLower(version), "unreleased"),
		})
	}
	return entries, nil
}
