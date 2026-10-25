import { SITE } from '../config/site';
import { attachTorrentMagnets } from './torrents';

export type Channel = 'stable' | 'beta' | 'testing';

export interface ReleaseAsset {
  name: string;
  url: string;
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

function toAsset(a: GhAsset | null): ReleaseAsset | null {
  if (!a) return null;
  return {
    name: a.name,
    url: a.browser_download_url,
    sha256: shaOfAsset(a),
  };
}

function matchDownloads(assets: GhAsset[]): ReleaseDownloads {
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

  return Object.fromEntries(
    (Object.keys(picks) as (keyof ReleaseDownloads)[]).map((k) => [k, toAsset(picks[k])]),
  ) as unknown as ReleaseDownloads;
}

let memo: Release[] | null = null;

export async function getReleases(): Promise<Release[]> {
  if (memo) return memo;
  let gh: GhRelease[] = [];
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': `${SITE.slug}-site-build`,
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
      downloads: matchDownloads(r.assets),
    });
  }
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


