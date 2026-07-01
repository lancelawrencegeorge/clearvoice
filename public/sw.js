// Self-destructing service worker (v3).
// The browser checks this file for updates on every navigation (bypassing
// the old SW's fetch handler). When it finds new content, it installs this
// SW which clears all caches, reloads clients, then unregisters itself.

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

      // 3. Tell all open clients to hard-reload
      const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
      clients.forEach((client) => {
        client.postMessage({ type: 'FORCE_RELOAD' });
      });

      // 4. Unregister this SW so it doesn't re-activate
      await self.registration.unregister();
    })()
  );
});

// Network-only: never serve from cache.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
