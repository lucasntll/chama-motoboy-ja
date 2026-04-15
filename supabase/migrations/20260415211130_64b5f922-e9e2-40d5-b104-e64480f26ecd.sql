
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  reference_id text NOT NULL,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'web',
  device_name text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reference_id, token)
);

ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fcm tokens" ON public.fcm_tokens FOR SELECT USING (true);
CREATE POLICY "Anyone can insert fcm tokens" ON public.fcm_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update fcm tokens" ON public.fcm_tokens FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete fcm tokens" ON public.fcm_tokens FOR DELETE USING (true);
CREATE POLICY "Admin manages fcm tokens" ON public.fcm_tokens FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.fcm_tokens;
