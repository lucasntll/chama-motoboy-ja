import { useState, useEffect, useCallback } from "react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getFCMToken,
  onForegroundMessage,
} from "@/lib/firebaseMessaging";
import { saveOrUpdateFCMToken } from "@/services/pushTokenService";

interface UsePushNotificationsOptions {
  referenceId: string;
  userId?: string;
  autoListenForeground?: boolean;
}

export const usePushNotifications = ({ referenceId, userId, autoListenForeground = true }: UsePushNotificationsOptions) => {
  const [supported] = useState(() => isNotificationSupported());
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => getNotificationPermission());
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for foreground messages
  useEffect(() => {
    if (!supported || !autoListenForeground) return;
    onForegroundMessage((payload) => {
      console.log("[FCM] Foreground message:", payload);
    });
  }, [supported, autoListenForeground]);

  const enableNotifications = useCallback(async () => {
    if (!supported) {
      setError("Notificações não suportadas neste navegador");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setError("Permissão negada pelo usuário");
        setLoading(false);
        return null;
      }

      const fcmToken = await getFCMToken();
      if (!fcmToken) {
        setError("Não foi possível gerar o token FCM");
        setLoading(false);
        return null;
      }

      setToken(fcmToken);

      // Persist token
      await saveOrUpdateFCMToken({
        referenceId,
        token: fcmToken,
        platform: "web",
        deviceName: navigator.userAgent.slice(0, 100),
        userId,
      });

      setLoading(false);
      return fcmToken;
    } catch (err: any) {
      console.error("[FCM] Error:", err);
      setError(err.message || "Erro ao ativar notificações");
      setLoading(false);
      return null;
    }
  }, [supported, referenceId, userId]);

  const refreshToken = useCallback(async () => {
    if (permission !== "granted") return null;
    return enableNotifications();
  }, [permission, enableNotifications]);

  return {
    supported,
    permission,
    token,
    loading,
    error,
    enableNotifications,
    refreshToken,
  };
};
