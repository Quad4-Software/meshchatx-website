import type { APIRoute } from 'astro';
import { SITE, DOCS_GROUPS } from '../../config/site';
import { getDocs, docSlug } from '../../lib/docs';

export const GET: APIRoute = async () => {
  const docs = await getDocs();
  const bySlug = new Map(
    docs.filter((d) => docSlug(d).locale === 'en').map((d) => [docSlug(d).slug, d]),
  );
  const lines = ['# MeshChatX Documentation', ''];
  for (const g of DOCS_GROUPS) {
    lines.push(`## ${g.labelKey.split('.').pop()}`);
    for (const slug of g.items) {
      const d = bySlug.get(slug);
      if (d) lines.push(`- [${d.data.title}](${SITE.domain}/docs/${slug})`);
    }
    lines.push('');
  }
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
