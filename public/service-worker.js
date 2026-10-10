// Retired app worker. Replaced by /sw.js; this removes the old registration.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) =>
  event.waitUntil((async () => {
    try {
      const names = await caches.keys();
      await Promise.allSettled(names
        .filter((name) => name.startsWith('schoolbridge-') || /^v\d+-(static|dynamic|api)$/.test(name))
        .map((name) => caches.delete(name)));
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: 'window' });
      await Promise.allSettled(clients.map((client) => client.navigate(client.url)));
    } finally {
      await self.registration.unregister();
    }
  })()),
);
