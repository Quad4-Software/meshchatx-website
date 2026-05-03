import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type ReleaseRecord = Record<string, unknown>;

export type ReleasesBundle = {
  gitea: ReleaseRecord[];
  github: ReleaseRecord[];
};

const GITEA_URL =
  "https://git.quad4.io/api/v1/repos/RNS-Things/MeshChatX/releases?limit=25";
const GITHUB_URL =
  "https://api.github.com/repos/Quad4-Software/MeshChatX/releases?per_page=25";

const ghHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": "meshchatx-website-ssr",
} as const;

let cache: { at: number; bundle: ReleasesBundle } | null = null;

function cacheTtlMs(): number {
  const s = Number(process.env.RELEASES_CACHE_SECONDS);
  if (Number.isFinite(s) && s >= 0)
    return Math.min(Math.max(s, 0), 3600) * 1000;
  return 120_000;
}

async function fetchJsonArray(
  url: string,
  headers?: Record<string, string>,
): Promise<ReleaseRecord[] | null> {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const j: unknown = await res.json();
    return Array.isArray(j) ? (j as ReleaseRecord[]) : null;
  } catch {
    return null;
  }
}

export function parseBundleFile(raw: string): ReleasesBundle | null {
  try {
    const j: unknown = JSON.parse(raw);
    if (Array.isArray(j)) return { gitea: j as ReleaseRecord[], github: [] };
    if (j && typeof j === "object") {
      const o = j as Record<string, unknown>;
      return {
        gitea: Array.isArray(o.gitea) ? (o.gitea as ReleaseRecord[]) : [],
        github: Array.isArray(o.github) ? (o.github as ReleaseRecord[]) : [],
      };
    }
  } catch {
    return null;
  }
  return null;
}

function readFallbackBundle(): ReleasesBundle | null {
  const paths = [
    join(process.cwd(), "build", "client", "data", "releases-bundle.json"),
    join(process.cwd(), "static", "data", "releases-bundle.json"),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    try {
      const parsed = parseBundleFile(readFileSync(p, "utf8"));
      if (parsed) return parsed;
    } catch {
      continue;
    }
  }
  return readLegacyGiteaOnly();
}

function readLegacyGiteaOnly(): ReleasesBundle | null {
  const paths = [
    join(process.cwd(), "build", "client", "data", "gitea-releases.json"),
    join(process.cwd(), "static", "data", "gitea-releases.json"),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    try {
      const j: unknown = JSON.parse(readFileSync(p, "utf8"));
      const gitea = Array.isArray(j) ? (j as ReleaseRecord[]) : [];
      return { gitea, github: [] };
    } catch {
      continue;
    }
  }
  return null;
}

export async function getReleasesBundle(): Promise<ReleasesBundle> {
  const ttl = cacheTtlMs();
  const now = Date.now();
  if (cache && now - cache.at < ttl) {
    return cache.bundle;
  }

  const fallback = readFallbackBundle();

  const [giteaLive, githubLive] = await Promise.all([
    fetchJsonArray(GITEA_URL, { Accept: "application/json" }),
    fetchJsonArray(GITHUB_URL, ghHeaders),
  ]);

  const bundle: ReleasesBundle = {
    gitea: giteaLive !== null ? giteaLive : (fallback?.gitea ?? []),
    github: githubLive !== null ? githubLive : (fallback?.github ?? []),
  };

  cache = { at: now, bundle };
  return bundle;
}

export function resetReleasesBundleCacheForTests(): void {
  cache = null;
}
