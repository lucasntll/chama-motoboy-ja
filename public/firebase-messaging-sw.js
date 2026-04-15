/* eslint-disable no-undef */
// Firebase Messaging Service Worker for background notifications

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

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "ChamaMoto";
  const body = payload.notification?.body || "Você tem uma nova notificação";
  const icon = "/placeholder.svg";
  const link = payload.data?.link || "/";

  self.registration.showNotification(title, {
    body,
    icon,
    badge: icon,
    data: { link },
    vibrate: [200, 100, 200],
    tag: "chamamoto-notification",
    renotify: true,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    })
  );
});
