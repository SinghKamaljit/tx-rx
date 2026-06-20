// TX_RX Service Worker — v1
const CACHE = 'txrx-v1';

// On install: cache the app shell (the page itself)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cache the root page relative to the SW scope
      const pageURL = self.registration.scope;
      return cache.add(pageURL).catch(() => {
        // If scope caching fails (e.g. during dev), continue silently
      });
    })
  );
  self.skipWaiting();
});

// On activate: remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first, fall back to cache for GET requests
self.addEventListener('fetch', e => {
  // Only handle GET — let POST/uploads pass straight through
  if (e.request.method !== 'GET') return;

  // Don't intercept Firebase or Cloudinary API calls
  const url = e.request.url;
  if (
    url.includes('firebasedatabase.app') ||
    url.includes('googleapis.com') ||
    url.includes('cloudinary.com') ||
    url.includes('gstatic.com')
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache fresh response for GitHub Pages assets
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
