package upstream

import (
	"bytes"
	"context"
	"crypto/sha1"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// bdecode is a minimal bencode parser for tests.
func bdecode(b []byte, i *int) any {
	switch {
	case b[*i] == 'i':
		j := bytes.IndexByte(b[*i:], 'e')
		var n int64
		fmt.Sscanf(string(b[*i+1:*i+j]), "%d", &n)
		*i += j + 1
		return n
	case b[*i] == 'l':
		*i++
		var out []any
		for b[*i] != 'e' {
			out = append(out, bdecode(b, i))
		}
		*i++
		return out
	case b[*i] == 'd':
		*i++
		out := map[string]any{}
		for b[*i] != 'e' {
			k := bdecode(b, i).(string)
			out[k] = bdecode(b, i)
		}
		*i++
		return out
	default:
		j := bytes.IndexByte(b[*i:], ':')
		var n int
		fmt.Sscanf(string(b[*i:*i+j]), "%d", &n)
		*i += j + 1
		s := string(b[*i : *i+n])
		*i += n
		return s
	}
}

func TestBuildTorrent(t *testing.T) {
	fileA := bytes.Repeat([]byte("a"), 3<<20) // 3 MiB -> 1.5 pieces
	fileB := bytes.Repeat([]byte("b"), 1<<20) // 1 MiB -> fills remainder + 0.5 piece
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/release/v9.9.9/a.bin":
			w.Write(fileA)
		case "/release/v9.9.9/b.bin":
			w.Write(fileB)
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	rel := &Release{Tag: "v9.9.9", Channel: "stable"}
	rel.Downloads.AppImageAmd64 = &Asset{Name: "a.bin", Size: int64(len(fileA)), GitHubURL: srv.URL + "/release/v9.9.9/a.bin"}
	rel.Downloads.DebAmd64 = &Asset{Name: "b.bin", Size: int64(len(fileB)), GitHubURL: srv.URL + "/release/v9.9.9/b.bin"}
	// Not torrentable: must be excluded.
	rel.Downloads.WinInstaller = &Asset{Name: "win.exe", Size: 10, GitHubURL: srv.URL + "/x"}
	rel.Downloads.Sbom = &Asset{Name: "sbom.cyclonedx.json", Size: 10, GitHubURL: srv.URL + "/x"}

	seeds := []string{srv.URL + "/release/", "https://github.com/Quad4-Software/MeshChatX/releases/download/"}
	res, err := New().BuildTorrent(context.Background(), rel, seeds)
	if err != nil {
		t.Fatal(err)
	}
	if res.FileName != "MeshChatX-v9.9.9.torrent" {
		t.Fatalf("filename %q", res.FileName)
	}
	if !strings.HasPrefix(res.Magnet, "magnet:?xt=urn:btih:"+res.InfoHash) {
		t.Fatalf("magnet %q lacks infohash", res.Magnet)
	}
	if !strings.Contains(res.Magnet, "ws=") || !strings.Contains(res.Magnet, "tr=") {
		t.Fatalf("magnet missing seeds/trackers: %q", res.Magnet)
	}

	i := 0
	top := bdecode(res.Data, &i).(map[string]any)
	if top["announce"] != torrentTrackers[0] {
		t.Fatalf("announce %v", top["announce"])
	}
	urls := top["url-list"].([]any)
	if urls[0] != seeds[0] || urls[1] != seeds[1] {
		t.Fatalf("url-list %v", urls)
	}
	info := top["info"].(map[string]any)
	if info["name"] != "v9.9.9" {
		t.Fatalf("info.name %v", info["name"])
	}
	if info["piece length"].(int64) != torrentPieceLen {
		t.Fatalf("piece length %v", info["piece length"])
	}
	fl := info["files"].([]any)
	if len(fl) != 2 {
		t.Fatalf("files %d", len(fl))
	}

	// Pieces must match the concatenated stream a+b split at 2 MiB.
	stream := append(append([]byte{}, fileA...), fileB...)
	var want []byte
	for off := 0; off < len(stream); off += torrentPieceLen {
		end := off + torrentPieceLen
		if end > len(stream) {
			end = len(stream)
		}
		sum := sha1.Sum(stream[off:end])
		want = append(want, sum[:]...)
	}
	if info["pieces"].(string) != string(want) {
		t.Fatal("pieces mismatch")
	}

	// infohash must equal sha1 of the bencoded info dict.
	var infoBytes bytes.Buffer
	benc(&infoBytes, map[string]any{
		"name":         rel.Tag,
		"piece length": torrentPieceLen,
		"pieces":       info["pieces"].(string),
		"files":        fl,
	})
	if got := fmt.Sprintf("%x", sha1.Sum(infoBytes.Bytes())); got != res.InfoHash {
		t.Fatalf("infohash %s != %s", got, res.InfoHash)
	}
}

func TestBuildTorrentSizeMismatch(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("short"))
	}))
	defer srv.Close()
	rel := &Release{Tag: "v0.0.1", Channel: "stable"}
	rel.Downloads.DebAmd64 = &Asset{Name: "x.deb", Size: 999, GitHubURL: srv.URL + "/x.deb"}
	_, err := New().BuildTorrent(context.Background(), rel, []string{srv.URL + "/"})
	if err == nil || !strings.Contains(err.Error(), "got 5 bytes") {
		t.Fatalf("want size mismatch error, got %v", err)
	}
}
