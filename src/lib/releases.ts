import { SITE } from '../config/site';
import { bunnyAssetsByName, bunnyEnabled } from './bunny';
import { attachTorrentMagnets } from './torrents';

export type Channel = 'stable' | 'beta' | 'testing';

export interface ReleaseAsset {
  name: string;
  url: string;
  githubUrl: string;
  cdnUrl?: string;
  sha256: string | null;
  magnet?: string;
}

export interface ReleaseDownloads {
  appImageAmd64: ReleaseAsset | null;
  appImageArm64: ReleaseAsset | null;
  debAmd64: ReleaseAsset | null;
  debArm64: ReleaseAsset | null;
  rpmAmd64: ReleaseAsset | null;
  wheel: ReleaseAsset | null;
  winInstaller: ReleaseAsset | null;
  winPortable: ReleaseAsset | null;
  macDmg: ReleaseAsset | null;
  macDmgX64: ReleaseAsset | null;
  pyzPy311X64: ReleaseAsset | null;
  pyzPy311Arm64: ReleaseAsset | null;
  pyzPy314X64: ReleaseAsset | null;
  pyzPy314Arm64: ReleaseAsset | null;
  apk: ReleaseAsset | null;
  alpineApk: ReleaseAsset | null;
  flatpak: ReleaseAsset | null;
  torrent: ReleaseAsset | null;
}

export interface Release {
  tag: string;
  version: string;
  name: string;
  body: string;
  publishedAt: string;
  prerelease: boolean;
  channel: Channel;
  releaseUrl: string;
  downloads: ReleaseDownloads;
  downloadServer: 'bunny' | 'github';
  downloadServers: Array<'bunny' | 'github'>;
}

interface GhAsset {
  name: string;
  browser_download_url: string;
  digest?: string;
}

interface GhRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
  html_url: string;
  assets: GhAsset[];
}

function versionDisplay(tag: string): string {
  return tag.replace(/^v/i, '');
}

export function channelForTag(tag: string, githubPrerelease = false): Channel {
  const t = tag.trim();
  if (/^(nightly|testing)(-|$)/i.test(t)) return 'testing';
  if (/^(beta|preview)(-|$)/i.test(t)) return 'beta';
  const display = versionDisplay(t);
  if (/(^|[-.])beta(\d|\.|$)/i.test(display)) return 'beta';
  if (githubPrerelease || /(alpha|beta|rc|dev|pre)/i.test(display)) return 'testing';
  return 'stable';
}

function shaOfAsset(a: GhAsset): string | null {
  const d = a.digest ?? '';
  if (d.startsWith('sha256:')) return d.slice(7);
  return null;
}

const CDN_TRACK: Record<Channel, string> = {
  stable: 'release',
  beta: 'beta',
  testing: 'testing',
};

const CDN_SUBDIRS = ['', 'win/', 'mac/', 'android/', 'flatpak/'];

async function cdnUrl(channel: Channel, tag: string, name: string): Promise<string | null> {
  // Probe the CDN mirror paths. The storage layout is <track>/<tag>/<file>
  // with some assets in subdirs like win/ or android/. Nested mac build dirs
  // are not guessable and get covered by applyApiMirrors instead.
  const base = `${SITE.cdnBase}/${CDN_TRACK[channel]}/${encodeURIComponent(tag)}`;
  for (const sub of CDN_SUBDIRS) {
    const url = `${base}/${sub}${encodeURIComponent(name)}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return url;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

async function toAsset(a: GhAsset | null): Promise<ReleaseAsset | null> {
  if (!a) return null;
  return {
    name: a.name,
    url: a.browser_download_url,
    githubUrl: a.browser_download_url,
    sha256: shaOfAsset(a),
  };
}

function eachAsset(d: ReleaseDownloads, fn: (a: ReleaseAsset) => void) {
  for (const asset of Object.values(d)) {
    if (asset) fn(asset);
  }
}

function markServers(release: Release) {
  const servers: Array<'bunny' | 'github'> = [];
  let bunny = false;
  let github = false;
  eachAsset(release.downloads, (a) => {
    if (a.cdnUrl) bunny = true;
    if (a.githubUrl) github = true;
  });
  if (bunny) servers.push('bunny');
  if (github) servers.push('github');
  release.downloadServers = servers;
  release.downloadServer = bunny ? 'bunny' : 'github';
}

async function applyBunnyStorage(release: Release): Promise<void> {
  const files = await bunnyAssetsByName(release.tag);
  if (files.size === 0) return;
  eachAsset(release.downloads, (asset) => {
    const hit = files.get(asset.name.toLowerCase());
    if (!hit) return;
    asset.cdnUrl = hit.url;
    asset.url = hit.url;
    if (hit.sha256 && !asset.sha256) asset.sha256 = hit.sha256;
  });
}

/** Merge CDN mirrors resolved by a release API, which can list storage
 * subdirectories that a HEAD probe cannot guess. Skipped without apiBase. */
async function applyApiMirrors(releases: Release[]): Promise<void> {
  if (!SITE.apiBase) return;
  let list: Array<{ tag?: string; downloads?: Record<string, { name?: string; cdnUrl?: string } | null> }> = [];
  try {
    const res = await Promise.all(
      (['stable', 'beta', 'testing'] as const).map((ch) =>
        fetch(`${SITE.apiBase}/api/releases/${ch}`, {
          headers: { 'User-Agent': 'meshchatx-site-build' },
        }),
      ),
    );
    for (const r of res) {
      if (!r.ok) continue;
      const data = (await r.json()) as { releases?: typeof list } & Record<string, unknown>;
      if (Array.isArray(data)) list.push(...data);
      else if (Array.isArray(data.releases)) list.push(...data.releases);
      else if (data.downloads) list.push(data as (typeof list)[number]);
    }
  } catch {
    return;
  }
  const byTag = new Map(list.map((r) => [r.tag, r]));
  for (const rel of releases) {
    const ar = byTag.get(rel.tag);
    if (!ar?.downloads) continue;
    const apiAssets = Object.values(ar.downloads);
    eachAsset(rel.downloads, (a) => {
      if (a.cdnUrl) return;
      const hit = apiAssets.find(
        (x) => x?.cdnUrl && x.name?.toLowerCase() === a.name.toLowerCase(),
      );
      if (hit?.cdnUrl) {
        a.cdnUrl = hit.cdnUrl;
        a.url = hit.cdnUrl;
      }
    });
  }
}

/** Swap GitHub URLs for CDN mirrors where the file exists on the CDN. */
export async function preferCdn(release: Release): Promise<Release> {
  const jobs: Promise<void>[] = [];
  eachAsset(release.downloads, (asset) => {
    jobs.push(
      cdnUrl(release.channel, release.tag, asset.name).then((mirror) => {
        if (!mirror) return;
        asset.cdnUrl = mirror;
        asset.url = mirror;
      }),
    );
  });
  await Promise.all(jobs);
  markServers(release);
  return release;
}

async function matchDownloads(assets: GhAsset[]): Promise<ReleaseDownloads> {
  const byName = (pred: (n: string) => boolean): GhAsset | null =>
    assets.find((a) => pred(a.name.toLowerCase())) ?? null;

  const notMacWin = (n: string) =>
    n.endsWith('.appimage') && !/(darwin|macos|\bmac\b|windows|\bwin\b)/i.test(n);

  const picks = {
    appImageAmd64:
      byName(
        (n) =>
          n.endsWith('.appimage') &&
          n.includes('linux') &&
          /(amd64|x86_64)/.test(n) &&
          !/(arm64|aarch64)/.test(n),
      ) ??
      byName(
        (n) =>
          n.endsWith('.appimage') &&
          n.includes('linux') &&
          !/(amd64|x86_64|arm64|aarch64)/.test(n),
      ) ??
      byName((n) => notMacWin(n) && /(amd64|x86_64)/.test(n) && !/(arm64|aarch64)/.test(n)),
    appImageArm64:
      byName((n) => n.endsWith('.appimage') && n.includes('linux') && /(arm64|aarch64)/.test(n)) ??
      byName((n) => notMacWin(n) && /(arm64|aarch64)/.test(n) && !/(amd64|x86_64)/.test(n)),
    debAmd64: byName((n) => n.endsWith('.deb') && /(amd64|x86_64)/.test(n)),
    debArm64: byName((n) => n.endsWith('.deb') && /(arm64|aarch64)/.test(n)),
    rpmAmd64: byName((n) => n.endsWith('.rpm') && /(amd64|x86_64)/.test(n)),
    wheel: byName((n) => /-py3-none-any\.whl$/i.test(n)) ?? byName((n) => n.endsWith('.whl')),
    winInstaller: byName((n) => /win.*installer\.exe$/i.test(n)),
    winPortable: byName((n) => /win.*portable\.exe$/i.test(n)),
    macDmg: byName(
      (n) =>
        n.endsWith('.dmg') &&
        /(arm64|aarch64)/.test(n) &&
        !n.endsWith('.dmg.sha256') &&
        !n.includes('.cosign.'),
    ),
    macDmgX64: byName(
      (n) =>
        n.endsWith('.dmg') &&
        /(x64|x86_64|amd64)/.test(n) &&
        !n.endsWith('.dmg.sha256') &&
        !n.includes('.cosign.'),
    ),
    pyzPy311X64: byName((n) => n.endsWith('.pyz') && n.includes('py311') && /(x64|x86_64)/.test(n)),
    pyzPy311Arm64: byName((n) => n.endsWith('.pyz') && n.includes('py311') && /(arm64|aarch64)/.test(n)),
    pyzPy314X64: byName((n) => n.endsWith('.pyz') && n.includes('py314') && /(x64|x86_64)/.test(n)),
    pyzPy314Arm64: byName((n) => n.endsWith('.pyz') && n.includes('py314') && /(arm64|aarch64)/.test(n)),
    apk: byName((n) => n.endsWith('.apk') && !n.includes('alpine') && !n.includes('linux')),
    alpineApk: byName((n) => n.endsWith('.apk') && n.includes('alpine')),
    flatpak: byName((n) => n.endsWith('.flatpak')),
    torrent: byName((n) => n.endsWith('.torrent')),
  };

  const entries = await Promise.all(
    (Object.keys(picks) as (keyof ReleaseDownloads)[]).map(
      async (k) => [k, await toAsset(picks[k])] as const,
    ),
  );
  return Object.fromEntries(entries) as unknown as ReleaseDownloads;
}

let memo: Release[] | null = null;

export async function getReleases(): Promise<Release[]> {
  if (memo) return memo;
  let gh: GhRelease[] = [];
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'meshchatx-site-build',
    };
    const token = process.env.GITHUB_TOKEN?.trim();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${SITE.githubReleasesApi}?per_page=50`, { headers });
    if (res.ok) {
      gh = (await res.json()) as GhRelease[];
    } else {
      console.warn(`[releases] GitHub returned ${res.status}; releases list is empty`);
    }
  } catch (err) {
    // offline build; the download page degrades to GitHub links
    console.warn(`[releases] GitHub fetch failed: ${String(err)}`);
  }
  const out: Release[] = [];
  for (const r of gh) {
    if (r.draft) continue;
    const channel = channelForTag(r.tag_name, r.prerelease);
    out.push({
      tag: r.tag_name,
      version: versionDisplay(r.tag_name),
      name: r.name || r.tag_name,
      body: r.body ?? '',
      publishedAt: r.published_at,
      prerelease: r.prerelease,
      channel,
      releaseUrl: r.html_url,
      downloads: await matchDownloads(r.assets),
      downloadServer: 'github',
      downloadServers: ['github'],
    });
  }
  if (bunnyEnabled()) {
    await Promise.all(out.map((r) => applyBunnyStorage(r)));
    for (const r of out) markServers(r);
  } else {
    const seen = new Set<Channel>();
    for (const r of out) {
      if (seen.has(r.channel)) continue;
      seen.add(r.channel);
      await preferCdn(r);
    }
  }
  await applyApiMirrors(out);
  for (const r of out) markServers(r);
  await attachTorrentMagnets(out);
  memo = out;
  return out;
}

export async function latestForChannel(channel: Channel): Promise<Release | null> {
  const all = await getReleases();
  return all.find((r) => r.channel === channel) ?? null;
}

export async function releasesForChannel(channel: Channel): Promise<Release[]> {
  const all = await getReleases();
  return all.filter((r) => r.channel === channel);
}

export async function publishedVersions(): Promise<string[]> {
  const all = await getReleases();
  return [
    ...new Set(
      all
        .filter((r) => !r.prerelease && /^\d+\.\d+\.\d+$/.test(r.version))
        .map((r) => r.version),
    ),
  ];
}
