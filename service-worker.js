/* Soil-IQ's installable PUBLIC UI fallback. No offline scientific or farm data. */
const CACHE_NAME = 'soil-iq-ui-shell-v1';
const CACHE_PREFIX = 'soil-iq-ui-shell-';
const SHELL_FILES = Object.freeze([
  '/pwa/offline.html',
  '/pwa/install.css',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png',
]);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // External NASA APIs, every private evidence/farm endpoint and all live
  // science modules remain network-only. The worker NEVER fabricates values.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    // Never replay a stale crop-rotation dashboard as if it were a live session.
    event.respondWith(fetch(request).catch(() => caches.match('/pwa/offline.html')));
    return;
  }

  if (SHELL_FILES.includes(url.pathname)) {
    event.respondWith(caches.match(request).then(hit => hit || fetch(request)));
  }
});
