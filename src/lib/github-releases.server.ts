import { MESHCHATX_RELEASES } from "./meshchatx-repo";

export type McxDownloadRow = {
  version: string | null;
  releaseUrl: string | null;
  publishedAt: string | null;
  isPrerelease: boolean;
  appImageAmd64Url: string | null;
  appImageArm64Url: string | null;
  debAmd64Url: string | null;
  debArm64Url: string | null;
  rpmAmd64Url: string | null;
  wheelUrl: string | null;
  winInstallerUrl: string | null;
  winPortableUrl: string | null;
  macDmgUrl: string | null;
  apkUrl: string | null;
  flatpakUrl: string | null;
  sbomUrl: string | null;
};

export type McxReleasesPayload = {
  stable: McxDownloadRow | null;
  prerelease: McxDownloadRow | null;
  githubFallbackUrl: string;
};

type GithubAsset = { name: string; browser_download_url: string };

type GithubRelease = {
  tag_name: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
  html_url: string;
  assets: GithubAsset[];
};

type AtomRelease = {
  tag: string;
  publishedAt: string;
};

type FileRow = { base: string; url: string };

const GITHUB_REPO_PATH = "Quad4-Software/MeshChatX";
const GITHUB_RELEASES_API_URL = `https://api.github.com/repos/${GITHUB_REPO_PATH}/releases?per_page=100`;
const GITHUB_RELEASES_ATOM_URL = `https://github.com/${GITHUB_REPO_PATH}/releases.atom`;

let cache: { at: number; payload: McxReleasesPayload } | null = null;

function cacheTtlMs(): number {
  const s = Number(process.env.RELEASES_CACHE_SECONDS);
  if (Number.isFinite(s) && s >= 0)
    return Math.min(Math.max(s, 0), 86400) * 1000;
  return 300_000;
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "meshchatx-website",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function compareVersionDesc(a: string, b: string): number {
  const na = a.replace(/^v/i, "");
  const nb = b.replace(/^v/i, "");
  return nb.localeCompare(na, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function versionDisplayFromTag(tag: string): string {
  return tag.replace(/^v/i, "");
}

function releaseUrlForTag(tag: string): string {
  return `${MESHCHATX_RELEASES}/tag/${encodeURIComponent(tag)}`;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms = 15_000,
): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

function parseGithubReleases(data: unknown): GithubRelease[] {
  if (!Array.isArray(data)) return [];
  const out: GithubRelease[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const tag = o.tag_name;
    const published = o.published_at;
    const htmlUrl = o.html_url;
    if (typeof tag !== "string" || typeof published !== "string") continue;
    if (typeof htmlUrl !== "string") continue;
    if (o.draft === true) continue;
    const assets: GithubAsset[] = [];
    if (Array.isArray(o.assets)) {
      for (const a of o.assets) {
        if (!a || typeof a !== "object") continue;
        const ao = a as Record<string, unknown>;
        const name = ao.name;
        const url = ao.browser_download_url;
        if (typeof name === "string" && typeof url === "string") {
          assets.push({ name, browser_download_url: url });
        }
      }
    }
    out.push({
      tag_name: tag,
      published_at: published,
      prerelease: o.prerelease === true,
      draft: false,
      html_url: htmlUrl,
      assets,
    });
  }
  return out;
}

async function fetchGithubReleasesFromApi(): Promise<GithubRelease[] | null> {
  try {
    const res = await fetchWithTimeout(GITHUB_RELEASES_API_URL, {
      headers: githubHeaders(),
    });
    if (!res.ok) return null;
    const releases = parseGithubReleases(await res.json());
    return releases.length ? releases : null;
  } catch {
    return null;
  }
}

function parseAtomReleases(xml: string): AtomRelease[] {
  const out: AtomRelease[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(xml)) !== null) {
    const block = m[1];
    const updated = /<updated>([^<]+)<\/updated>/.exec(block);
    const href = /\/releases\/tag\/([^"]+)/.exec(block);
    if (!updated || !href) continue;
    const iso = updated[1].trim();
    const ms = new Date(iso).getTime();
    if (!Number.isFinite(ms)) continue;
    out.push({ tag: href[1], publishedAt: iso });
  }
  return out;
}

function isPrereleaseTag(tag: string): boolean {
  const n = tag.replace(/^v/i, "");
  if (/-(rc|alpha|beta|pre)(\.|\d|$)/i.test(n)) return true;
  if (/\d(rc|alpha|beta|pre)(\.|\d|$)/i.test(n)) return true;
  if (/\.(rc|alpha|beta|pre)\d/i.test(n)) return true;
  if (/snapshot|nightly|canary/i.test(n)) return true;
  return false;
}

async function fetchGithubReleasesFromAtom(): Promise<GithubRelease[] | null> {
  try {
    const res = await fetchWithTimeout(GITHUB_RELEASES_ATOM_URL, {
      headers: {
        Accept: "application/atom+xml",
        "User-Agent": "meshchatx-website",
      },
    });
    if (!res.ok) return null;
    const atom = parseAtomReleases(await res.text());
    if (!atom.length) return null;
    return atom.map((e) => ({
      tag_name: e.tag,
      published_at: e.publishedAt,
      prerelease: isPrereleaseTag(e.tag),
      draft: false,
      html_url: releaseUrlForTag(e.tag),
      assets: [],
    }));
  } catch {
    return null;
  }
}

async function fetchGithubReleases(): Promise<GithubRelease[] | null> {
  const fromApi = await fetchGithubReleasesFromApi();
  if (fromApi) return fromApi;
  return fetchGithubReleasesFromAtom();
}

function pickLatestRelease(
  releases: GithubRelease[],
  wantPrerelease: boolean,
): GithubRelease | null {
  const filtered = releases.filter((r) =>
    wantPrerelease ? r.prerelease : !r.prerelease,
  );
  if (!filtered.length) return null;
  filtered.sort((a, b) => compareVersionDesc(a.tag_name, b.tag_name));
  return filtered[0] ?? null;
}

function matchFileUrls(
  files: FileRow[],
  versionDisplay: string,
  isPrerelease: boolean,
): Omit<
  McxDownloadRow,
  "version" | "releaseUrl" | "publishedAt" | "isPrerelease"
> {
  const byBase = (pred: (n: string) => boolean) => {
    const hit = files.find((f) => pred(f.base.toLowerCase()));
    return hit?.url ?? null;
  };

  const notMacWinAppImage = (n: string) =>
    n.endsWith(".appimage") &&
    !/(darwin|macos|\bmac\b|windows|\bwin\b)/i.test(n);

  const appImageAmd64 =
    byBase(
      (n) =>
        n.endsWith(".appimage") &&
        /linux/.test(n) &&
        /(amd64|x86_64)/.test(n) &&
        !/(arm64|aarch64)/.test(n),
    ) ||
    byBase(
      (n) =>
        n.endsWith(".appimage") &&
        /linux/.test(n) &&
        !/(amd64|x86_64|arm64|aarch64)/.test(n),
    ) ||
    byBase(
      (n) =>
        notMacWinAppImage(n) &&
        /(amd64|x86_64)/.test(n) &&
        !/(arm64|aarch64)/.test(n),
    );

  const appImageArm64 =
    byBase(
      (n) =>
        n.endsWith(".appimage") && /linux/.test(n) && /(arm64|aarch64)/.test(n),
    ) ||
    byBase(
      (n) =>
        notMacWinAppImage(n) &&
        /(arm64|aarch64)/.test(n) &&
        !/(amd64|x86_64)/.test(n),
    );

  const debAmd64 = byBase(
    (n) => n.endsWith(".deb") && /(amd64|x86_64)/.test(n),
  );
  const debArm64 = byBase(
    (n) => n.endsWith(".deb") && /(arm64|aarch64)/.test(n),
  );
  const rpmAmd64 = byBase(
    (n) => n.endsWith(".rpm") && /(amd64|x86_64)/.test(n),
  );

  const wheelHit = files.find((f) => /-py3-none-any\.whl$/i.test(f.base));
  const wheelUrl = wheelHit?.url ?? null;

  let macDmgUrl = byBase(
    (n) => n.endsWith(".dmg") && !n.endsWith(".dmg.sha256"),
  );
  if (!macDmgUrl && isPrerelease && wheelHit) {
    const m = wheelHit.base.match(
      /^reticulum_meshchatx-([\d.]+)-py3-none-any\.whl$/i,
    );
    if (m?.[1]) {
      const guess = `ReticulumMeshChatX-v${m[1]}-mac-universal.dmg`;
      macDmgUrl = byBase((n) => n === guess.toLowerCase());
    }
  }
  if (!macDmgUrl && isPrerelease) {
    const m = versionDisplay.match(/^(\d+\.\d+\.\d+)/);
    if (m?.[1]) {
      const guess = `ReticulumMeshChatX-v${m[1]}-mac-universal.dmg`;
      macDmgUrl = byBase((n) => n === guess.toLowerCase());
    }
  }

  const winInstaller = files.find((f) => /win.*installer\.exe$/i.test(f.base));
  const winPortable = files.find((f) => /win.*portable\.exe$/i.test(f.base));
  const apk =
    byBase((n) => n.endsWith(".apk")) ||
    byBase((n) => n === "app-release-signed.apk");
  const flatpak = byBase((n) => n.endsWith(".flatpak"));
  const sbom = byBase((n) => /sbom\.cyclonedx\.json$/i.test(n));

  return {
    appImageAmd64Url: appImageAmd64,
    appImageArm64Url: appImageArm64,
    debAmd64Url: debAmd64,
    debArm64Url: debArm64,
    rpmAmd64Url: rpmAmd64,
    wheelUrl,
    winInstallerUrl: winInstaller?.url ?? null,
    winPortableUrl: winPortable?.url ?? null,
    macDmgUrl,
    apkUrl: apk,
    flatpakUrl: flatpak,
    sbomUrl: sbom,
  };
}

function buildRowFromRelease(release: GithubRelease): McxDownloadRow {
  const files: FileRow[] = release.assets.map((a) => ({
    base: a.name,
    url: a.browser_download_url,
  }));
  const versionDisplay = versionDisplayFromTag(release.tag_name);
  const urls = matchFileUrls(files, versionDisplay, release.prerelease);
  return {
    version: versionDisplay,
    releaseUrl: release.html_url || releaseUrlForTag(release.tag_name),
    publishedAt: release.published_at,
    isPrerelease: release.prerelease,
    ...urls,
  };
}

export async function buildMcxReleasesPayload(): Promise<McxReleasesPayload> {
  const githubFallbackUrl = MESHCHATX_RELEASES;
  const releases = await fetchGithubReleases();
  if (!releases?.length) {
    return { stable: null, prerelease: null, githubFallbackUrl };
  }

  const stableRelease = pickLatestRelease(releases, false);
  const prereleaseRelease = pickLatestRelease(releases, true);

  return {
    stable: stableRelease ? buildRowFromRelease(stableRelease) : null,
    prerelease: prereleaseRelease
      ? buildRowFromRelease(prereleaseRelease)
      : null,
    githubFallbackUrl,
  };
}

export async function getMcxReleasesPayload(): Promise<McxReleasesPayload> {
  const ttl = cacheTtlMs();
  const now = Date.now();
  if (cache && now - cache.at < ttl) {
    return cache.payload;
  }
  const payload = await buildMcxReleasesPayload();
  cache = { at: now, payload };
  return payload;
}

export function resetGithubReleasesCacheForTests(): void {
  cache = null;
}
