/**
 * Kill-switch service worker.
 *
 * The previous SW cached index.html aggressively and trapped browsers on
 * stale HTML that referenced Vite chunks which no longer exist on the
 * server, causing a white-screen / "Cannot read properties of null" crash.
 *
 * This replacement worker takes over the same scope on first load, deletes
 * the old caches it owned, navigates open clients to a fresh HTML, and
 * unregisters itself. After one visit, the bad SW is fully evicted.
 */

function isOurOldCache(name) {
  // The old SW used names like 'v3-static', 'v3-dynamic', 'v3-api'.
  return /^v\d+-(static|dynamic|api)$/.test(name);
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const names = await caches.keys();
        await Promise.allSettled(
          names.filter(isOurOldCache).map((n) => caches.delete(n))
        );
        await self.clients.claim();
        const clients = await self.clients.matchAll({ type: 'window' });
        await Promise.allSettled(clients.map((c) => c.navigate(c.url)));
      } finally {
        await self.registration.unregister();
      }
    })()
  );
});

// Network-only passthrough while we're alive; never serve cached HTML.
self.addEventListener('fetch', () => {
  // no-op: let the browser handle it normally
});
