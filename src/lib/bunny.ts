import { SITE } from '../config/site';

export interface BunnyFile {
  name: string;
  path: string;
  url: string;
  sha256: string | null;
}

interface BunnyEntry {
  ObjectName?: string;
  IsDirectory?: boolean;
  Checksum?: string;
  DateCreated?: string;
  LastChanged?: string;
}

const TRACKS = ['release', 'testing', 'beta', 'nightly'] as const;
const TRACK_CHANNEL: Record<string, string> = {
  release: 'stable',
  testing: 'testing',
  nightly: 'testing',
  beta: 'beta',
  preview: 'beta',
};

function env(name: string, fallback = ''): string {
  const v = (typeof process !== 'undefined' && process.env && process.env[name]) || '';
  return (v || fallback).trim();
}

function cdnBase(): string {
  return env('BUNNY_CDN_BASE', SITE.cdnBase).replace(/\/+$/, '');
}

function storageZone(): string {
  return env('BUNNY_STORAGE_ZONE', 'quad4');
}

function storageEndpoint(): string {
  return env('BUNNY_STORAGE_ENDPOINT', 'https://ny.storage.bunnycdn.com').replace(/\/+$/, '');
}

function accessKey(): string {
  return env('BUNNY_STORAGE_ACCESS_KEY');
}

/** True when the Storage API key is present so listings can run. */
export function bunnyEnabled(): boolean {
  return accessKey() !== '' && storageZone() !== '' && cdnBase() !== '';
}

function normalizePath(path: string): string {
  const parts: string[] = [];
  for (const part of path.replace(/\\/g, '/').split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') return '';
    parts.push(part);
  }
  return parts.join('/');
}

function normalizeSha(raw: string | undefined): string | null {
  if (!raw) return null;
  const d = raw.trim();
  const prefixed = /^sha256:([a-f0-9]{64})$/i.exec(d);
  if (prefixed) return prefixed[1]!.toLowerCase();
  if (/^[a-f0-9]{64}$/i.test(d)) return d.toLowerCase();
  return null;
}

async function listDirectory(path: string): Promise<BunnyEntry[]> {
  const key = accessKey();
  const zone = storageZone();
  const endpoint = storageEndpoint();
  if (!key || !zone || !endpoint) return [];
  const relative = normalizePath(path);
  let url = `${endpoint}/${zone}/`;
  if (relative) url += `${relative}/`;
  try {
    const res = await fetch(url, {
      headers: {
        AccessKey: key,
        Accept: 'application/json',
        'User-Agent': 'meshchatx-website',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as BunnyEntry[]) : [];
  } catch {
    return [];
  }
}

let catalogMemo: Map<string, string> | null = null;

async function catalog(): Promise<Map<string, string>> {
  if (catalogMemo) return catalogMemo;
  const versions = new Map<string, string>();
  if (!bunnyEnabled()) {
    catalogMemo = versions;
    return versions;
  }
  const root = await listDirectory('');
  for (const entry of root) {
    const track = (entry.ObjectName || '').trim();
    if (!entry.IsDirectory || !track || track.startsWith('.')) continue;
    if (!TRACKS.includes(track as (typeof TRACKS)[number]) && !(track in TRACK_CHANNEL)) continue;
    const kids = await listDirectory(track);
    for (const child of kids) {
      const tag = (child.ObjectName || '').trim();
      if (!child.IsDirectory || !tag || tag.startsWith('.')) continue;
      versions.set(tag, `${track}/${tag}`);
    }
  }
  catalogMemo = versions;
  return versions;
}

function pathForTag(versions: Map<string, string>, tag: string): string | null {
  const t = tag.trim();
  if (!t) return null;
  if (versions.has(t)) return versions.get(t) ?? null;
  const bare = t.replace(/^v/i, '');
  for (const candidate of [t, `v${bare}`, bare]) {
    if (versions.has(candidate)) return versions.get(candidate) ?? null;
  }
  return null;
}

async function walkAssets(path: string): Promise<Map<string, BunnyFile>> {
  const base = cdnBase();
  const out = new Map<string, BunnyFile>();
  const queue = [normalizePath(path)];
  while (queue.length) {
    const dir = queue.shift();
    if (dir === undefined) continue;
    for (const entry of await listDirectory(dir)) {
      const name = (entry.ObjectName || '').trim();
      if (!name || name.startsWith('.')) continue;
      const childPath = dir === '' ? name : `${dir}/${name}`;
      if (entry.IsDirectory) {
        queue.push(childPath);
        continue;
      }
      out.set(name.toLowerCase(), {
        name,
        path: childPath,
        url: `${base}/${childPath}`,
        sha256: normalizeSha(entry.Checksum),
      });
    }
  }
  return out;
}

const assetsMemo = new Map<string, Map<string, BunnyFile>>();

/**
 * Flat map of Storage objects for a GitHub release tag, keyed by lowercase
 * basename. Empty when the key is unset or the tag is not on the zone.
 */
export async function bunnyAssetsByName(tag: string): Promise<Map<string, BunnyFile>> {
  if (!bunnyEnabled()) return new Map();
  const versions = await catalog();
  const path = pathForTag(versions, tag);
  if (!path) return new Map();
  const cached = assetsMemo.get(path);
  if (cached) return cached;
  const files = await walkAssets(path);
  assetsMemo.set(path, files);
  return files;
}
