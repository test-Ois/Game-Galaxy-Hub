const CACHE_NAME = "game-galaxy-hub-cache-v1";
const OFFLINE_URL = "/offline.html";

const ASSETS_TO_CACHE = [
  OFFLINE_URL,
  "/favicon.ico",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/icon-maskable-192x192.png",
  "/icon-maskable-512x512.png"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching static offline shell assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache storage:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Network-First, Cache Fallback)
self.addEventListener("fetch", (event) => {
  // Only intercept GET requests
  if (event.request.method !== "GET") return;

  // Skip chrome-extension scheme or hmr resources
  const url = new URL(event.request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (url.pathname.includes("/_next/webpack-hmr") || url.pathname.includes("/socket.io/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If response is valid, clone and cache it
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, lookup cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If a page request fails (navigate mode), serve offline.html
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
          
          return new Response("Offline resource unavailable", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({ "Content-Type": "text/plain" })
          });
        });
      })
  );
});
