import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = "BDJ6CSbS7Xr6VJbMHyVq8xRMwnmfQ4PqW3bvKNi1fWyloXSCHXuGnhb7QEZFqSrj8VDxq3YBVn4kPvXzT1MXXE";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getNotificationStatus(): "granted" | "denied" | "default" | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    // Wait for the SW to be ready
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error("[Push] SW registration failed:", err);
    return null;
  }
}

export async function subscribeToPush(
  userType: "client" | "motoboy" | "establishment",
  referenceId: string,
  cityId?: string | null
): Promise<{ success: boolean; reason?: "denied" | "unsupported" | "sw_failed" | "subscribe_failed" | "save_failed" }> {
  try {
    // Check support
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return { success: false, reason: "unsupported" };
    }

    // Check if already denied
    if (Notification.permission === "denied") {
      return { success: false, reason: "denied" };
    }

    // Register SW first (before requesting permission)
    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, reason: "sw_failed" };
    }

    // Request permission (only triggers browser prompt if status is "default")
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, reason: "denied" };
    }

    // Subscribe to push
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      } catch (err) {
        console.error("[Push] Subscribe failed:", err);
        return { success: false, reason: "subscribe_failed" };
      }
    }

    const keys = subscription.toJSON();
    const p256dh = keys.keys?.p256dh || "";
    const auth = keys.keys?.auth || "";

    // Upsert subscription to database
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          user_type: userType,
          reference_id: referenceId,
          city_id: (cityId && cityId !== "undefined" && cityId !== "null") ? cityId : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      console.error("[Push] Save subscription failed:", error);
      return { success: false, reason: "save_failed" };
    }

    return { success: true };
  } catch (err) {
    console.error("[Push] Unexpected error:", err);
    return { success: false, reason: "subscribe_failed" };
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
      await subscription.unsubscribe();
    }
  } catch {}
}
