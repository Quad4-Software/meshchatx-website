import type { APIRoute } from 'astro';
import { SITE } from '../config/site';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: SITE.name,
      short_name: SITE.name,
      description: `${SITE.name} site: docs, download, roadmap, interfaces, and product pages. Works offline for visited pages except Dependencies.`,
      theme_color: '#fafafa',
      background_color: '#09090b',
      display: 'standalone',
      orientation: 'any',
      scope: '/',
      start_url: '/',
      id: '/',
      lang: 'en',
      categories: ['utilities', 'developer'],
      icons: [
        { src: '/logo.webp', sizes: '800x800', type: 'image/webp', purpose: 'any' },
        { src: '/logo.webp', sizes: '512x512', type: 'image/webp', purpose: 'maskable' },
        { src: '/favicon.webp', sizes: '32x32', type: 'image/webp', purpose: 'any' },
      ],
      shortcuts: [
        {
          name: 'Download',
          short_name: 'Download',
          url: '/download',
          icons: [{ src: '/logo.webp', sizes: '800x800', type: 'image/webp' }],
        },
        {
          name: 'Docs',
          short_name: 'Docs',
          url: '/docs/overview',
          icons: [{ src: '/logo.webp', sizes: '800x800', type: 'image/webp' }],
        },
        {
          name: 'Interfaces',
          short_name: 'Interfaces',
          url: '/interfaces',
          icons: [{ src: '/logo.webp', sizes: '800x800', type: 'image/webp' }],
        },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
