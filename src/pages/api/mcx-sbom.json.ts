import type { APIRoute } from 'astro';
import { getReleases } from '../../lib/releases';

export const GET: APIRoute = async () => {
  const releases = await getReleases();
  const versions = releases
    .filter((r) => r.downloads.sbom)
    .map((r) => ({
      version: r.version,
      tag: r.tag,
      channel: r.channel,
      publishedAt: r.publishedAt,
      releaseUrl: r.releaseUrl,
      sbomUrl: r.downloads.sbom!.url,
    }));
  return new Response(JSON.stringify({ versions }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
