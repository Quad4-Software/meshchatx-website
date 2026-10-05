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

// TorrentFile is one payload file in a generated torrent.
type TorrentFile struct {
	Name string
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

// TorrentFiles returns the release assets bundled into a generated torrent:
// the Linux packages and Python artifacts, sorted by basename. Windows, macOS,
// Android, Flatpak, SBOM, and .torrent assets are left out.
func (r *Release) TorrentFiles() []TorrentFile {
	d := &r.Downloads
	picks := []*Asset{
		d.PyzPy311X64, d.PyzPy311Arm64, d.PyzPy314X64, d.PyzPy314Arm64,
		d.Wheel, d.AlpineApk, d.DebAmd64, d.DebArm64, d.RpmAmd64,
		d.AppImageAmd64, d.AppImageArm64,
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
		out = append(out, TorrentFile{Name: a.Name, Size: a.Size, URL: u})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
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
		fl = append(fl, map[string]any{
			"length": f.Size,
			"path":   []any{f.Name},
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
