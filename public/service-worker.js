const CACHE_PREFIX = 'schoolbridge-';
const PRECACHE_MANIFEST = '/precache-manifest.json';
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-v1`;
const FONT_CACHE = `${CACHE_PREFIX}fonts-v1`;
const MAX_RUNTIME_ENTRIES = 80;
const FONT_STYLESHEET_URL = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&family=Montserrat:wght@600;700&display=swap';

async function cacheFont(url, cache, readText = false) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Font asset request failed: ${response.status}`);
    await cache.put(url, response.clone());
    return readText ? await response.text() : undefined;
  } finally {
    clearTimeout(timeout);
  }
}

async function precacheFonts() {
  try {
    const cache = await caches.open(FONT_CACHE);
    const css = await cacheFont(FONT_STYLESHEET_URL, cache, true);
    if (!css) throw new Error('Font stylesheet was empty.');
    const fontUrls = [...new Set(
      [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((match) => match[1])
    )];
    const results = await Promise.allSettled(fontUrls.map((url) => cacheFont(url, cache)));
    const failures = results.filter((result) => result.status === 'rejected').length;
    if (failures) console.warn(`${failures} optional font files could not be precached.`);
  } catch (error) {
    console.warn('Some optional web fonts could not be precached:', error);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const response = await fetch(PRECACHE_MANIFEST, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Precache manifest request failed: ${response.status}`);
    const manifest = await response.clone().json();
    const cache = await caches.open(`${CACHE_PREFIX}static-${manifest.version}`);
    await cache.addAll(manifest.assets);
    await cache.put(PRECACHE_MANIFEST, response);
    await precacheFonts();
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    let activeStaticCache = null;
    const staticNames = names.filter((cacheName) => cacheName.startsWith(`${CACHE_PREFIX}static-`));
    for (const name of staticNames) {
      const manifestResponse = await (await caches.open(name)).match(PRECACHE_MANIFEST);
      if (!manifestResponse) continue;
      const manifest = await manifestResponse.json();
      if (name === `${CACHE_PREFIX}static-${manifest.version}`) activeStaticCache = name;
    }
    const previousStaticCache = [...staticNames].reverse().find((name) => name !== activeStaticCache);
    await Promise.all(names
      .filter((name) => (
        (name.startsWith(CACHE_PREFIX) &&
          ![RUNTIME_CACHE, FONT_CACHE, activeStaticCache, previousStaticCache].includes(name)) ||
        /^v\d+-(static|dynamic|api)$/.test(name)
      ))
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
      return response;
    }
    if (response.status < 500) return response;
    const cached = await caches.match(request) || await caches.match(fallbackUrl);
    if (cached) return cached;
    return response;
  } catch {
    const cached = await caches.match(request) || await caches.match(fallbackUrl);
    if (cached) return cached;
    throw new Error('The requested page is unavailable offline.');
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
    await trimCache(cache, MAX_RUNTIME_ENTRIES);
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const update = fetch(request).then(async (response) => {
    if (response.ok || response.type === 'opaque') {
      await cache.put(request, response.clone());
      await trimCache(cache, MAX_RUNTIME_ENTRIES);
    }
    return response;
  });
  if (cached) {
    void update.catch(() => {});
    return cached;
  }
  return update;
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
      event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    }
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/index.html'));
    return;
  }

  if (url.pathname === '/manifest.json' ||
      url.pathname.startsWith('/assets/') ||
      /\.(?:woff2?|ttf|otf|svg|png|jpe?g|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag !== 'schoolbridge-submissions') return;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage({ type: 'SCHOOLBRIDGE_SYNC_REQUESTED' });
    }
  })());
});
