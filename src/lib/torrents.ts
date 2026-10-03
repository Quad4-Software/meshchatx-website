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
