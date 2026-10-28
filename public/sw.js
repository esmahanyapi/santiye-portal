/* Esmahan Portal PWA service worker
 * Intentionally does not cache HTML pages, API responses, auth sessions, or financial data.
 * The app requires an internet connection for portal functionality.
 */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Pass requests directly to the network; do not store private portal data offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request));
});
