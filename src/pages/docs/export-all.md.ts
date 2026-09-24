import type { APIRoute } from 'astro';
import { getDocs, docSlug } from '../../lib/docs';
import { DOCS_GROUPS } from '../../config/site';

export const GET: APIRoute = async () => {
  const docs = await getDocs();
  const bySlug = new Map(
    docs.filter((d) => docSlug(d).locale === 'en').map((d) => [docSlug(d).slug, d]),
  );
  const parts = ['# MeshChatX Documentation'];
  for (const g of DOCS_GROUPS) {
    for (const slug of g.items) {
      const d = bySlug.get(slug);
      if (!d) continue;
      parts.push(`\n---\n\n## ${d.data.title}\n\n${(d.body ?? '').replace(/^---[\s\S]*?---/, '').trim()}`);
    }
  }
  return new Response(parts.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'inline; filename="meshchatx-docs.md"',
    },
  });
};
