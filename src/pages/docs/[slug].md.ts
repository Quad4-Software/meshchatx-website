import type { APIRoute, GetStaticPaths } from 'astro';
import { getDocs, docSlug } from '../../lib/docs';

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getDocs();
  return docs
    .filter((d) => docSlug(d).locale === 'en')
    .map((d) => ({ params: { slug: docSlug(d).slug }, props: { doc: d } }));
};

export const GET: APIRoute = ({ props }) => {
  const doc = (props as { doc: { body?: string; data: { title: string } } }).doc;
  const body = `# ${doc.data.title}\n\n${(doc.body ?? '').replace(/^---[\s\S]*?---/, '').trim()}\n`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `inline; filename="${doc.data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md"`,
    },
  });
};
