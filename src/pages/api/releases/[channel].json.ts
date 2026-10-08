import type { APIRoute, GetStaticPaths } from 'astro';
import { getReleases, type Channel } from '../../../lib/releases';

export const getStaticPaths: GetStaticPaths = () =>
  (['stable', 'beta', 'testing'] as const).map((channel) => ({ params: { channel } }));

export const GET: APIRoute = async ({ params }) => {
  const channel = params.channel as Channel;
  const releases = (await getReleases()).filter((r) => r.channel === channel);
  return new Response(JSON.stringify({ channel, releases }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
