import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { SITE } from '../config/site';

export interface GitStamp {
  author: string;
  iso: string;
  date: string;
}

const cache = new Map<string, GitStamp | null>();

function stampFrom(repo: string, rel: string): GitStamp | null {
  const file = join(repo, rel);
  if (!existsSync(file)) return null;
  try {
    const out = execFileSync(
      'git',
      ['-C', repo, 'log', '-1', '--format=%an%x09%aI', '--', rel],
      { encoding: 'utf8', timeout: 4000 },
    ).trim();
    if (!out) return null;
    const [author, iso] = out.split('\t');
    if (!author || !iso) return null;
    const date = new Date(iso).toLocaleDateString('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return { author, iso, date };
  } catch {
    return null;
  }
}

/**
 * Last git commit that touched a docs page, plus author.
 * Prefers the app repo docs tree (MCX_APP_REPO, else a sibling checkout named
 * after the app repo), else the website copy.
 */
export function docsGitStamp(slug: string): GitStamp | null {
  const key = slug;
  if (cache.has(key)) return cache.get(key) ?? null;
  const website = process.cwd();
  const appDir = SITE.githubRepo.split('/').pop()?.toLowerCase() ?? '';
  const mesh = process.env.MCX_APP_REPO?.trim()
    ? resolve(process.env.MCX_APP_REPO)
    : resolve(website, `../../${appDir}`);
  const candidates: [string, string][] = [
    [mesh, `docs/en/${slug}.md`],
    [mesh, `${appDir}/src/frontend/public/${appDir}-docs/en/${slug}.md`],
    [website, `src/content/docs/en/${slug}.md`],
  ];
  let best: GitStamp | null = null;
  for (const [repo, rel] of candidates) {
    const s = stampFrom(repo, rel);
    if (!s) continue;
    if (!best || s.iso > best.iso) best = s;
  }
  cache.set(key, best);
  return best;
}
