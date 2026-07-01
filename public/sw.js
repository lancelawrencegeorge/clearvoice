// Self-destructing service worker.
// The browser automatically checks for updates to /sw.js on every navigation.
// When it fetches this file and sees new content, it installs this new SW,
// which immediately clears all caches, unregisters itself, and reloads all clients.
// This breaks through the old SW's cache even in PWA mode.

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      if ('caches' in self) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if ('caches' in self) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
      await self.clients.claim();
    })()
  );
});

// Pass-through: never serve from cache, always go to network.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
