import type { APIRoute } from 'astro';
import { getReleases, type Channel, type Release } from '../../lib/releases';

// Bakes the payload the site API used to serve live. The edge app maps
// /api/releases onto this file; freshness now tracks the build.
export const GET: APIRoute = async () => {
  const releases = await getReleases();
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
