// Self-destructing service worker (v2).
// Fixes activation timing: claim clients and reload BEFORE unregistering.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Take control of all clients immediately
      await self.clients.claim();

      // 2. Clear ALL caches
      if ('caches' in self) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      // 3. Tell all open clients to hard-reload (postMessage is more reliable than navigate)
      const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
      clients.forEach((client) => {
        client.postMessage({ type: 'FORCE_RELOAD' });
      });

      // 4. Also try clients.navigate as a fallback
      clients.forEach((client) => {
        try { client.navigate(client.url); } catch (e) {}
      });

      // 5. Now unregister — after reload is already triggered
      await self.registration.unregister();
    })()
  );
});

// Network-only: never serve from cache.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
