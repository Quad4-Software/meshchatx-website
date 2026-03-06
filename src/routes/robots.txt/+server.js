import { site } from '$lib/config.js';

/** @type {import('@sveltejs/kit').RequestHandler} */
export function GET() {
  const body = `User-agent: *
Allow: /

Sitemap: ${site.url}/sitemap.xml
`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'max-age=3600'
    }
  });
}
