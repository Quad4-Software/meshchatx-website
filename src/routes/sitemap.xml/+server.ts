import { buildSitemapXml } from "$lib/seo";

export const prerender = true;

export function GET() {
  return new Response(buildSitemapXml(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
