import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getMcxReleasesPayload,
  resetGithubReleasesCacheForTests,
} from "./github-releases.server";

const API_URL =
  "https://api.github.com/repos/Quad4-Software/MeshChatX/releases?per_page=100";
const ATOM_URL = "https://github.com/Quad4-Software/MeshChatX/releases.atom";

function mockGithubApiReleases(
  releases: Record<string, unknown>[],
): ReturnType<typeof vi.fn> {
  return vi.fn(async (url: string) => {
    if (url === API_URL) {
      return { ok: true, json: async () => releases };
    }
    return { ok: false, text: async () => "" };
  });
}

describe("github-releases.server", () => {
  beforeEach(() => {
    resetGithubReleasesCacheForTests();
    vi.stubEnv("RELEASES_CACHE_SECONDS", "0");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("returns null channels when GitHub is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network");
      }),
    );
    const p = await getMcxReleasesPayload();
    expect(p.stable).toBeNull();
    expect(p.prerelease).toBeNull();
    expect(p.githubFallbackUrl).toContain("github.com");
  });

  it("loads stable and prerelease from GitHub API assets", async () => {
    vi.stubGlobal(
      "fetch",
      mockGithubApiReleases([
        {
          tag_name: "v3.0.0",
          published_at: "2026-01-01T00:00:00Z",
          prerelease: false,
          draft: false,
          html_url:
            "https://github.com/Quad4-Software/MeshChatX/releases/tag/v3.0.0",
          assets: [
            {
              name: "app-release-signed.apk",
              browser_download_url:
                "https://github.com/Quad4-Software/MeshChatX/releases/download/v3.0.0/app-release-signed.apk",
            },
          ],
        },
        {
          tag_name: "v4.0.0-rc.1",
          published_at: "2026-02-01T00:00:00Z",
          prerelease: true,
          draft: false,
          html_url:
            "https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.0.0-rc.1",
          assets: [
            {
              name: "pre.apk",
              browser_download_url:
                "https://github.com/Quad4-Software/MeshChatX/releases/download/v4.0.0-rc.1/pre.apk",
            },
          ],
        },
      ]),
    );
    const p = await getMcxReleasesPayload();
    expect(p.stable?.version).toBe("3.0.0");
    expect(p.stable?.apkUrl).toContain("app-release-signed.apk");
    expect(p.prerelease?.version).toBe("4.0.0-rc.1");
    expect(p.prerelease?.apkUrl).toContain("pre.apk");
  });

  it("maps installer, AppImage, and wheel URLs from release assets", async () => {
    vi.stubGlobal(
      "fetch",
      mockGithubApiReleases([
        {
          tag_name: "v1.0.0",
          published_at: "2026-05-01T00:00:00Z",
          prerelease: false,
          draft: false,
          html_url:
            "https://github.com/Quad4-Software/MeshChatX/releases/tag/v1.0.0",
          assets: [
            {
              name: "MeshChatX-v1.0.0-win-installer.exe",
              browser_download_url:
                "https://github.com/Quad4-Software/MeshChatX/releases/download/v1.0.0/MeshChatX-v1.0.0-win-installer.exe",
            },
            {
              name: "ReticulumMeshChatX-v1.0.0-linux-x86_64.AppImage",
              browser_download_url:
                "https://github.com/Quad4-Software/MeshChatX/releases/download/v1.0.0/ReticulumMeshChatX-v1.0.0-linux-x86_64.AppImage",
            },
            {
              name: "reticulum_meshchatx-1.0.0-py3-none-any.whl",
              browser_download_url:
                "https://github.com/Quad4-Software/MeshChatX/releases/download/v1.0.0/reticulum_meshchatx-1.0.0-py3-none-any.whl",
            },
          ],
        },
        {
          tag_name: "v4.6.0-rc.10",
          published_at: "2026-05-03T00:00:00Z",
          prerelease: true,
          draft: false,
          html_url:
            "https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.6.0-rc.10",
          assets: [
            {
              name: "app-release.apk",
              browser_download_url:
                "https://github.com/Quad4-Software/MeshChatX/releases/download/v4.6.0-rc.10/app-release.apk",
            },
          ],
        },
      ]),
    );
    const p = await getMcxReleasesPayload();
    expect(p.stable?.version).toBe("1.0.0");
    expect(p.stable?.winInstallerUrl).toContain("win-installer.exe");
    expect(p.stable?.appImageAmd64Url).toContain("AppImage");
    expect(p.stable?.wheelUrl).toContain(
      "reticulum_meshchatx-1.0.0-py3-none-any.whl",
    );
    expect(p.prerelease?.version).toBe("4.6.0-rc.10");
    expect(p.prerelease?.apkUrl).toContain("app-release.apk");
  });

  it("falls back to Atom feed when API fails", async () => {
    const fetchSpy = vi.fn(async (url: string) => {
      if (url === API_URL) return { ok: false, text: async () => "" };
      if (url === ATOM_URL) {
        return {
          ok: true,
          text: async () => `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <updated>2026-03-01T00:00:00Z</updated>
    <link href="https://github.com/Quad4-Software/MeshChatX/releases/tag/v2.0.0"/>
  </entry>
  <entry>
    <updated>2026-04-01T00:00:00Z</updated>
    <link href="https://github.com/Quad4-Software/MeshChatX/releases/tag/v2.1.0-rc.1"/>
  </entry>
</feed>`,
        };
      }
      return { ok: false, text: async () => "" };
    });
    vi.stubGlobal("fetch", fetchSpy);
    const p = await getMcxReleasesPayload();
    expect(p.stable?.version).toBe("2.0.0");
    expect(p.stable?.releaseUrl).toContain("/tag/v2.0.0");
    expect(p.stable?.apkUrl).toBeNull();
    expect(p.prerelease?.version).toBe("2.1.0-rc.1");
  });

  it("skips draft releases", async () => {
    vi.stubGlobal(
      "fetch",
      mockGithubApiReleases([
        {
          tag_name: "v9.9.9",
          published_at: "2026-06-01T00:00:00Z",
          prerelease: false,
          draft: true,
          html_url:
            "https://github.com/Quad4-Software/MeshChatX/releases/tag/v9.9.9",
          assets: [],
        },
        {
          tag_name: "v2.0.0",
          published_at: "2026-05-01T00:00:00Z",
          prerelease: false,
          draft: false,
          html_url:
            "https://github.com/Quad4-Software/MeshChatX/releases/tag/v2.0.0",
          assets: [
            {
              name: "solo.apk",
              browser_download_url:
                "https://github.com/Quad4-Software/MeshChatX/releases/download/v2.0.0/solo.apk",
            },
          ],
        },
      ]),
    );
    const p = await getMcxReleasesPayload();
    expect(p.stable?.version).toBe("2.0.0");
    expect(p.prerelease).toBeNull();
  });

  it("uses in-memory cache when TTL allows", async () => {
    vi.stubEnv("RELEASES_CACHE_SECONDS", "3600");
    const fetchSpy = mockGithubApiReleases([
      {
        tag_name: "v1.0.0",
        published_at: "2026-01-01T00:00:00Z",
        prerelease: false,
        draft: false,
        html_url:
          "https://github.com/Quad4-Software/MeshChatX/releases/tag/v1.0.0",
        assets: [],
      },
    ]);
    vi.stubGlobal("fetch", fetchSpy);
    await getMcxReleasesPayload();
    const n = fetchSpy.mock.calls.length;
    await getMcxReleasesPayload();
    expect(fetchSpy.mock.calls.length).toBe(n);
  });
});
