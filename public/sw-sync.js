// Imported by the generated /sw.js: relays background sync to open tabs.
self.addEventListener('sync', (event) => {
  if (!['schoolbridge-submissions', 'schoolbridge-chat-messages'].includes(event.tag)) return;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) client.postMessage({ type: 'SCHOOLBRIDGE_SYNC_REQUESTED' });
  })());
});
