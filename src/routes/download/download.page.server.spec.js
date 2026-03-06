import { describe, it, expect, vi, beforeEach } from "vitest";
import { load } from "./+page.server.js";

const stableRelease = {
    tag_name: "v4.0.0",
    html_url: "https://example.com/release",
    published_at: "2024-01-01T00:00:00Z",
    prerelease: false,
    draft: false,
    assets: [{ name: "MeshChatX-4.0.0-linux-x86_64.AppImage", browser_download_url: "https://a/app.AppImage" }]
};

const preRelease = {
    tag_name: "v4.1.0-beta.1",
    html_url: "https://example.com/prerelease",
    published_at: "2024-02-01T00:00:00Z",
    prerelease: true,
    draft: false,
    assets: [{ name: "MeshChatX-4.1.0-beta.1-linux-x86_64.AppImage", browser_download_url: "https://a/beta.AppImage" }]
};

function createMockFetch(releases) {
    return vi.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve(releases)
        })
    );
}

function createUrl(search = "") {
    const url = new URL("http://localhost/download");
    if (search) url.search = search;
    return url;
}

describe("download page load", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns stable as selected when no channel param and stable exists", async () => {
        const fetch = createMockFetch([stableRelease]);
        const setHeaders = vi.fn();
        const data = await load({ fetch, setHeaders, url: createUrl() });
        expect(data.selectedChannel).toBe("stable");
        expect(data.selectedRelease?.version).toBe("4.0.0");
        expect(data.hasStableRelease).toBe(true);
        expect(data.error).toBeNull();
    });

    it("selects prerelease when channel=prerelease and prerelease exists", async () => {
        const fetch = createMockFetch([preRelease, stableRelease]);
        const setHeaders = vi.fn();
        const data = await load({ fetch, setHeaders, url: createUrl("?channel=prerelease") });
        expect(data.selectedChannel).toBe("prerelease");
        expect(data.selectedRelease?.version).toBe("4.1.0-beta.1");
        expect(data.hasPreRelease).toBe(true);
    });

    it("filters out drafts", async () => {
        const draft = { ...stableRelease, tag_name: "v3.9.0", draft: true };
        const fetch = createMockFetch([draft, stableRelease]);
        const setHeaders = vi.fn();
        const data = await load({ fetch, setHeaders, url: createUrl() });
        expect(data.selectedRelease?.version).toBe("4.0.0");
    });

    it("returns error when fetch fails", async () => {
        const fetch = vi.fn(() => Promise.resolve({ ok: false, status: 500 }));
        const setHeaders = vi.fn();
        const data = await load({ fetch, setHeaders, url: createUrl() });
        expect(data.error).toBe("Gitea API 500");
    });
});
