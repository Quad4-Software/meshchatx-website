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
  const posts = getNews();
  const items = posts
    .map((p) => {
      const link = `${SITE.domain}/news#${encodeURIComponent(p.slug)}`;
      const desc = xml(p.description || p.body.slice(0, 280));
      return `    <item>
      <title>${xml(p.title)}</title>
      <link>${xml(link)}</link>
      <guid isPermaLink="false">${xml(p.slug)}</guid>
      <pubDate>${p.date.toUTCString()}</pubDate>
      <description>${desc}</description>
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
