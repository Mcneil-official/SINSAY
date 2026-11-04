const CACHE_NAME = "sinsay-v6";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifesto-hero-bg.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  // Cross-origin (Supabase REST/edge functions, Gemini, fonts, ...) must
  // fail loudly: never answer an API request from the cache. Serving the
  // cached HTML shell here would surface as bogus JSON/406 errors.
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_expo/static/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone))
            .catch(() => {});
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        // Offline: prefer the dedicated offline card for navigations,
        // fall back to the cached request or shell for subresources.
        if (event.request.mode === "navigate") {
          return caches.match("/offline.html").then((offline) => {
            return offline || caches.match("/");
          });
        }
        // Subresources (scripts, styles, images): serve from cache when we
        // have them, otherwise surface a real network error. Never fall back
        // to the HTML shell — a JS/CSS request receiving HTML breaks parsing.
        return (
          caches.match(event.request).then((cached) => {
            return cached || Response.error();
          })
        );
      })
  );
});
