import type { APIRoute } from 'astro';
import { getReleases } from '../../lib/releases';

export const GET: APIRoute = async () => {
  const releases = await getReleases();
  const versions: Record<string, { tag: string; version: string; publishedAt: string }[]> = {
    stable: [],
    beta: [],
    testing: [],
  };
  const out: Record<string, unknown> = { versions };
  for (const r of releases) {
    versions[r.channel]?.push({ tag: r.tag, version: r.version, publishedAt: r.publishedAt });
    if (!(r.channel in out)) {
      out[r.channel] = {
        tag: r.tag,
        version: r.version,
        name: r.name,
        publishedAt: r.publishedAt,
        prerelease: r.prerelease,
        releaseUrl: r.releaseUrl,
        downloads: r.downloads,
      };
    }
  }
  return new Response(JSON.stringify(out), {
    headers: { 'Content-Type': 'application/json' },
  });
};
