/* MeshChatX site service worker.
 * Documents: network-first so connected visitors always get fresh content.
 * _astro hashed assets: cache-first, filenames are content-addressed.
 * Everything else same-origin GET: stale-while-revalidate.
 */
const CACHE = 'mcx-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('message', (e) => {
  if (e.data === 'skip') self.skipWaiting();
});

function isAsset(url) {
  return url.pathname.startsWith('/_astro/') ||
    /\.(?:woff2?|webp|png|jpe?g|svg|ico|css|js)$/.test(url.pathname);
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const clone = res.clone();
      caches.open(CACHE).then((c) => c.put(req, clone));
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    throw new Error('offline');
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) {
    const clone = res.clone();
    caches.open(CACHE).then((c) => c.put(req, clone));
  }
  return res;
}

async function staleWhileRevalidate(req) {
  const cached = await caches.match(req);
  const fresh = fetch(req)
    .then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(req, clone));
      }
      return res;
    })
    .catch(() => cached);
  return cached || fresh;
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    e.respondWith(networkFirst(request));
  } else if (isAsset(url)) {
    e.respondWith(cacheFirst(request));
  } else {
    e.respondWith(staleWhileRevalidate(request));
  }
});
