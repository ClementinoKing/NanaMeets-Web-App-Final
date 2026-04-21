const VERSION = "2026-04-21";
const STATIC_CACHE = `nanameets-static-${VERSION}`;
const PAGE_CACHE = `nanameets-pages-${VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/privacy",
  "/offline.html",
  "/Fav-Icon.svg",
  "/Nanameets.svg",
  "/Nanameets_L.svg",
  "/apple-touch-icon.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/icon-maskable-512x512.png",
  "/images/hero_img.png",
  "/images/FavIcon.png",
];

const PUBLIC_NAVIGATION_PATHS = new Set(["/", "/privacy"]);
const STATIC_PATH_PREFIXES = ["/_next/static/", "/_next/image", "/images/", "/svg/", "/json/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();

      await Promise.all(
        cacheKeys.map((cacheKey) => {
          if (cacheKey === STATIC_CACHE || cacheKey === PAGE_CACHE) {
            return Promise.resolve();
          }

          return caches.delete(cacheKey);
        })
      );

      await self.clients.claim();
    })()
  );
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (response.ok) {
    cache.put(request, response.clone());
  }

  return response;
}

async function networkFirstNavigation(request) {
  const url = new URL(request.url);

  try {
    const response = await fetch(request);

    if (response.ok && PUBLIC_NAVIGATION_PATHS.has(url.pathname)) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch {
    const pageCache = await caches.open(PAGE_CACHE);
    const cachedPage = await pageCache.match(request);

    if (cachedPage) {
      return cachedPage;
    }

    const offlinePage = await caches.match("/offline.html");

    if (offlinePage) {
      return offlinePage;
    }

    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (STATIC_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(cacheFirst(request));
  }
});
