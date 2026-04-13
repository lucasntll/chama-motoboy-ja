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

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export async function subscribeToPush(
  userType: "client" | "motoboy" | "establishment",
  referenceId: string,
  cityId?: string | null
): Promise<boolean> {
  try {
    const reg = await registerServiceWorker();
    if (!reg) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const keys = subscription.toJSON();
    const p256dh = keys.keys?.p256dh || "";
    const auth = keys.keys?.auth || "";

    // Upsert subscription
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          user_type: userType,
          reference_id: referenceId,
          city_id: cityId || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );

    return !error;
  } catch {
    return false;
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
