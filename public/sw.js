// Self-unregistering service worker — clears stale caches from previous versions
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    self.registration.unregister().then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', () => {});
