import { existsSync, readFileSync, type PathLike } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getReleasesBundle,
  parseBundleFile,
  resetReleasesBundleCacheForTests,
} from "./releases-fetch.server";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

const mockedExists = vi.mocked(existsSync);
const mockedRead = vi.mocked(readFileSync);

describe("releases-fetch.server", () => {
  beforeEach(() => {
    resetReleasesBundleCacheForTests();
    vi.stubEnv("RELEASES_CACHE_SECONDS", "0");
    mockedExists.mockReturnValue(false);
    mockedRead.mockImplementation(() => {
      throw new Error("no file");
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("parseBundleFile handles bundle shape and legacy array", () => {
    expect(
      parseBundleFile('{"gitea":[{"tag_name":"v1"}],"github":[]}'),
    ).toEqual({
      gitea: [{ tag_name: "v1" }],
      github: [],
    });
    expect(parseBundleFile('[{"tag_name":"v1"}]')).toEqual({
      gitea: [{ tag_name: "v1" }],
      github: [],
    });
    expect(parseBundleFile("not-json")).toBeNull();
  });

  it("getReleasesBundle uses live fetch when both APIs ok", async () => {
    const fg = [{ tag_name: "v-gitea" }] as Record<string, unknown>[];
    const fgh = [{ tag_name: "v-gh" }] as Record<string, unknown>[];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("git.quad4.io")) {
          return { ok: true, json: async () => fg };
        }
        if (url.includes("api.github.com")) {
          return { ok: true, json: async () => fgh };
        }
        return { ok: false, json: async () => null };
      }),
    );

    const b = await getReleasesBundle();
    expect(b.gitea).toEqual(fg);
    expect(b.github).toEqual(fgh);
  });

  it("getReleasesBundle merges disk fallback when live fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => [] })),
    );
    mockedExists.mockImplementation((p: PathLike) =>
      String(p).includes("releases-bundle.json"),
    );
    mockedRead.mockReturnValue(
      '{"gitea":[{"tag_name":"snap"}],"github":[{"tag_name":"pre"}]}',
    );

    const b = await getReleasesBundle();
    expect(b.gitea).toEqual([{ tag_name: "snap" }]);
    expect(b.github).toEqual([{ tag_name: "pre" }]);
  });

  it("getReleasesBundle uses in-memory cache when TTL allows", async () => {
    resetReleasesBundleCacheForTests();
    vi.stubEnv("RELEASES_CACHE_SECONDS", "3600");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [{ tag_name: "live" }],
      })),
    );
    await getReleasesBundle();
    await getReleasesBundle();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it("getReleasesBundle reads legacy gitea-only JSON when bundle files absent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => [] })),
    );
    mockedExists.mockImplementation((p: PathLike) =>
      String(p).includes("gitea-releases.json"),
    );
    mockedRead.mockReturnValue('[{"tag_name":"legacy"}]');

    const b = await getReleasesBundle();
    expect(b.gitea).toEqual([{ tag_name: "legacy" }]);
    expect(b.github).toEqual([]);
  });
});
