// RoutineMate PWA service worker — MVP-2 §3.6 "PWA / Offline Support".
// Scope: makes the app shell (HTML/JS/CSS) available offline and installable.
// Deliberately does NOT cache API responses (`/api/*`) — those must always
// hit the network so the user never sees stale routine/stats data. Offline
// check-in queueing lives at the app layer instead of here — see
// src/offline/offlineCheckInQueue.ts and routines.thunks.ts's
// toggleCheckInThunk: a check-in POST that fails at the network layer (this
// worker lets it pass straight through, per the rule above) gets queued in
// IndexedDB and replayed by src/app/OfflineSyncBridge.tsx once back online.

const CACHE_NAME = 'routinemate-shell-v1';
const APP_SHELL = ['/', '/manifest.webmanifest', '/pwa-icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never intercept API calls — always go live so data stays fresh.
  if (url.pathname.startsWith('/api/')) return;

  // Network-first for navigations, so users get the latest shell online but
  // still get *something* when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/').then((cached) => cached ?? Response.error())),
    );
    return;
  }

  // Cache-first for same-origin static assets.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          }),
      ),
    );
  }
});
