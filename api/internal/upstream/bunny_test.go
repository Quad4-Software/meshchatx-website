package upstream

import "testing"

func TestNormalizeStoragePath(t *testing.T) {
	if got := normalizeStoragePath("release/v1.0.0"); got != "release/v1.0.0" {
		t.Fatalf("got %q", got)
	}
	if got := normalizeStoragePath("../secret"); got != "" {
		t.Fatalf("dotdot should empty, got %q", got)
	}
}

func TestPathForBunnyTag(t *testing.T) {
	catalog := map[string]string{
		"v4.9.3":                 "release/v4.9.3",
		"nightly-2026.10.01-abc": "testing/nightly-2026.10.01-abc",
	}
	if got := pathForBunnyTag(catalog, "v4.9.3"); got != "release/v4.9.3" {
		t.Fatalf("exact tag: %q", got)
	}
	if got := pathForBunnyTag(catalog, "4.9.3"); got != "release/v4.9.3" {
		t.Fatalf("bare tag: %q", got)
	}
	if got := pathForBunnyTag(catalog, "missing"); got != "" {
		t.Fatalf("missing: %q", got)
	}
}
