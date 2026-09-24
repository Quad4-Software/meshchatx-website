import { SITE } from '../config/site';

export interface ChangelogEntry {
  version: string;
  date: string;
  anchor: string;
  body: string;
  unreleased: boolean;
}

let memo: ChangelogEntry[] | null = null;

export async function getChangelog(): Promise<ChangelogEntry[]> {
  if (memo) return memo;
  let md = '';
  try {
    const res = await fetch(SITE.githubChangelogRaw, {
      headers: { 'User-Agent': 'meshchatx-site-build' },
    });
    if (res.ok) md = await res.text();
  } catch {
    // offline build
  }

  const entries: ChangelogEntry[] = [];
  const re = /^##\s+\[?([^\]\s]+)\]?(?:\s*-\s*(.+?))?\s*$/gm;
  const heads = [...md.matchAll(re)];
  for (let i = 0; i < heads.length; i++) {
    const m = heads[i];
    if (!m) continue;
    const version = m[1] ?? '';
    const date = (m[2] ?? '').trim();
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < heads.length ? (heads[i + 1]?.index ?? md.length) : md.length;
    const body = md.slice(start, end).trim();
    const unreleased = /unreleased/i.test(version);
    entries.push({
      version,
      date,
      anchor: `v-${version.replace(/[^\w.-]+/g, '-').toLowerCase()}`,
      body,
      unreleased,
    });
  }
  memo = entries;
  return entries;
}
