import { supabase } from "@/integrations/supabase/client";

interface PushEvent {
  event: string;
  order_id?: string;
  city_id?: string | null;
  customer_phone?: string;
  motoboy_id?: string | null;
  title?: string;
  body?: string;
  url?: string;
}

export async function sendPushNotification(payload: PushEvent): Promise<void> {
  try {
    await supabase.functions.invoke("send-push", { body: payload });
  } catch {
    console.warn("Push notification failed silently");
  }
}
