import type { APIRoute } from 'astro';
import { getInterfaces } from '../../lib/interfaces';

export const GET: APIRoute = async () => {
  const { items, fetchedAt } = await getInterfaces();
  return new Response(JSON.stringify({ fetchedAt, count: items.length, entries: items }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
