const VERSION = @json($version);
const PRECACHE = @json($precache);
const OFFLINE_URL = @json($offlineUrl);
const SHELL_CACHE = 'mcx-shell-' + VERSION;
const PAGE_CACHE = 'mcx-pages-' + VERSION;
const PAGE_PATH =
    /^\/(?:(?:de|ru|it|zh)\/)?(?:$|docs(?:\/[a-z0-9\-]+)?\/?$|interfaces\/?$|changelog\/?$|offline\/?$)/;

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(SHELL_CACHE);
            await Promise.all(
                PRECACHE.map(async (url) => {
                    try {
                        await cache.add(url);
                    } catch (error) {
                        // Skip missing assets so install still completes.
                    }
                }),
            );
            await self.skipWaiting();
        })(),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((key) => key.startsWith('mcx-') && key !== SHELL_CACHE && key !== PAGE_CACHE)
                    .map((key) => caches.delete(key)),
            );
            await self.clients.claim();
            const clients = await self.clients.matchAll({ type: 'window' });
            for (const client of clients) {
                client.postMessage({ type: 'MCX_SW_ACTIVATED', version: VERSION });
            }
        })(),
    );
});

self.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') {
        return;
    }
    if (data.type === 'MCX_SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) {
        return;
    }

    if (
        url.pathname === '/sw.js' ||
        url.pathname.startsWith('/api/') ||
        url.pathname === '/sitemap.xml' ||
        url.pathname === '/changelog.xml' ||
        url.pathname === '/robots.txt' ||
        url.pathname === '/llms.txt' ||
        url.pathname === '/llms-full.txt' ||
        url.pathname === '/docs/llms.txt' ||
        url.pathname.startsWith('/docs/export-all/') ||
        /\/docs\/[^/]+\.md$/.test(url.pathname) ||
        /\/docs\/[^/]+\/export\//.test(url.pathname)
    ) {
        return;
    }

    if (isNavigationRequest(request)) {
        event.respondWith(handleNavigation(request, url));
        return;
    }

    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request));
    }
});

function isNavigationRequest(request) {
    if (request.mode === 'navigate') {
        return true;
    }
    const accept = request.headers.get('accept') || '';
    return accept.includes('text/html');
}

function isStaticAsset(pathname) {
    return (
        pathname.startsWith('/build/') ||
        pathname === '/theme-boot.js' ||
        pathname === '/manifest.webmanifest' ||
        pathname === '/favicon.ico' ||
        pathname === '/favicon.webp' ||
        pathname === '/logo.webp' ||
        pathname === '/logo-navbar.webp' ||
        pathname.startsWith('/showcase/') ||
        pathname.startsWith('/media/')
    );
}

async function handleNavigation(request, url) {
    const offlineResponse = async () => {
        const cachedOffline = await caches.match(OFFLINE_URL);
        return cachedOffline || Response.error();
    };

    if (!PAGE_PATH.test(url.pathname)) {
        try {
            return await fetch(request);
        } catch {
            return offlineResponse();
        }
    }

    try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
            const cache = await caches.open(PAGE_CACHE);
            cache.put(request, fresh.clone());
        }
        return fresh;
    } catch {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        const shellHit = await caches.match(url.pathname);
        if (shellHit) {
            return shellHit;
        }
        return offlineResponse();
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
            const cache = await caches.open(SHELL_CACHE);
            cache.put(request, fresh.clone());
        }
        return fresh;
    } catch {
        return Response.error();
    }
}
