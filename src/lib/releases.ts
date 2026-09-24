import { SITE } from '../config/site';

export type Channel = 'stable' | 'beta' | 'testing';

export interface ReleaseAsset {
  name: string;
  url: string;
  sha256: string | null;
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
  sbom: ReleaseAsset | null;
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

const CDN_TRACK: Record<Channel, string> = {
  stable: 'release',
  beta: 'beta',
  testing: 'testing',
};

async function cdnUrl(channel: Channel, tag: string, name: string): Promise<string | null> {
  // Probe the CDN mirror path. The storage layout is <track>/<tag>/<file>.
  const url = `${SITE.cdnBase}/${CDN_TRACK[channel]}/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok ? url : null;
  } catch {
    return null;
  }
}

async function toAsset(a: GhAsset | null): Promise<ReleaseAsset | null> {
  if (!a) return null;
  return {
    name: a.name,
    url: a.browser_download_url,
    sha256: shaOfAsset(a),
  };
}

/** Swap GitHub URLs for CDN mirrors where the file exists on the CDN. */
export async function preferCdn(release: Release): Promise<Release> {
  const jobs: Promise<void>[] = [];
  for (const key of Object.keys(release.downloads) as (keyof ReleaseDownloads)[]) {
    const asset = release.downloads[key];
    if (!asset) continue;
    jobs.push(
      cdnUrl(release.channel, release.tag, asset.name).then((mirror) => {
        if (mirror) asset.url = mirror;
      }),
    );
  }
  await Promise.all(jobs);
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
    sbom: byName((n) => /sbom\.cyclonedx\.json$/i.test(n)),
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
    const res = await fetch(`${SITE.githubReleasesApi}?per_page=50`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'meshchatx-site-build' },
    });
    if (res.ok) gh = (await res.json()) as GhRelease[];
  } catch {
    // offline build; the download page degrades to GitHub links
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
    });
  }
  memo = out;
  return out;
}

export async function latestForChannel(channel: Channel): Promise<Release | null> {
  const all = await getReleases();
  const hit = all.find((r) => r.channel === channel) ?? null;
  return hit ? preferCdn(hit) : null;
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
