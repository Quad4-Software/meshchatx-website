import type { APIRoute } from 'astro';
import { SITE } from '../config/site';
import { getDocs, docSlug } from '../lib/docs';

export const GET: APIRoute = async () => {
  const docs = await getDocs();
  const en = docs.filter((d) => docSlug(d).locale === 'en');
  const body = [
    '# MeshChatX',
    '',
    '> MeshChatX is an all-in-one Reticulum client: LXMF messaging, LXST voice calls, NomadNet browsing, relay chat, maps, and Reticulum utilities. No central servers. Identity is a destination hash.',
    '',
    `Site: ${SITE.domain}`,
    `Source: ${SITE.githubUrl}`,
    '',
    '# Documentation',
    '',
    ...en.flatMap((d) => [`## ${d.data.title}`, '', (d.body ?? '').replace(/^---[\s\S]*?---/, '').trim(), '']),
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
