// Self-destructing service worker — v2 with a new filename.
// The old SW had '/sw.js' cached, so it intercepted the fetch and served
// its own old version, preventing this new SW from ever installing.
// Using a new path ('/sw-killer.js') guarantees the old SW doesn't have
// it cached, so the browser fetches this file from the network.

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async function () {
      // Clear ALL caches
      var keys = await caches.keys();
      await Promise.all(keys.map(function (k) { return caches.delete(k); }));

      // Unregister ALL service workers (including the old one)
      await self.registration.unregister();

      // Tell ALL open clients to do a hard reload (bypass cache)
      var clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(function (client) {
        client.navigate(client.url);
      });
    })()
  );
});

// Pass-through fetch — never serve from cache, always go to network
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
