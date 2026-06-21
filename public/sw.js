/* ==========================================================================
   MODIVAH BRECHÓ - SECURE HIGH-PERFORMANCE SERVICE WORKER
   ========================================================================== */

const APP_VERSION = "2.3.1";
const BUILD_TIME = "2026-06-21T09:00:00Z";
const CATALOG_VERSION = "cat_v2.3.1";
const CACHE_VERSION = "c_2.3.1";

const CACHE_NAME = `modivah-cache-v${APP_VERSION}`;

// Pre-match assets that do not change hashes
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use silent addAll ignore strategy to prevent install crash if an asset fails to fetch
      return Promise.allSettled(
        PRECACHE_ASSETS.map(asset => 
          fetch(asset, { cache: 'no-store' })
            .then(res => {
              if (res.ok) return cache.put(asset, res);
              throw new Error(`Failed precache fetch: ${asset}`);
            })
            .catch(err => console.warn(`[PWA SW] Precache omitted for ${asset}:`, err))
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA SW] Removing outdated cache instance:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const reqUrl = event.request.url;

  // 1. Never intercept POST/PUT/DELETE or non-HTTP or chrome extension tasks
  if (event.request.method !== 'GET' || !reqUrl.startsWith(self.location.origin)) {
    return;
  }

  // Vite development environment source files bypass: Never cache or intercept dev source requests
  if (
    reqUrl.includes('/src/') ||
    reqUrl.includes('/node_modules/') ||
    reqUrl.includes('/@vite/') ||
    reqUrl.includes('/@react-refresh') ||
    reqUrl.endsWith('.tsx') ||
    reqUrl.endsWith('.ts') ||
    reqUrl.endsWith('.jsx') ||
    reqUrl.includes('?import') ||
    reqUrl.includes('?v=')
  ) {
    return;
  }

  // 2. Bypass Service Worker entirely for ALL backend API endpoints, uploads/media updates, .json files, and Accept: application/json header
  const reqAccept = (event.request.headers.get('accept') || event.request.headers.get('Accept') || '').toLowerCase();
  if (
    reqUrl.includes('/api/') ||
    reqUrl.includes('/uploads/') ||
    reqUrl.includes('products_real_backup.json') ||
    reqUrl.split('?')[0].endsWith('.json') ||
    reqAccept.includes('application/json')
  ) {
    return;
  }

  // 3. Admin Panel Network-Only check: Never cache administrative pages or scripts
  if (reqUrl.includes('/admin') || reqUrl.includes('AdminPanel')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 4. Force Network First for Main navigation files, manifest and sw.js
  const isNavigation = event.request.mode === 'navigate' || 
                       reqUrl === `${self.location.origin}/` || 
                       reqUrl.endsWith('index.html') || 
                       reqUrl.endsWith('manifest.json') ||
                       reqUrl.endsWith('sw.js');

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(event.request);
        })
    );
    return;
  }

  // 5. Cache First for Immutable compilation static assets (JS and CSS with unique cache hashes)
  const isCompilationAsset = reqUrl.includes('/assets/') && 
                             (reqUrl.endsWith('.js') || reqUrl.endsWith('.css') || reqUrl.endsWith('.woff') || reqUrl.endsWith('.woff2'));

  if (isCompilationAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 6. Default Stale-While-Revalidate for other static assets (images, icons, styles)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse); // Fail-safe to cached response if network offline

      return cachedResponse || fetchPromise;
    })
  );
});
