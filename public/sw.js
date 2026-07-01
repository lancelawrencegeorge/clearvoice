// Self-destructing service worker.
// This replaces the old SW that was caching the stale bundle.
// It clears all caches, unregisters itself, and forces all clients to reload.
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async function () {
      // Clear all caches
      var keys = await caches.keys();
      await Promise.all(keys.map(function (k) { return caches.delete(k); }));
      // Unregister this service worker
      await self.registration.unregister();
      // Force all open clients to reload with cache bypass
      var clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(function (client) {
        client.navigate(client.url);
      });
    })()
  );
});

// Pass-through fetch — never serve from cache
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
