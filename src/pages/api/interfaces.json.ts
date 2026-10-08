import type { APIRoute } from 'astro';
import { getInterfaces } from '../../lib/interfaces';

// Same shape the site API served for /api/interfaces; the edge app maps the
// extensionless path onto this baked file.
export const GET: APIRoute = async () => {
  const payload = await getInterfaces();
  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
};
