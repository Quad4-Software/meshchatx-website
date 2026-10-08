import type { APIRoute } from 'astro';
import { SITE } from '../config/site';

export const GET: APIRoute = async () => {
  const body = `# MeshChatX

> MeshChatX is an all-in-one Reticulum client: LXMF messaging, LXST voice calls, NomadNet browsing, relay chat, maps, and Reticulum utilities. No central servers. Identity is a destination hash.

## Pages

- [Home](${SITE.domain}/)
- [Download](${SITE.domain}/download) - installers and packages per channel
- [Docs](${SITE.domain}/docs) - user documentation mirrored from the app
- [Roadmap](${SITE.domain}/roadmap)
- [Changelog](${SITE.domain}/changelog)
- [News](${SITE.domain}/news) - announcements ([RSS](${SITE.domain}/news.xml))
- [Interfaces](${SITE.domain}/interfaces) - public Reticulum interface directory
- [Branding](${SITE.domain}/branding)
- [Contact](${SITE.domain}/contact)
- [Donate](${SITE.domain}/donate)
- [License](${SITE.domain}/license)
- [Privacy](${SITE.domain}/privacy)
- [Git mirrors](${SITE.domain}/git)
- [Legacy](${SITE.domain}/legacy) - text-only page for old browsers and no JavaScript

## APIs

- ${SITE.domain}/api/mcx-releases - releases per channel with download URLs
- ${SITE.domain}/api/mcx-interfaces - cached interface directory

## Source

- Canonical: rngit over Reticulum at ${SITE.rngitRns}
- GitHub mirror: ${SITE.githubUrl}
- CodeFloe mirror: ${SITE.codefloeUrl}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
