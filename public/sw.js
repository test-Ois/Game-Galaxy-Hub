const CACHE_NAME = "game-galaxy-hub-static-v2";
const OFFLINE_URL = "/offline.html";
const STATIC_ASSETS = [
  OFFLINE_URL,
  "/favicon.ico",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/icon-maskable-192x192.png",
  "/icon-maskable-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Keep installation resilient if an optional icon is absent.
      await Promise.all(
        STATIC_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset, { cache: "reload" });
            if (response.ok) await cache.put(asset, response);
          } catch (error) {
            console.warn("[Service Worker] Could not pre-cache:", asset, error);
          }
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("game-galaxy-hub-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith("/socket.io/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/_next/webpack-hmr")
  ) {
    return;
  }

  // Never cache HTML/navigation responses: stale Next.js pages can break
  // deployments and leave users running mismatched client/server bundles.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (
          (await cache.match(OFFLINE_URL)) ||
          new Response("You are offline. Please reconnect and try again.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          })
        );
      })
    );
    return;
  }

  // Cache only known static assets and Next.js immutable build assets.
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:css|js|mjs|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname);
  if (!isStaticAsset) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        await cache.put(request, response.clone());
      }
      return response;
    })
  );
});
