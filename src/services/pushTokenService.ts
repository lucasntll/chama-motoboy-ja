import { supabase } from "@/integrations/supabase/client";

interface SaveTokenParams {
  referenceId: string;
  token: string;
  platform?: string;
  deviceName?: string;
  userId?: string;
}

export const saveOrUpdateFCMToken = async ({ referenceId, token, platform = "web", deviceName = "", userId }: SaveTokenParams) => {
  // Upsert: if same reference_id + token exists, just update last_seen_at
  const { data: existing } = await supabase
    .from("fcm_tokens" as any)
    .select("id")
    .eq("reference_id", referenceId)
    .eq("token", token)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("fcm_tokens" as any)
      .update({ is_active: true, last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any)
      .eq("id", (existing as any).id);
    return (existing as any).id;
  }

  // Deactivate old tokens for this reference
  await supabase
    .from("fcm_tokens" as any)
    .update({ is_active: false, updated_at: new Date().toISOString() } as any)
    .eq("reference_id", referenceId)
    .eq("platform", platform);

  const { data, error } = await supabase
    .from("fcm_tokens" as any)
    .insert({
      reference_id: referenceId,
      token,
      platform,
      device_name: deviceName,
      user_id: userId || null,
      is_active: true,
    } as any)
    .select("id")
    .single();

  if (error) throw error;
  return (data as any)?.id;
};

export const deactivateToken = async (token: string) => {
  await supabase
    .from("fcm_tokens" as any)
    .update({ is_active: false, updated_at: new Date().toISOString() } as any)
    .eq("token", token);
};
