import { site } from '$lib/config.js';

const pages = ['', '/donate', '/download', '/contact', '/license'];

/** @type {import('@sveltejs/kit').RequestHandler} */
export function GET() {
  const base = site.url.replace(/\/$/, '');
  const urls = pages.map((path) => ({ loc: `${base}${path ? '/' + path.replace(/^\//, '') : ''}`, priority: path ? '0.8' : '1.0' }));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ loc, priority }) => `  <url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>${priority}</priority></url>`).join('\n')}
</urlset>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600'
    }
  });
}
