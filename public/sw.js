const CACHE_NAME = "chamamoto-v2";
const STATIC_CACHE = "chamamoto-static-v2";
const RUNTIME_CACHE = "chamamoto-runtime-v2";

// Priority pages to precache for fast access and offline reliability
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/login",
  "/meus-pedidos",
  "/motoboy",
  "/estabelecimento",
];

// Install: precache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // Use addAll with catch to avoid failing entire install if one URL fails
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch(() => console.warn("[SW] Failed to cache:", url))
        )
      )
    )
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  const validCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !validCaches.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: smart caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== "GET") return;

  // Never cache OAuth, Supabase API, or edge functions
  if (
    url.pathname.includes("/~oauth") ||
    url.hostname.includes("supabase.co") ||
    url.pathname.includes("/rest/") ||
    url.pathname.includes("/functions/") ||
    url.pathname.includes("/auth/")
  ) {
    return;
  }

  // Navigation requests: network-first, fallback to cached index
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigations
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html")))
    );
    return;
  }

  // Same-origin assets (JS, CSS, images, fonts): cache-first with network fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Refresh in background (stale-while-revalidate)
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, response));
              }
            })
            .catch(() => {});
          return cached;
        }
        return fetch(request).then((response) => {
          if (response.ok && (request.destination === "script" || request.destination === "style" || request.destination === "image" || request.destination === "font")) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Cross-origin: network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Push notifications
self.addEventListener("push", (event) => {
  let data = { title: "ChamaMoto", body: "Você tem uma atualização!", url: "/" };
  try { data = event.data.json(); } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title || "ChamaMoto", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
      requireInteraction: true,
      tag: data.tag || "chamamoto",
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
