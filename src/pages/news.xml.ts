import type { APIRoute } from 'astro';
import { SITE } from '../config/site';
import { getNews } from '../lib/news';

function xml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const GET: APIRoute = async () => {
  const posts = await getNews();
  const items = posts
    .map((p) => {
      const link = `${SITE.domain}/news#${encodeURIComponent(p.id)}`;
      return `    <item>
      <title>${xml(p.data.title)}</title>
      <link>${xml(link)}</link>
      <guid isPermaLink="false">${xml(p.id)}</guid>
      <pubDate>${p.data.date.toUTCString()}</pubDate>
      <description>${xml(p.data.description ?? '')}</description>
    </item>`;
    })
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>MeshChatX News</title>
    <link>${SITE.domain}/news</link>
    <description>MeshChatX announcements and site updates.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
};
