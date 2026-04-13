
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type text NOT NULL CHECK (user_type IN ('client', 'motoboy', 'establishment')),
  reference_id text NOT NULL,
  city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert push subscriptions"
ON public.push_subscriptions FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Anyone can view push subscriptions"
ON public.push_subscriptions FOR SELECT TO public
USING (true);

CREATE POLICY "Anyone can update push subscriptions"
ON public.push_subscriptions FOR UPDATE TO public
USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete push subscriptions"
ON public.push_subscriptions FOR DELETE TO public
USING (true);
