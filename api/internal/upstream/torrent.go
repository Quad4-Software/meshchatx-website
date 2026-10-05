package upstream

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
)

// TorrentFile is one payload file in a generated torrent. Path is the
// slash-separated location under the torrent root; it doubles as the
// webseed-relative path, so it must mirror the CDN layout.
type TorrentFile struct {
	Name string
	Path []string
	Size int64
	URL  string
}

// TorrentResult is the generated .torrent payload plus its magnet URI.
type TorrentResult struct {
	Data     []byte
	Magnet   string
	InfoHash string
	FileName string
}

const torrentPieceLen = 2 << 20 // 2 MiB pieces, same as the hand-made releases

var torrentTrackers = []string{
	"udp://tracker.opentrackr.org:1337/announce",
	"udp://open.stealth.si:80/announce",
	"udp://tracker.torrent.eu.org:451/announce",
}

// TorrentFiles returns every release asset for a generated torrent, sorted by
// webseed path. When the asset has a CDN mirror its path under <track>/<tag>
// is preserved so the CDN GetRight seed resolves it; without a mirror the
// bare filename is used, which at least resolves on the flat GitHub seed.
func (r *Release) TorrentFiles() []TorrentFile {
	d := &r.Downloads
	picks := []*Asset{
		d.AppImageAmd64, d.AppImageArm64, d.DebAmd64, d.DebArm64,
		d.RpmAmd64, d.Wheel, d.WinInstaller, d.WinPortable,
		d.MacDmg, d.MacDmgX64, d.PyzPy311X64, d.PyzPy311Arm64,
		d.PyzPy314X64, d.PyzPy314Arm64, d.Apk, d.AlpineApk,
		d.Flatpak, d.Sbom,
	}
	seen := map[string]bool{}
	out := []TorrentFile{}
	for _, a := range picks {
		if a == nil || a.Name == "" || a.Size <= 0 {
			continue
		}
		if seen[a.Name] {
			continue
		}
		seen[a.Name] = true
		u := a.CdnURL
		if u == "" {
			u = a.GitHubURL
		}
		if u == "" {
			continue
		}
		out = append(out, TorrentFile{
			Name: a.Name,
			Path: r.torrentPath(a),
			Size: a.Size,
			URL:  u,
		})
	}
	sort.Slice(out, func(i, j int) bool {
		return strings.Join(out[i].Path, "/") < strings.Join(out[j].Path, "/")
	})
	return out
}

// torrentPath derives the file path inside the torrent. The CDN url already
// encodes <base>/<track>/<tag>/<path>, so the path is whatever follows the
// tag segment.
func (r *Release) torrentPath(a *Asset) []string {
	if a.CdnURL != "" {
		if i := strings.Index(a.CdnURL, "/"+r.Tag+"/"); i >= 0 {
			sub := a.CdnURL[i+len(r.Tag)+2:]
			if segs := strings.Split(sub, "/"); len(segs) > 0 && segs[0] != "" {
				return segs
			}
		}
	}
	return []string{a.Name}
}

// bdecode parses bencode into string, int64, []any, or map[string]any.
func bdecode(b []byte, i *int) (any, error) {
	if *i >= len(b) {
		return nil, fmt.Errorf("bdecode: unexpected end")
	}
	switch c := b[*i]; {
	case c == 'i':
		j := bytes.IndexByte(b[*i:], 'e')
		if j < 0 {
			return nil, fmt.Errorf("bdecode: unterminated int")
		}
		var n int64
		if _, err := fmt.Sscanf(string(b[*i+1:*i+j]), "%d", &n); err != nil {
			return nil, err
		}
		*i += j + 1
		return n, nil
	case c == 'l':
		*i++
		var out []any
		for *i < len(b) && b[*i] != 'e' {
			v, err := bdecode(b, i)
			if err != nil {
				return nil, err
			}
			out = append(out, v)
		}
		*i++
		return out, nil
	case c == 'd':
		*i++
		out := map[string]any{}
		for *i < len(b) && b[*i] != 'e' {
			k, err := bdecode(b, i)
			if err != nil {
				return nil, err
			}
			ks, ok := k.(string)
			if !ok {
				return nil, fmt.Errorf("bdecode: non-string dict key")
			}
			v, err := bdecode(b, i)
			if err != nil {
				return nil, err
			}
			out[ks] = v
		}
		*i++
		return out, nil
	case c >= '0' && c <= '9':
		j := bytes.IndexByte(b[*i:], ':')
		if j < 0 {
			return nil, fmt.Errorf("bdecode: bad string")
		}
		var n int
		if _, err := fmt.Sscanf(string(b[*i:*i+j]), "%d", &n); err != nil {
			return nil, err
		}
		*i += j + 1
		if *i+n > len(b) {
			return nil, fmt.Errorf("bdecode: string overruns input")
		}
		s := string(b[*i : *i+n])
		*i += n
		return s, nil
	default:
		return nil, fmt.Errorf("bdecode: bad byte %q at %d", c, *i)
	}
}

// strList flattens bencoded tracker tiers or url-list entries into a flat
// string slice.
func strList(v any) []string {
	var out []string
	var walk func(any)
	walk = func(x any) {
		switch t := x.(type) {
		case string:
			out = append(out, t)
		case []any:
			for _, e := range t {
				walk(e)
			}
		}
	}
	walk(v)
	return out
}

// MagnetFromTorrent derives a magnet URI from an existing .torrent file:
// the infohash, tracker list, and webseed list are all inside the payload.
// The magnet needs no download of the release files themselves.
func MagnetFromTorrent(data []byte, dn string) (string, error) {
	if len(data) == 0 || data[0] != 'd' {
		return "", fmt.Errorf("bdecode: torrent root is not a dict")
	}
	// Walk the top-level dict and hash the info value's raw bytes so a
	// non-canonical key order still yields the right infohash.
	var hash string
	var trackers, webseeds []string
	i := 1
	for i < len(data) && data[i] != 'e' {
		k, err := bdecode(data, &i)
		if err != nil {
			return "", err
		}
		start := i
		v, err := bdecode(data, &i)
		if err != nil {
			return "", err
		}
		switch k {
		case "info":
			sum := sha1.Sum(data[start:i])
			hash = hex.EncodeToString(sum[:])
		case "announce":
			if s, ok := v.(string); ok {
				trackers = append(trackers, s)
			}
		case "announce-list":
			trackers = append(trackers, strList(v)...)
		case "url-list":
			webseeds = strList(v)
		}
	}
	if hash == "" {
		return "", fmt.Errorf("bdecode: missing info dict")
	}

	var m strings.Builder
	m.WriteString("magnet:?xt=urn:btih:")
	m.WriteString(hash)
	if dn != "" {
		m.WriteString("&dn=")
		m.WriteString(url.PathEscape(dn))
	}
	seen := map[string]bool{}
	for _, tr := range trackers {
		if seen[tr] {
			continue
		}
		seen[tr] = true
		m.WriteString("&tr=")
		m.WriteString(url.QueryEscape(tr))
	}
	for _, ws := range webseeds {
		m.WriteString("&ws=")
		m.WriteString(url.QueryEscape(ws))
	}
	return m.String(), nil
}

// FetchTorrentMagnet downloads a small .torrent asset and returns its magnet.
func (c *Client) FetchTorrentMagnet(ctx context.Context, torrentURL, dn string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, torrentURL, nil)
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
		return "", fmt.Errorf("fetch torrent: %s", res.Status)
	}
	data, err := io.ReadAll(io.LimitReader(res.Body, maxBody))
	if err != nil {
		return "", err
	}
	return MagnetFromTorrent(data, dn)
}

// benc appends the bencode encoding of v to buf. Dict keys sort bytewise.
func benc(buf *bytes.Buffer, v any) {
	switch x := v.(type) {
	case string:
		fmt.Fprintf(buf, "%d:%s", len(x), x)
	case []byte:
		fmt.Fprintf(buf, "%d:", len(x))
		buf.Write(x)
	case int:
		fmt.Fprintf(buf, "i%de", x)
	case int64:
		fmt.Fprintf(buf, "i%de", x)
	case []any:
		buf.WriteByte('l')
		for _, item := range x {
			benc(buf, item)
		}
		buf.WriteByte('e')
	case map[string]any:
		buf.WriteByte('d')
		keys := make([]string, 0, len(x))
		for k := range x {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			benc(buf, k)
			benc(buf, x[k])
		}
		buf.WriteByte('e')
	default:
		panic(fmt.Sprintf("benc: unsupported type %T", v))
	}
}

// hashPieces streams each file in order and returns the concatenated SHA1
// piece hashes plus the total bytes read. A size mismatch against the
// declared length aborts the build so no corrupt torrent is emitted.
func (c *Client) hashPieces(ctx context.Context, files []TorrentFile) ([]byte, error) {
	var pieces []byte
	piece := make([]byte, 0, torrentPieceLen)
	h := sha1.New()
	flush := func() {
		if len(piece) == 0 {
			return
		}
		h.Write(piece)
		pieces = append(pieces, h.Sum(nil)...)
		h.Reset()
		piece = piece[:0]
	}
	for _, f := range files {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, f.URL, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("User-Agent", c.userAgent)
		res, err := c.hcStream.Do(req)
		if err != nil {
			return nil, fmt.Errorf("torrent fetch %s: %w", f.Name, err)
		}
		var got int64
		buf := make([]byte, 1<<20)
		for {
			n, rerr := res.Body.Read(buf)
			for off := 0; off < n; {
				take := torrentPieceLen - len(piece)
				if take > n-off {
					take = n - off
				}
				piece = append(piece, buf[off:off+take]...)
				off += take
				if len(piece) == torrentPieceLen {
					flush()
				}
			}
			got += int64(n)
			if rerr == io.EOF {
				break
			}
			if rerr != nil {
				res.Body.Close()
				return nil, fmt.Errorf("torrent read %s: %w", f.Name, rerr)
			}
		}
		res.Body.Close()
		if got != f.Size {
			return nil, fmt.Errorf("torrent read %s: got %d bytes, want %d", f.Name, got, f.Size)
		}
	}
	flush()
	return pieces, nil
}

// BuildTorrent generates a v1 multi-file torrent for a release tag. The info
// name is the tag so GetRight webseed URLs resolve to <seed>/<tag>/<file>,
// which matches both the CDN layout (<track>/<tag>/<file>) and the GitHub
// releases/download/<tag>/<file> layout.
func (c *Client) BuildTorrent(ctx context.Context, rel *Release, seeds []string) (*TorrentResult, error) {
	files := rel.TorrentFiles()
	if len(files) == 0 {
		return nil, fmt.Errorf("release %s has no torrentable assets", rel.Tag)
	}
	pieces, err := c.hashPieces(ctx, files)
	if err != nil {
		return nil, err
	}
	fl := make([]any, 0, len(files))
	for _, f := range files {
		path := make([]any, 0, len(f.Path))
		for _, seg := range f.Path {
			path = append(path, seg)
		}
		fl = append(fl, map[string]any{
			"length": f.Size,
			"path":   path,
		})
	}
	info := map[string]any{
		"name":         rel.Tag,
		"piece length": torrentPieceLen,
		"pieces":       pieces,
		"files":        fl,
	}
	var infoBuf bytes.Buffer
	benc(&infoBuf, info)
	infoHash := sha1.Sum(infoBuf.Bytes())

	announceList := make([]any, 0, len(torrentTrackers))
	for _, tr := range torrentTrackers {
		announceList = append(announceList, []any{tr})
	}
	urlList := make([]any, 0, len(seeds))
	for _, s := range seeds {
		urlList = append(urlList, s)
	}
	top := map[string]any{
		"announce":      torrentTrackers[0],
		"announce-list": announceList,
		"comment":       fmt.Sprintf("MeshChatX %s webseeded from %s", rel.Tag, seeds[0]),
		"created by":    "MeshChatX",
		"creation date": time.Now().Unix(),
		"encoding":      "UTF-8",
		"url-list":      urlList,
		"info":          info,
	}
	var topBuf bytes.Buffer
	benc(&topBuf, top)

	hash := hex.EncodeToString(infoHash[:])
	var m strings.Builder
	m.WriteString("magnet:?xt=urn:btih:")
	m.WriteString(hash)
	m.WriteString("&dn=")
	m.WriteString(url.PathEscape("MeshChatX-" + rel.Tag))
	for _, tr := range torrentTrackers {
		m.WriteString("&tr=")
		m.WriteString(url.QueryEscape(tr))
	}
	for _, s := range seeds {
		m.WriteString("&ws=")
		m.WriteString(url.QueryEscape(s))
	}
	return &TorrentResult{
		Data:     topBuf.Bytes(),
		Magnet:   m.String(),
		InfoHash: hash,
		FileName: "MeshChatX-" + rel.Tag + ".torrent",
	}, nil
}
