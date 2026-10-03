import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface NewsPost {
  slug: string;
  title: string;
  date: Date;
  author: string;
  description: string;
  body: string;
}

const DIR = join(process.cwd(), 'src/content/news');

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  if (!raw.startsWith('---')) return { data: {}, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end < 0) return { data: {}, body: raw };
  const block = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\n/, '');
  const data: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    data[k] = v;
  }
  return { data, body };
}

/** Markdown news posts in src/content/news. Empty until the first post lands. */
export function getNews(): NewsPost[] {
  if (!existsSync(DIR)) return [];
  const posts: NewsPost[] = [];
  for (const name of readdirSync(DIR)) {
    if (!name.endsWith('.md')) continue;
    const raw = readFileSync(join(DIR, name), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const slug = name.replace(/\.md$/, '');
    const title = data.title || slug;
    const date = data.date ? new Date(data.date) : new Date(0);
    posts.push({
      slug,
      title,
      date,
      author: data.author || '',
      description: data.description || '',
      body,
    });
  }
  posts.sort((a, b) => b.date.getTime() - a.date.getTime());
  return posts;
}
