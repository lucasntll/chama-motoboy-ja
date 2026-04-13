import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import { buildPushHTTPRequest } from "npm:@pushforge/builder";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CONTACT_EMAIL = "mailto:contato@chamamoto.com";

type PushEventRequest = {
  event?: string;
  order_id?: string;
  city_id?: string | null;
  customer_phone?: string;
  motoboy_id?: string | null;
  title?: string;
  body?: string;
  url?: string;
};

type SubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_type: string;
  reference_id: string;
  city_id: string | null;
};

function normalizePhone(value?: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  try {
    return JSON.parse(JSON.stringify(error));
  } catch {
    return { message: String(error) };
  }
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())))];
}

function base64ToUint8Array(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function parsePrivateKeyInput(secret: string) {
  const trimmed = secret.trim();

  if (trimmed.startsWith("{")) {
    return { kind: "jwk" as const, value: JSON.parse(trimmed) as JsonWebKey };
  }

  if (trimmed.includes("BEGIN PRIVATE KEY")) {
    const pem = trimmed
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\s+/g, "");

    return { kind: "pkcs8" as const, value: base64ToUint8Array(pem) };
  }

  return { kind: "pkcs8" as const, value: base64ToUint8Array(trimmed.replace(/\s+/g, "")) };
}

let cachedVapidPrivateJwk: JsonWebKey | null = null;

async function getVapidPrivateJwk(): Promise<JsonWebKey> {
  if (cachedVapidPrivateJwk) {
    return cachedVapidPrivateJwk;
  }

  const secret = Deno.env.get("VAPID_PRIVATE_KEY");

  if (!secret) {
    throw new Error("VAPID_PRIVATE_KEY secret is missing.");
  }

  const parsedSecret = parsePrivateKeyInput(secret);

  if (parsedSecret.kind === "jwk") {
    cachedVapidPrivateJwk = parsedSecret.value;
    return cachedVapidPrivateJwk;
  }

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    parsedSecret.value,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"],
  );

  cachedVapidPrivateJwk = await crypto.subtle.exportKey("jwk", cryptoKey);
  return cachedVapidPrivateJwk;
}

function getVapidPublicKey(): string {
  const key = Deno.env.get("VAPID_PUBLIC_KEY")?.trim();

  if (!key) {
    throw new Error("VAPID_PUBLIC_KEY secret is missing.");
  }

  return key;
}

async function sendWebPush(
  supabase: ReturnType<typeof createClient>,
  subscription: SubscriptionRecord,
  payload: Record<string, string>,
): Promise<boolean> {
  try {
    const { endpoint, headers, body } = await buildPushHTTPRequest({
      privateJWK: await getVapidPrivateJwk(),
      subject: CONTACT_EMAIL,
      subscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      message: {
        ttl: 86400,
        urgency: "high",
        payload,
      },
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body,
    });

    if (response.status === 404 || response.status === 410) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
    }

    if (!response.ok) {
      console.error("[send-push] Provider rejected push", {
        endpoint: subscription.endpoint,
        status: response.status,
        body: await response.text(),
      });
    }

    return response.ok;
  } catch (error) {
    console.error("[send-push] Failed to send push", {
      endpoint: subscription.endpoint,
      error: String(error),
    });
    return false;
  }
}

async function getClientTargets(
  supabase: ReturnType<typeof createClient>,
  customerPhone?: string,
): Promise<SubscriptionRecord[]> {
  const phoneCandidates = uniqueStrings([customerPhone, normalizePhone(customerPhone)]);

  if (phoneCandidates.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_type, reference_id, city_id")
    .eq("user_type", "client")
    .in("reference_id", phoneCandidates);

  if (error) {
    throw error;
  }

  return (data as SubscriptionRecord[] | null) ?? [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    try {
      return new Response(JSON.stringify({ vapidPublicKey: getVapidPublicKey() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      const serialized = serializeError(error);
      console.error("[send-push] Failed to provide VAPID public key", serialized);

      return new Response(JSON.stringify({ error: serialized }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { event, order_id, city_id, customer_phone, title, body, url }: PushEventRequest = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let targets: SubscriptionRecord[] = [];
    let notifTitle = title || "ChamaMoto";
    let notifBody = body || "";
    let notifUrl = url || "/";
    let tag = "order";

    switch (event) {
      case "new_order": {
        const { data, error } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth, user_type, reference_id, city_id")
          .eq("user_type", "establishment")
          .eq("city_id", city_id);

        if (error) throw error;

        targets = (data as SubscriptionRecord[] | null) ?? [];
        notifTitle = "🔔 Novo pedido!";
        notifBody = "Você tem um novo pedido para confirmar.";
        notifUrl = "/estabelecimento";
        tag = "new-order";
        break;
      }

      case "value_defined": {
        targets = await getClientTargets(supabase, customer_phone);
        notifTitle = "💰 Valor do pedido definido!";
        notifBody = "Confira o valor e confirme seu pedido.";
        notifUrl = `/acompanhar/${order_id}`;
        tag = "value-defined";
        break;
      }

      case "customer_confirmed": {
        const { data: motoboys, error: motoboysError } = await supabase
          .from("motoboys")
          .select("id")
          .eq("city_id", city_id)
          .eq("is_available", true)
          .eq("status", "available");

        if (motoboysError) throw motoboysError;

        if (motoboys && motoboys.length > 0) {
          const motoboyIds = motoboys.map((motoboy) => motoboy.id);
          const { data, error } = await supabase
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth, user_type, reference_id, city_id")
            .eq("user_type", "motoboy")
            .in("reference_id", motoboyIds);

          if (error) throw error;
          targets = (data as SubscriptionRecord[] | null) ?? [];
        }

        notifTitle = "🏍️ Nova corrida disponível!";
        notifBody = "Um cliente confirmou o pedido. Aceite a corrida!";
        notifUrl = "/motoboy-painel";
        tag = "new-ride";
        break;
      }

      case "motoboy_accepted": {
        targets = await getClientTargets(supabase, customer_phone);
        notifTitle = "🚀 Motoboy a caminho!";
        notifBody = "Seu pedido foi aceito por um motoboy.";
        notifUrl = `/acompanhar/${order_id}`;
        tag = "motoboy-accepted";
        break;
      }

      case "order_completed": {
        targets = await getClientTargets(supabase, customer_phone);
        notifTitle = "✅ Pedido entregue!";
        notifBody = "Sua entrega foi finalizada. Obrigado!";
        notifUrl = `/acompanhar/${order_id}`;
        tag = "completed";
        break;
      }

      default: {
        if (title && body && customer_phone) {
          targets = await getClientTargets(supabase, customer_phone);
        }
      }
    }

    const payload = {
      title: notifTitle,
      body: notifBody,
      url: notifUrl,
      tag,
    };

    console.log("[send-push] Sending push", { event, totalTargets: targets.length, customer_phone });

    let sent = 0;
    for (const subscription of targets) {
      const delivered = await sendWebPush(supabase, subscription, payload);
      if (delivered) sent += 1;
    }

    return new Response(JSON.stringify({ sent, total: targets.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const serialized = serializeError(error);
    console.error("[send-push] Unhandled error", serialized);

    return new Response(JSON.stringify({ error: serialized }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
