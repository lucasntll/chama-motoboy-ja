import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = "BDJ6CSbS7Xr6VJbMHyVq8xRMwnmfQ4PqW3bvKNi1fWyloXSCHXuGnhb7QEZFqSrj8VDxq3YBVn4kPvXzT1MXXE";

type PushUserType = "client" | "motoboy" | "establishment";
type SubscribeFailureReason =
  | "denied"
  | "unsupported"
  | "sw_failed"
  | "subscribe_failed"
  | "save_failed"
  | "insecure_context";

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

function uint8ArrayToBase64Url(value: Uint8Array) {
  const base64 = window.btoa(String.fromCharCode(...value));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sanitizeCityId(cityId?: string | null) {
  return cityId && cityId !== "undefined" && cityId !== "null" ? cityId : null;
}

function normalizeReferenceId(userType: PushUserType, referenceId: string) {
  const trimmed = referenceId.trim();
  return userType === "client" ? trimmed.replace(/\D/g, "") : trimmed;
}

function getSubscriptionKeys(subscription: PushSubscription) {
  const json = subscription.toJSON();

  const p256dh = json.keys?.p256dh
    || (() => {
      const key = subscription.getKey("p256dh");
      return key ? uint8ArrayToBase64Url(new Uint8Array(key)) : "";
    })();

  const auth = json.keys?.auth
    || (() => {
      const key = subscription.getKey("auth");
      return key ? uint8ArrayToBase64Url(new Uint8Array(key)) : "";
    })();

  return { p256dh, auth };
}

export function getNotificationStatus(): "granted" | "denied" | "default" | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    await reg.update().catch(() => undefined);
    return reg;
  } catch (err) {
    console.error("[Push] SW registration failed:", err);
    return null;
  }
}

export async function subscribeToPush(
  userType: PushUserType,
  referenceId: string,
  cityId?: string | null
): Promise<{ success: boolean; reason?: SubscribeFailureReason }> {
  try {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return { success: false, reason: "unsupported" };
    }

    if (!window.isSecureContext) {
      console.error("[Push] Push notifications require HTTPS/secure context.");
      return { success: false, reason: "insecure_context" };
    }

    if (Notification.permission === "denied") {
      return { success: false, reason: "denied" };
    }

    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, reason: "sw_failed" };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, reason: "denied" };
    }

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

    const normalizedReferenceId = normalizeReferenceId(userType, referenceId);
    const { p256dh, auth } = getSubscriptionKeys(subscription);

    if (!subscription.endpoint || !normalizedReferenceId || !p256dh || !auth) {
      console.error("[Push] Invalid subscription payload.", {
        endpoint: !!subscription.endpoint,
        referenceId: !!normalizedReferenceId,
        p256dh: !!p256dh,
        auth: !!auth,
      });
      return { success: false, reason: "save_failed" };
    }

    const payload = {
      endpoint: subscription.endpoint,
      p256dh,
      auth,
      user_type: userType,
      reference_id: normalizedReferenceId,
      city_id: sanitizeCityId(cityId),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(payload, { onConflict: "endpoint" })
      .select("id")
      .single();

    if (error) {
      console.error("[Push] Save subscription failed:", error);
      return { success: false, reason: "save_failed" };
    }

    const { data: savedRow, error: verifyError } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("endpoint", subscription.endpoint)
      .maybeSingle();

    if (verifyError || !savedRow) {
      console.error("[Push] Verification after save failed:", verifyError);
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
