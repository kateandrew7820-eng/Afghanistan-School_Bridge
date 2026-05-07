/**
 * Service Worker for SchoolBridge
 * Enables offline functionality and aggressive caching
 * Optimizes for slow/unreliable internet connections
 * 
 * Cache Strategy:
 * - Static assets (JS, CSS): Cache with network fallback (fast loading)
 * - HTML: Network first with cache fallback (always get latest)
 * - API responses: Cache with network fallback (works offline)
 */

const CACHE_VERSION = 'v3';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;
const CACHE_API = `${CACHE_VERSION}-api`;

// Assets that should be cached on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.css',
];

/**
 * Install: Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch(() => {
          // Don't fail installation if some assets are missing
          console.log('[SW] Some static assets could not be cached');
        });
      })
      .then(() => {
        console.log('[SW] Service worker installed');
        return self.skipWaiting();
      })
  );
});

/**
 * Activate: Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('v') && !cacheName.startsWith(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch: Implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't cache requests from other origins (CORS)
  if (url.origin !== location.origin) {
    return;
  }

  // HTML: Network first (always try to get latest page)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response to cache it
          const clonedResponse = response.clone();
          caches.open(CACHE_DYNAMIC).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cached version if offline
          return caches.match(request)
            .then((response) => {
              if (response) {
                console.log('[SW] Serving cached page:', request.url);
                return response;
              }
              // Return offline page if available
              return caches.match('/index.html');
            });
        })
    );
    return;
  }

  // API calls: Cache with network fallback
  if (url.pathname.includes('/rest/v') || url.pathname.includes('/auth')) {
    event.respondWith(
      caches.open(CACHE_API)
        .then((cache) => {
          return cache.match(request)
            .then((response) => {
              // Try to fetch from network
              return fetch(request)
                .then((networkResponse) => {
                  // Cache the successful response
                  if (networkResponse.status < 400) {
                    cache.put(request, networkResponse.clone());
                  }
                  return networkResponse;
                })
                .catch(() => {
                  // Return cached response if network fails
                  if (response) {
                    console.log('[SW] Serving cached API response:', request.url);
                    return response;
                  }
                  // Return error response
                  return new Response('API unavailable', { status: 503 });
                });
            });
        })
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images): Cache first with network fallback
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.open(CACHE_STATIC)
        .then((cache) => {
          return cache.match(request)
            .then((response) => {
              if (response) {
                // Check for updates in background
                fetch(request).then((networkResponse) => {
                  if (networkResponse.status < 400) {
                    cache.put(request, networkResponse);
                  }
                });
                return response;
              }
              // Not in cache, fetch from network
              return fetch(request)
                .then((networkResponse) => {
                  // Cache successful static assets
                  if (networkResponse.status < 400) {
                    cache.put(request, networkResponse.clone());
                  }
                  return networkResponse;
                })
                .catch((error) => {
                  console.error('[SW] Fetch failed for:', request.url, error);
                  // Graceful fallback for missing assets
                  return new Response('Asset not available', { status: 404 });
                });
            });
        })
    );
    return;
  }

  // Default: Network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status < 400) {
          caches.open(CACHE_DYNAMIC).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then((response) => {
            if (response) {
              console.log('[SW] Serving cached response:', request.url);
              return response;
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
