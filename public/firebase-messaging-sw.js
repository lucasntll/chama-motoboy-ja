/* eslint-disable no-undef */
// Firebase Messaging SW — background notifications for Android & iOS PWA

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD-SlWc0HORS-RyYBglRtwS1l35T_wmhY4",
  authDomain: "urban-dash-f3ecb.firebaseapp.com",
  projectId: "urban-dash-f3ecb",
  storageBucket: "urban-dash-f3ecb.firebasestorage.app",
  messagingSenderId: "991648164099",
  appId: "1:991648164099:web:fde7e7e8076d446e8ea136",
});

const messaging = firebase.messaging();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Background data-only or notification messages.
// Use deterministic `tag` (without timestamp) so duplicate pushes for the
// same event/order replace one another instead of spamming the user.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || "ChamaMoto";
  const body = payload.notification?.body || payload.data?.body || "Você tem uma nova notificação";
  const link = payload.data?.link || payload.fcmOptions?.link || "/";
  const tag = payload.data?.tag || "chamamoto-default";

  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { link },
    vibrate: [200, 100, 200, 100, 200],
    tag,
    renotify: false,
    requireInteraction: true,
  });
});

// Some platforms (iOS PWA) deliver as raw push event — handle that too
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { title: "ChamaMoto", body: event.data.text() } };
  }

  const n = payload.notification || {};
  const d = payload.data || {};
  const title = n.title || d.title || "ChamaMoto";
  const body = n.body || d.body || "Você tem uma nova notificação";
  const link = d.link || d.url || "/";
  const tag = d.tag || "chamamoto-default";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { link },
      vibrate: [200, 100, 200, 100, 200],
      tag,
      renotify: false,
      requireInteraction: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(link).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    })
  );
});
