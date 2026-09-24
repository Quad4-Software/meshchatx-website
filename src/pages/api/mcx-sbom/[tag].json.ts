import type { APIRoute, GetStaticPaths } from 'astro';
import { getReleases } from '../../../lib/releases';

export const getStaticPaths: GetStaticPaths = async () => {
  const releases = await getReleases();
  return releases
    .filter((r) => r.downloads.sbom)
    .map((r) => ({ params: { tag: r.tag } }));
};

export const GET: APIRoute = async ({ params }) => {
  const releases = await getReleases();
  const rel = releases.find((r) => r.tag === params.tag && r.downloads.sbom);
  if (!rel?.downloads.sbom) {
    return new Response(JSON.stringify({ error: 'no sbom for this version' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const res = await fetch(rel.downloads.sbom.url);
    if (!res.ok) throw new Error(String(res.status));
    const sbom = await res.json();
    return new Response(JSON.stringify(sbom), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'sbom fetch failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
