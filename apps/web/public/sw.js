/**
 * Minimal PWA shell cache. Only caches the app shell + static assets —
 * does NOT intercept API calls or pretend mutations (orders, POS sales)
 * work offline. Real offline-safe sync is a deliberate, separately-scoped
 * decision for Phase 12, not a side effect of adding a service worker.
 */
const CACHE_NAME = "al-makan-shell-v1";
const SHELL_ASSETS = ["/", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api")) return; // never cache API responses

  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request)),
  );
});
