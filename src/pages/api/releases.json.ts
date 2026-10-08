import type { APIRoute } from 'astro';
import { getReleases, type Channel, type Release } from '../../lib/releases';

// Bakes the payload the site API used to serve live. The edge app maps
// /api/releases onto this file; freshness now tracks the build.
export const GET: APIRoute = async () => {
  const releases = await getReleases();
  // An empty payload would render the download page hollow; fail the build
  // instead of shipping it. Set MCX_ALLOW_EMPTY_RELEASES=1 to opt out.
  if (!releases.length && process.env.MCX_ALLOW_EMPTY_RELEASES !== '1') {
    throw new Error('release fetch returned zero releases; refusing to emit an empty API');
  }
  const channels: Record<Channel, Release[]> = { stable: [], beta: [], testing: [] };
  for (const r of releases) channels[r.channel]?.push(r);
  return new Response(
    JSON.stringify({
      channels,
      stable: channels.stable[0] ?? null,
      beta: channels.beta[0] ?? null,
      testing: channels.testing[0] ?? null,
      count: releases.length,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};
