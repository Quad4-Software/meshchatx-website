import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getMcxReleasesPayload,
  resetBunnyReleasesCacheForTests,
} from "./bunny-releases.server";

describe("bunny-releases.server", () => {
  beforeEach(() => {
    resetBunnyReleasesCacheForTests();
    vi.stubEnv("RELEASES_CACHE_SECONDS", "0");
    vi.stubEnv("BUNNY_STORAGE_ACCESS_KEY", "test-key");
    vi.stubEnv("BUNNY_STORAGE_HOST", "la.storage.bunnycdn.com");
    vi.stubEnv("BUNNY_STORAGE_ZONE", "meshchatx");
    vi.stubEnv("BUNNY_VERSIONS_PREFIX", "master");
    vi.stubEnv("BUNNY_PUBLIC_BASE_URL", "https://cdn.example.test/meshchatx");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("returns null channels when AccessKey missing", async () => {
    vi.stubEnv("BUNNY_STORAGE_ACCESS_KEY", "");
    const p = await getMcxReleasesPayload();
    expect(p.stable).toBeNull();
    expect(p.prerelease).toBeNull();
    expect(p.githubFallbackUrl).toContain("github.com");
  });

  it("loads stable from master and prerelease from dev when both trees exist", async () => {
    const fetchSpy = vi.fn(async (...args: unknown[]) => {
      const url = String(args[0]);
      if (url.endsWith("/meshchatx/master/")) {
        return {
          ok: true,
          json: async () => [{ ObjectName: "v3.0.0", IsDirectory: true }],
        };
      }
      if (url.endsWith("/meshchatx/dev/")) {
        return {
          ok: true,
          json: async () => [{ ObjectName: "v4.0.0-rc.1", IsDirectory: true }],
        };
      }
      if (url.endsWith("/meshchatx/master/v3.0.0/linux/")) {
        return {
          ok: true,
          json: async () => [
            { ObjectName: "stable.apk", IsDirectory: false },
          ],
        };
      }
      if (url.endsWith("/meshchatx/master/v3.0.0/")) {
        return {
          ok: true,
          json: async () => [{ ObjectName: "linux", IsDirectory: true }],
        };
      }
      if (url.endsWith("/meshchatx/dev/v4.0.0-rc.1/linux/")) {
        return {
          ok: true,
          json: async () => [
            { ObjectName: "pre.apk", IsDirectory: false },
          ],
        };
      }
      if (url.endsWith("/meshchatx/dev/v4.0.0-rc.1/")) {
        return {
          ok: true,
          json: async () => [{ ObjectName: "linux", IsDirectory: true }],
        };
      }
      return { ok: false, json: async () => [] };
    });
    vi.stubGlobal("fetch", fetchSpy);
    const p = await getMcxReleasesPayload();
    expect(p.stable?.version).toBe("3.0.0");
    expect(p.stable?.apkUrl).toContain("stable.apk");
    expect(p.prerelease?.version).toBe("4.0.0-rc.1");
    expect(p.prerelease?.apkUrl).toContain("pre.apk");
  });

  it("lists master, picks stable and prerelease, maps asset URLs", async () => {
    const fetchSpy = vi.fn(async (...args: unknown[]) => {
      const url = String(args[0]);
      if (url.endsWith("/meshchatx/master/")) {
        return {
          ok: true,
          json: async () => [
            { ObjectName: "v1.0.0", IsDirectory: true },
            { ObjectName: "v4.6.0-rc.2", IsDirectory: true },
            { ObjectName: "v4.6.0-rc.10", IsDirectory: true },
          ],
        };
      }
      if (url.endsWith("/meshchatx/master/v1.0.0/win/")) {
        return {
          ok: true,
          json: async () => [
            {
              ObjectName: "MeshChatX-v1.0.0-win-installer.exe",
              IsDirectory: false,
              LastChanged: "2026-05-01T00:00:00Z",
            },
          ],
        };
      }
      if (url.endsWith("/meshchatx/master/v1.0.0/linux/")) {
        return {
          ok: true,
          json: async () => [
            {
              ObjectName: "ReticulumMeshChatX-v1.0.0-linux-x86_64.AppImage",
              IsDirectory: false,
              LastChanged: "2026-05-02T00:00:00Z",
            },
            {
              ObjectName: "reticulum_meshchatx-1.0.0-py3-none-any.whl",
              IsDirectory: false,
              LastChanged: "2026-05-02T01:00:00Z",
            },
          ],
        };
      }
      if (url.endsWith("/meshchatx/master/v1.0.0/")) {
        return {
          ok: true,
          json: async () => [
            {
              ObjectName: "win",
              IsDirectory: true,
            },
            {
              ObjectName: "linux",
              IsDirectory: true,
            },
          ],
        };
      }
      if (url.endsWith("/meshchatx/master/v4.6.0-rc.10/")) {
        return {
          ok: true,
          json: async () => [
            {
              ObjectName: "app-release.apk",
              IsDirectory: false,
              LastChanged: "2026-05-03T00:00:00Z",
            },
          ],
        };
      }
      if (url.endsWith("/meshchatx/dev/")) {
        return { ok: true, json: async () => [] };
      }
      return { ok: false, json: async () => [] };
    });
    vi.stubGlobal("fetch", fetchSpy);

    const p = await getMcxReleasesPayload();
    expect(p.stable?.version).toBe("1.0.0");
    expect(p.stable?.winInstallerUrl).toContain(
      "MeshChatX-v1.0.0-win-installer.exe",
    );
    expect(p.stable?.appImageAmd64Url).toContain("AppImage");
    expect(p.stable?.wheelUrl).toContain(
      "reticulum_meshchatx-1.0.0-py3-none-any.whl",
    );

    expect(p.prerelease?.version).toBe("4.6.0-rc.10");
    expect(p.prerelease?.apkUrl).toContain("app-release.apk");

    const withAccessKey = fetchSpy.mock.calls.some((c) => {
      const init = c[1] as { headers?: { AccessKey?: string } } | undefined;
      return init?.headers?.AccessKey === "test-key";
    });
    expect(withAccessKey).toBe(true);
  });

  it("treats version folder without hyphen-rc as prerelease and matches arch-only AppImage names", async () => {
    vi.stubEnv("BUNNY_VERSIONS_PREFIX", "dev");
    const fetchSpy = vi.fn(async (...args: unknown[]) => {
      const url = String(args[0]);
      if (url.endsWith("/meshchatx/dev/")) {
        return {
          ok: true,
          json: async () => [
            { ObjectName: "v4.6.0rc.5", IsDirectory: true },
          ],
        };
      }
      if (url.endsWith("/meshchatx/dev/v4.6.0rc.5/linux/")) {
        return {
          ok: true,
          json: async () => [
            {
              ObjectName: "ReticulumMeshChatX-v4.6.0rc.5-x86_64.AppImage",
              IsDirectory: false,
            },
          ],
        };
      }
      if (url.endsWith("/meshchatx/dev/v4.6.0rc.5/")) {
        return {
          ok: true,
          json: async () => [{ ObjectName: "linux", IsDirectory: true }],
        };
      }
      return { ok: false, json: async () => [] };
    });
    vi.stubGlobal("fetch", fetchSpy);
    const p = await getMcxReleasesPayload();
    expect(p.stable).toBeNull();
    expect(p.prerelease?.version).toBe("4.6.0rc.5");
    expect(p.prerelease?.appImageAmd64Url).toContain("x86_64.AppImage");
  });

  it("falls back to dev when master has no version folders", async () => {
    vi.stubEnv("BUNNY_VERSIONS_PREFIX", "master");
    const fetchSpy = vi.fn(async (...args: unknown[]) => {
      const url = String(args[0]);
      if (url.endsWith("/meshchatx/master/")) {
        return {
          ok: true,
          json: async () => [
            { ObjectName: "readme.txt", IsDirectory: false },
          ],
        };
      }
      if (url.endsWith("/meshchatx/dev/")) {
        return {
          ok: true,
          json: async () => [{ ObjectName: "v2.0.0", IsDirectory: true }],
        };
      }
      if (url.endsWith("/meshchatx/dev/v2.0.0/win/")) {
        return {
          ok: true,
          json: async () => [
            {
              ObjectName: "MeshChatX-v2.0.0-win-installer.exe",
              IsDirectory: false,
              LastChanged: "2026-05-01T00:00:00Z",
            },
          ],
        };
      }
      if (url.endsWith("/meshchatx/dev/v2.0.0/")) {
        return {
          ok: true,
          json: async () => [{ ObjectName: "win", IsDirectory: true }],
        };
      }
      return { ok: false, json: async () => [] };
    });
    vi.stubGlobal("fetch", fetchSpy);
    const p = await getMcxReleasesPayload();
    expect(p.stable?.version).toBe("2.0.0");
    expect(p.stable?.winInstallerUrl).toContain("meshchatx/dev/v2");
  });

  it("defaults public asset URLs to meshchatx.b-cdn.net when BUNNY_PUBLIC_BASE_URL unset", async () => {
    vi.stubEnv("BUNNY_PUBLIC_BASE_URL", "");
    const fetchSpy = vi.fn(async (...args: unknown[]) => {
      const url = String(args[0]);
      if (url.endsWith("/meshchatx/master/")) {
        return {
          ok: true,
          json: async () => [{ ObjectName: "v2.0.0", IsDirectory: true }],
        };
      }
      if (url.endsWith("/meshchatx/master/v2.0.0/win/")) {
        return {
          ok: true,
          json: async () => [
            {
              ObjectName: "MeshChatX-v2.0.0-win-installer.exe",
              IsDirectory: false,
              LastChanged: "2026-05-01T00:00:00Z",
            },
          ],
        };
      }
      if (url.endsWith("/meshchatx/master/v2.0.0/")) {
        return {
          ok: true,
          json: async () => [{ ObjectName: "win", IsDirectory: true }],
        };
      }
      if (url.endsWith("/meshchatx/dev/")) {
        return { ok: true, json: async () => [] };
      }
      return { ok: false, json: async () => [] };
    });
    vi.stubGlobal("fetch", fetchSpy);
    const p = await getMcxReleasesPayload();
    expect(
      p.stable?.winInstallerUrl?.startsWith("https://meshchatx.b-cdn.net/"),
    ).toBe(true);
  });

  it("uses in-memory cache when TTL allows", async () => {
    vi.stubEnv("RELEASES_CACHE_SECONDS", "3600");
    const fetchSpy = vi.fn(async (...args: unknown[]) => {
      const url = String(args[0]);
      if (url.endsWith("/meshchatx/dev/")) {
        return { ok: true, json: async () => [] };
      }
      return {
        ok: true,
        json: async () => [{ ObjectName: "v1.0.0", IsDirectory: true }],
      };
    });
    vi.stubGlobal("fetch", fetchSpy);
    await getMcxReleasesPayload();
    const n = fetchSpy.mock.calls.length;
    await getMcxReleasesPayload();
    expect(fetchSpy.mock.calls.length).toBe(n);
  });
});
