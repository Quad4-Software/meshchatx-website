import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Release } from './releases';

export interface TorrentMeta {
  tag: string;
  magnet: string;
  torrent: string;
}

function torrentDir(): string {
  return join(process.cwd(), 'public', 'torrents');
}

/** Sidecars written next to .torrent files by make-release-torrent.py. */
export function loadLocalTorrents(): Map<string, TorrentMeta> {
  const out = new Map<string, TorrentMeta>();
  let names: string[] = [];
  try {
    names = readdirSync(torrentDir());
  } catch {
    return out;
  }
  for (const name of names) {
    if (!name.endsWith('.json')) continue;
    try {
      const raw = JSON.parse(readFileSync(join(torrentDir(), name), 'utf8')) as TorrentMeta;
      if (raw.tag && raw.magnet && raw.torrent) out.set(raw.tag, raw);
    } catch {
      continue;
    }
  }
  return out;
}

export function attachLocalTorrent(release: Release, local: Map<string, TorrentMeta>): void {
  const meta = local.get(release.tag);
  if (!meta) return;
  const url = `/torrents/${meta.torrent}`;
  const existing = release.downloads.torrent;
  if (existing) {
    if (existing.name === meta.torrent) existing.magnet = meta.magnet;
    return;
  }
  release.downloads.torrent = {
    name: meta.torrent,
    url,
    githubUrl: url,
    sha256: null,
    magnet: meta.magnet,
  };
}

// Minimal bdecode returning strings for byte fields, numbers for ints.
type BVal = string | number | BVal[] | Map<string, BVal>;

function bdecode(buf: Buffer): { value: BVal; next: number } {
  let i = 0;
  function parse(): BVal {
    const c = buf[i];
    if (c === 0x69) {
      const j = buf.indexOf(0x65, i); // 'e'
      const n = Number(buf.toString('utf8', i + 1, j));
      i = j + 1;
      return n;
    }
    if (c === 0x6c) {
      i++;
      const out: BVal[] = [];
      while (buf[i] !== 0x65) out.push(parse());
      i++;
      return out;
    }
    if (c === 0x64) {
      i++;
      const out = new Map<string, BVal>();
      while (buf[i] !== 0x65) out.set(parse() as string, parse());
      i++;
      return out;
    }
    const j = buf.indexOf(0x3a, i); // ':'
    const n = Number(buf.toString('utf8', i, j));
    i = j + 1;
    const s = buf.toString('utf8', i, i + n);
    i += n;
    return s;
  }
  const value = parse();
  return { value, next: i };
}

function flatStrings(v: BVal | undefined): string[] {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(flatStrings);
  return [];
}

/**
 * Derive a magnet URI from a .torrent payload without downloading any
 * release files: hash the raw info dict, then carry over its trackers and
 * GetRight webseeds.
 */
export function magnetFromTorrent(buf: Buffer, dn: string): string | null {
  if (buf[0] !== 0x64) return null;
  let hash = '';
  let trackers: string[] = [];
  let webseeds: string[] = [];
  let i = 1;
  while (i < buf.length && buf[i] !== 0x65) {
    const k = bdecode(buf.subarray(i));
    i += k.next;
    const start = i;
    const v = bdecode(buf.subarray(i));
    i += v.next;
    switch (k.value) {
      case 'info':
        hash = createHash('sha1').update(buf.subarray(start, i)).digest('hex');
        break;
      case 'announce':
        if (typeof v.value === 'string') trackers.push(v.value);
        break;
      case 'announce-list':
        trackers = trackers.concat(flatStrings(v.value));
        break;
      case 'url-list':
        webseeds = flatStrings(v.value);
        break;
    }
  }
  if (!hash) return null;
  const parts = [`xt=urn:btih:${hash}`, `dn=${encodeURIComponent(dn)}`];
  for (const tr of new Set(trackers)) parts.push(`tr=${encodeURIComponent(tr)}`);
  for (const ws of webseeds) parts.push(`ws=${encodeURIComponent(ws)}`);
  return `magnet:?${parts.join('&')}`;
}

/**
 * Fetch each .torrent asset that lacks a magnet and derive one from it, so
 * the copy-magnet button works even without the API's live refresh.
 */
export async function attachTorrentMagnets(releases: Release[]): Promise<void> {
  const jobs = releases
    .filter((r) => r.downloads.torrent && !r.downloads.torrent.magnet)
    .map(async (r) => {
      const t = r.downloads.torrent;
      if (!t) return;
      const url = t.cdnUrl || t.githubUrl || t.url;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) return;
        const mag = magnetFromTorrent(Buffer.from(await res.arrayBuffer()), `MeshChatX-${r.tag}`);
        if (mag) t.magnet = mag;
      } catch {
        // best effort; the API backfills magnets at runtime
      }
    });
  await Promise.all(jobs);
}
