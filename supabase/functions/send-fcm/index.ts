const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

/*
 * Edge Function: send-fcm
 * Envia notificações push via Firebase Cloud Messaging (FCM HTTP v1 API)
 *
 * ⚠️ REQUER o secret FIREBASE_SERVICE_ACCOUNT_JSON no backend
 *    → Conteúdo: JSON completo da chave de service account do Firebase
 *    → Firebase Console → Project Settings → Service Accounts → Generate new private key
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token, title, body, data, referenceId } = await req.json();

    // Get token from request or look up by referenceId
    let targetToken = token;

    if (!targetToken && referenceId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: tokenData } = await supabase
        .from("fcm_tokens")
        .select("token")
        .eq("reference_id", referenceId)
        .eq("is_active", true)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      targetToken = tokenData?.token;
    }

    if (!targetToken) {
      return new Response(
        JSON.stringify({ error: "Token não encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Firebase service account
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) {
      console.error("[send-fcm] FIREBASE_SERVICE_ACCOUNT_JSON not configured");
      return new Response(
        JSON.stringify({ error: "Firebase service account não configurado no servidor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    // Generate OAuth2 access token using service account
    const accessToken = await getAccessToken(serviceAccount);

    // Send via FCM HTTP v1 API
    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: targetToken,
            notification: {
              title: title || "ChamaMoto",
              body: body || "Nova notificação",
            },
            data: data || {},
            webpush: {
              fcm_options: {
                link: data?.link || "/",
              },
            },
          },
        }),
      }
    );

    const fcmResult = await fcmResponse.json();

    if (!fcmResponse.ok) {
      console.error("[send-fcm] FCM error:", fcmResult);

      // Deactivate invalid tokens
      if (fcmResult.error?.details?.some((d: any) => d.errorCode === "UNREGISTERED")) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("fcm_tokens").update({ is_active: false }).eq("token", targetToken);
        console.log("[send-fcm] Token desativado:", targetToken.slice(0, 20));
      }

      return new Response(
        JSON.stringify({ error: "Falha ao enviar notificação", details: fcmResult }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[send-fcm] Enviado com sucesso:", fcmResult);

    return new Response(
      JSON.stringify({ success: true, messageId: fcmResult.name }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-fcm] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Generate OAuth2 access token from service account JWT
async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const enc = (obj: any) => btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unsignedToken = `${enc(header)}.${enc(payload)}`;

  // Import RSA private key
  const pemContent = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const keyData = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsignedToken));
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsignedToken}.${signature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) throw new Error(`OAuth2 error: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}
