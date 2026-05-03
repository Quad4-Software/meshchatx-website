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

type BunnyEntry = Record<string, unknown>;

const DEFAULT_BUNNY_PUBLIC_BASE_URL = "https://meshchatx.b-cdn.net";

let cache: { at: number; payload: McxReleasesPayload } | null = null;

function cacheTtlMs(): number {
  const s = Number(process.env.RELEASES_CACHE_SECONDS);
  if (Number.isFinite(s) && s >= 0)
    return Math.min(Math.max(s, 0), 86400) * 1000;
  return 300_000;
}

function storageHost(): string {
  return (
    process.env.BUNNY_STORAGE_HOST?.trim() || "la.storage.bunnycdn.com"
  ).replace(/^https?:\/\//i, "");
}

function storageZone(): string {
  return process.env.BUNNY_STORAGE_ZONE?.trim() || "meshchatx";
}

function storageAccessKey(): string {
  return process.env.BUNNY_STORAGE_ACCESS_KEY?.trim() || "";
}

/** Base URL for browser downloads (Pull Zone or public storage URL). Trailing slashes stripped. */
function publicFilesBase(): string {
  const fromEnv = process.env.BUNNY_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return DEFAULT_BUNNY_PUBLIC_BASE_URL;
}

/** Directory under the zone listing version folders (e.g. `master` for `master/v1.0.0/win/...`). */
function versionsPrefix(): string {
  return (
    process.env.BUNNY_VERSIONS_PREFIX?.trim() ||
    process.env.BUNNY_RELEASES_PREFIX?.trim() ||
    "master"
  ).replace(/^\/+|\/+$/g, "");
}

function entryName(e: BunnyEntry): string {
  const n = e.ObjectName ?? e.objectName;
  return typeof n === "string" ? n : "";
}

function entryIsDir(e: BunnyEntry): boolean {
  const v = e.IsDirectory ?? e.isDirectory;
  return v === true;
}

function entryLastChanged(e: BunnyEntry): string | undefined {
  const v = e.LastChanged ?? e.lastChanged;
  return typeof v === "string" ? v : undefined;
}

function listUrl(host: string, zone: string, dir: string): string {
  const parts = dir.split("/").filter(Boolean).map(encodeURIComponent);
  const tail = parts.length ? `${parts.join("/")}/` : "";
  return `https://${host}/${zone}/${tail}`;
}

async function listBunnyDirectory(
  host: string,
  zone: string,
  accessKey: string,
  dir: string,
): Promise<BunnyEntry[] | null> {
  try {
    const res = await fetch(listUrl(host, zone, dir), {
      headers: { AccessKey: accessKey },
    });
    if (!res.ok) return null;
    const j: unknown = await res.json();
    return Array.isArray(j) ? (j as BunnyEntry[]) : null;
  } catch {
    return null;
  }
}

function isPrereleaseVersionName(folder: string): boolean {
  const n = folder.replace(/^v/i, "");
  return /-(rc|alpha|beta|pre)(\.|\d|$)/i.test(n);
}

function looksLikeVersionFolder(name: string): boolean {
  if (!name || name === "." || name === "..") return false;
  return /\d/.test(name);
}

function compareVersionDesc(a: string, b: string): number {
  const na = a.replace(/^v/i, "");
  const nb = b.replace(/^v/i, "");
  return nb.localeCompare(na, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function pickLatest(names: string[], prerelease: boolean): string | null {
  const filtered = names
    .filter(looksLikeVersionFolder)
    .filter((n) =>
      prerelease ? isPrereleaseVersionName(n) : !isPrereleaseVersionName(n),
    );
  if (!filtered.length) return null;
  filtered.sort(compareVersionDesc);
  return filtered[0]!;
}

function publicUrlForRelativePath(rel: string): string {
  const base = publicFilesBase();
  const tail = rel.split("/").filter(Boolean).map(encodeURIComponent).join("/");
  return `${base}/${tail}`;
}

type FileRow = { rel: string; base: string; last?: string };

async function collectFilesUnderVersion(
  host: string,
  zone: string,
  accessKey: string,
  versionRoot: string,
  maxDepth: number,
): Promise<FileRow[]> {
  const out: FileRow[] = [];

  async function walk(rel: string, depth: number) {
    if (depth > maxDepth) return;
    const entries = await listBunnyDirectory(host, zone, accessKey, rel);
    if (!entries) return;
    for (const e of entries) {
      const name = entryName(e);
      if (!name || name === "." || name === "..") continue;
      const child = rel ? `${rel}/${name}` : name;
      if (entryIsDir(e)) {
        await walk(child, depth + 1);
      } else {
        out.push({
          rel: child,
          base: name,
          last: entryLastChanged(e),
        });
      }
    }
  }

  await walk(versionRoot, 0);
  return out;
}

function maxIso(dates: (string | undefined)[]): string | null {
  let best: string | null = null;
  let bestMs = 0;
  for (const d of dates) {
    if (!d) continue;
    const ms = new Date(d).getTime();
    if (Number.isFinite(ms) && ms >= bestMs) {
      bestMs = ms;
      best = d;
    }
  }
  return best;
}

function matchFileUrls(
  files: FileRow[],
  versionDisplay: string,
  isPrerelease: boolean,
): McxDownloadRow {
  const byBase = (pred: (n: string) => boolean) => {
    const hit = files.find((f) => pred(f.base.toLowerCase()));
    return hit ? publicUrlForRelativePath(hit.rel) : null;
  };

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
    );

  const appImageArm64 = byBase(
    (n) =>
      n.endsWith(".appimage") && /linux/.test(n) && /(arm64|aarch64)/.test(n),
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
  const wheelUrl = wheelHit ? publicUrlForRelativePath(wheelHit.rel) : null;

  let macDmgUrl = byBase(
    (n) => n.endsWith(".dmg") && !n.endsWith(".dmg.sha256"),
  );
  if (!macDmgUrl && isPrerelease && wheelHit) {
    const m = wheelHit.base.match(
      /^reticulum_meshchatx-([\d.]+)-py3-none-any\.whl$/i,
    );
    if (m?.[1]) {
      const guess = `ReticulumMeshChatX-v${m[1]}-mac-universal.dmg`;
      const guessHit = files.find(
        (f) => f.base.toLowerCase() === guess.toLowerCase(),
      );
      if (guessHit) macDmgUrl = publicUrlForRelativePath(guessHit.rel);
    }
  }
  if (!macDmgUrl && isPrerelease) {
    const m = versionDisplay.match(/^(\d+\.\d+\.\d+)/);
    if (m?.[1]) {
      const guess = `ReticulumMeshChatX-v${m[1]}-mac-universal.dmg`;
      const guessHit = files.find(
        (f) => f.base.toLowerCase() === guess.toLowerCase(),
      );
      if (guessHit) macDmgUrl = publicUrlForRelativePath(guessHit.rel);
    }
  }

  const winInstaller = files.find((f) => /win.*installer\.exe$/i.test(f.base));
  const winPortable = files.find((f) => /win.*portable\.exe$/i.test(f.base));
  const apk = byBase((n) => n.endsWith(".apk"));
  const flatpak = byBase((n) => n.endsWith(".flatpak"));
  const sbom = byBase((n) => /sbom\.cyclonedx\.json$/i.test(n));

  return {
    version: versionDisplay,
    releaseUrl: MESHCHATX_RELEASES,
    publishedAt: maxIso(files.map((f) => f.last)),
    isPrerelease,
    appImageAmd64Url: appImageAmd64,
    appImageArm64Url: appImageArm64,
    debAmd64Url: debAmd64,
    debArm64Url: debArm64,
    rpmAmd64Url: rpmAmd64,
    wheelUrl,
    winInstallerUrl: winInstaller
      ? publicUrlForRelativePath(winInstaller.rel)
      : null,
    winPortableUrl: winPortable
      ? publicUrlForRelativePath(winPortable.rel)
      : null,
    macDmgUrl,
    apkUrl: apk,
    flatpakUrl: flatpak,
    sbomUrl: sbom,
  };
}

async function buildRowForVersion(
  host: string,
  zone: string,
  accessKey: string,
  prefix: string,
  versionFolder: string,
  isPrerelease: boolean,
): Promise<McxDownloadRow | null> {
  const versionRoot = `${prefix}/${versionFolder}`.replace(/^\/+/, "");
  const files = await collectFilesUnderVersion(
    host,
    zone,
    accessKey,
    versionRoot,
    5,
  );
  if (!files.length) return null;
  const versionDisplay = versionFolder.replace(/^v/i, "");
  return matchFileUrls(files, versionDisplay, isPrerelease);
}

export async function buildMcxReleasesPayload(): Promise<McxReleasesPayload> {
  const githubFallbackUrl = MESHCHATX_RELEASES;
  const key = storageAccessKey();
  if (!key) {
    return { stable: null, prerelease: null, githubFallbackUrl };
  }

  const host = storageHost();
  const zone = storageZone();
  const prefix = versionsPrefix();

  const rootList = await listBunnyDirectory(host, zone, key, prefix);
  if (!rootList) {
    return { stable: null, prerelease: null, githubFallbackUrl };
  }

  const dirNames = rootList.filter(entryIsDir).map(entryName).filter(Boolean);

  const stableFolder = pickLatest(dirNames, false);
  const preFolder = pickLatest(dirNames, true);

  const stable =
    stableFolder !== null
      ? await buildRowForVersion(host, zone, key, prefix, stableFolder, false)
      : null;
  const prerelease =
    preFolder !== null
      ? await buildRowForVersion(host, zone, key, prefix, preFolder, true)
      : null;

  return { stable, prerelease, githubFallbackUrl };
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

export function resetBunnyReleasesCacheForTests(): void {
  cache = null;
}
