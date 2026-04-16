const CACHE_NAME = "chamamoto-v1";
const PRECACHE_URLS = ["/", "/index.html"];

// Install: precache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigations, cache-first for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET and cross-origin
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) return;

  // Never cache OAuth or API calls
  if (request.url.includes("/~oauth") || request.url.includes("/rest/") || request.url.includes("/functions/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
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
