// QR Menu Service Worker — Phase 8
// Caches static assets for faster loads; does NOT cache transactional data.
const CACHE_NAME = "qrmenu-v1";
const STATIC_ASSETS = [
  "/manifest.json",
  "/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first strategy for all requests (no fake offline for transactional data)
self.addEventListener("fetch", (event) => {
  // Only handle GET requests to same origin
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Skip API and auth routes — always network
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached || new Response("Hors ligne", { status: 503 }))
    )
  );
});
