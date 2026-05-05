/**
 * TapBoost Service Worker
 * 
 * Handles offline caching for app assets while explicitly ignoring 
 * external scripts like Google AdSense to prevent fetch errors.
 */

const CACHE_NAME = 'tapboost-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. BYPASS Service Worker for AdSense and external trackers
  // Intercepting these via SW fetch often triggers CORS or promise rejection errors.
  if (
    url.hostname.includes('googlesyndication.com') ||
    url.hostname.includes('doubleclick.net') ||
    url.hostname.includes('googleadservices.com') ||
    url.hostname.includes('google-analytics.com') ||
    url.hostname.includes('pagead2')
  ) {
    return; // Exit and let the browser handle the request naturally
  }

  // 2. Bypass for local API routes
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // 3. Stale-while-revalidate strategy for app assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache successful local responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback or silent failure for network issues
      });

      return cachedResponse || fetchPromise;
    })
  );
});
