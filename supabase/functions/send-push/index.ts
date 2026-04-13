import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// JWT creation for VAPID
async function createVapidJwt(audience: string): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 86400,
    sub: "mailto:contato@chamamoto.com",
  };

  const enc = new TextEncoder();
  const b64url = (buf: ArrayBuffer | Uint8Array) =>
    btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const headerB64 = b64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = b64url(enc.encode(JSON.stringify(payload)));
  const unsigned = `${headerB64}.${payloadB64}`;

  // Import private key
  const rawKey = Uint8Array.from(atob(VAPID_PRIVATE_KEY.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    rawKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(unsigned)
  );

  // Convert DER to raw r||s
  const derSig = new Uint8Array(sig);
  let rawSig: Uint8Array;
  if (derSig[0] === 0x30) {
    const rLen = derSig[3];
    const rStart = 4;
    let r = derSig.slice(rStart, rStart + rLen);
    const sLen = derSig[rStart + rLen + 1];
    const sStart = rStart + rLen + 2;
    let s = derSig.slice(sStart, sStart + sLen);
    if (r.length > 32) r = r.slice(r.length - 32);
    if (s.length > 32) s = s.slice(s.length - 32);
    rawSig = new Uint8Array(64);
    rawSig.set(new Uint8Array(32 - r.length).fill(0), 0);
    rawSig.set(r, 32 - r.length);
    rawSig.set(new Uint8Array(32 - s.length).fill(0), 32);
    rawSig.set(s, 64 - s.length);
  } else {
    rawSig = derSig;
  }

  return `${unsigned}.${b64url(rawSig)}`;
}

async function sendWebPush(subscription: any, payload: string): Promise<boolean> {
  try {
    const endpoint = subscription.endpoint;
    const aud = new URL(endpoint).origin;
    const jwt = await createVapidJwt(aud);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        TTL: "86400",
        Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
      },
      body: new TextEncoder().encode(payload),
    });

    if (response.status === 410 || response.status === 404) {
      // Subscription expired, remove it
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    }

    return response.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { event, order_id, city_id, customer_phone, motoboy_id, title, body, url } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let targets: any[] = [];
    let notifTitle = title || "ChamaMoto";
    let notifBody = body || "";
    let notifUrl = url || "/";
    let tag = "order";

    switch (event) {
      case "new_order": {
        // Notify establishments in the same city
        const { data } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("user_type", "establishment")
          .eq("city_id", city_id);
        targets = data || [];
        notifTitle = "🔔 Novo pedido!";
        notifBody = "Você tem um novo pedido para confirmar.";
        notifUrl = "/estabelecimento";
        tag = "new-order";
        break;
      }
      case "value_defined": {
        // Notify the specific client
        const { data } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("user_type", "client")
          .eq("reference_id", customer_phone);
        targets = data || [];
        notifTitle = "💰 Valor do pedido definido!";
        notifBody = "Confira o valor e confirme seu pedido.";
        notifUrl = `/acompanhar/${order_id}`;
        tag = "value-defined";
        break;
      }
      case "customer_confirmed": {
        // Notify available motoboys in the city
        const { data: motoboys } = await supabase
          .from("motoboys")
          .select("id")
          .eq("city_id", city_id)
          .eq("is_available", true)
          .eq("status", "available");

        if (motoboys && motoboys.length > 0) {
          const motoboyIds = motoboys.map((m: any) => m.id);
          const { data } = await supabase
            .from("push_subscriptions")
            .select("*")
            .eq("user_type", "motoboy")
            .in("reference_id", motoboyIds);
          targets = data || [];
        }
        notifTitle = "🏍️ Nova corrida disponível!";
        notifBody = "Um cliente confirmou o pedido. Aceite a corrida!";
        notifUrl = "/motoboy-painel";
        tag = "new-ride";
        break;
      }
      case "motoboy_accepted": {
        // Notify client
        const { data } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("user_type", "client")
          .eq("reference_id", customer_phone);
        targets = data || [];
        notifTitle = "🚀 Motoboy a caminho!";
        notifBody = "Seu pedido foi aceito por um motoboy.";
        notifUrl = `/acompanhar/${order_id}`;
        tag = "motoboy-accepted";
        break;
      }
      case "order_completed": {
        // Notify client
        const { data } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("user_type", "client")
          .eq("reference_id", customer_phone);
        targets = data || [];
        notifTitle = "✅ Pedido entregue!";
        notifBody = "Sua entrega foi finalizada. Obrigado!";
        notifUrl = `/acompanhar/${order_id}`;
        tag = "completed";
        break;
      }
      default: {
        // Custom notification
        if (title && body) {
          // Send to all if no specific targets
        }
      }
    }

    const payload = JSON.stringify({ title: notifTitle, body: notifBody, url: notifUrl, tag });
    let sent = 0;
    for (const sub of targets) {
      const ok = await sendWebPush(sub, payload);
      if (ok) sent++;
    }

    return new Response(JSON.stringify({ sent, total: targets.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
