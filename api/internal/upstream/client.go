// Package upstream fetches and normalizes the remote data sources the public
// site renders: GitHub releases, the RNS interface directory, and the
// repository changelog.
package upstream

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const maxBody = 8 << 20 // 8 MiB, plenty for release metadata / SBOM JSON

type Client struct {
	hc        *http.Client
	hcStream  *http.Client
	userAgent string
}

func New() *Client {
	tr := &http.Transport{
		MaxIdleConns:        16,
		MaxIdleConnsPerHost: 8,
		IdleConnTimeout:     60 * time.Second,
	}
	return &Client{
		hc: &http.Client{Timeout: 20 * time.Second, Transport: tr},
		// Streams multi-hundred-MB release assets for torrent piece hashing:
		// no whole-request timeout, just a header deadline. The caller's
		// context bounds the total build.
		hcStream: &http.Client{Transport: &http.Transport{
			MaxIdleConns:          8,
			MaxIdleConnsPerHost:   4,
			IdleConnTimeout:       60 * time.Second,
			ResponseHeaderTimeout: 30 * time.Second,
			ExpectContinueTimeout: 5 * time.Second,
			TLSHandshakeTimeout:   15 * time.Second,
			DisableCompression:    true,
		}},
		userAgent: "meshchatx-site-api/1.0",
	}
}

func (c *Client) getJSON(ctx context.Context, url string, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", c.userAgent)
	res, err := c.hc.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("upstream %s: %d", url, res.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, maxBody))
	if err != nil {
		return err
	}
	return json.Unmarshal(body, out)
}

func (c *Client) getText(ctx context.Context, url string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", c.userAgent)
	res, err := c.hc.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("upstream %s: %d", url, res.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, maxBody))
	if err != nil {
		return "", err
	}
	return string(body), nil
}

// HeadOK reports whether a HEAD request succeeds; used for CDN mirror probes.
func (c *Client) HeadOK(ctx context.Context, url string) bool {
	req, err := http.NewRequestWithContext(ctx, http.MethodHead, url, nil)
	if err != nil {
		return false
	}
	req.Header.Set("User-Agent", c.userAgent)
	res, err := c.hc.Do(req)
	if err != nil {
		return false
	}
	res.Body.Close()
	return res.StatusCode >= 200 && res.StatusCode < 300
}
