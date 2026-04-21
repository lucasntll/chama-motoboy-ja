import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { getFirebaseMessaging, FIREBASE_VAPID_KEY } from "./firebase";
import { toast } from "sonner";

export const isNotificationSupported = (): boolean => {
  return typeof window !== "undefined" && typeof window.Notification !== "undefined" && "serviceWorker" in navigator;
};

export const getNotificationPermission = (): NotificationPermission | "unsupported" => {
  if (!isNotificationSupported()) return "unsupported";
  return window.Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) throw new Error("Notificações não suportadas neste navegador");
  return window.Notification.requestPermission();
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  if (!("serviceWorker" in navigator)) throw new Error("Service Worker não suportado");
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  await navigator.serviceWorker.ready;
  return registration;
};

export const getFCMToken = async (): Promise<string | null> => {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const registration = await registerServiceWorker();
    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (error: any) {
    console.error("[FCM] Erro ao obter token:", error);
    throw error;
  }
};

export const onForegroundMessage = (callback: (payload: MessagePayload) => void) => {
  getFirebaseMessaging().then((messaging) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || "Nova notificação";
      const body = payload.notification?.body || "";

      toast(title, { description: body, duration: 6000 });
      callback(payload);
    });
  });
};
