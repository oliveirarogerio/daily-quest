const CACHE_NAME = 'daily-quest-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const ASSETS_CACHE = 'assets-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

const CACHE_STRATEGIES = {
  staticFirst: async (request) => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      return new Response('Network error happened', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  },

  networkFirst: async (request) => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) return cachedResponse;

      return new Response('Network error happened', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![STATIC_CACHE, DYNAMIC_CACHE, ASSETS_CACHE].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle API calls
  if (request.url.includes('/api/')) {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }

  // Handle static assets
  if (request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/)) {
    event.respondWith(CACHE_STRATEGIES.staticFirst(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }

  // Default strategy
  event.respondWith(CACHE_STRATEGIES.staticFirst(request));
});

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-quests') {
    event.waitUntil(syncQuests());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Quests',
        icon: '/icons/checkmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Daily Quest', options)
  );
});
