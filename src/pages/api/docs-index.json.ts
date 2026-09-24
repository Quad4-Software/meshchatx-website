import type { APIRoute } from 'astro';
import { getDocs, docSlug } from '../../lib/docs';

function stripMd(md: string): string {
  return md
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const GET: APIRoute = async () => {
  const docs = await getDocs();
  const items = docs
    .filter((d) => docSlug(d).locale === 'en')
    .map((d) => ({
      slug: docSlug(d).slug,
      title: d.data.title,
      text: stripMd(d.body ?? '').slice(0, 4000),
    }));
  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json' },
  });
};
