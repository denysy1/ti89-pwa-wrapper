const CACHE_NAME = 'ti89-calculator-v1';
const STATIC_RESOURCES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './favicon.ico'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_RESOURCES))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Return cached version or fetch from network
          return response || fetch(event.request);
        })
        .catch(() => {
          // If both cache and network fail, return the main page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        })
    );
  }
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
