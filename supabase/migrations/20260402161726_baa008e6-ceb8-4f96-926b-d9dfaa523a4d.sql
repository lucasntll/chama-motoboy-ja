CREATE TABLE public.popular_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  usage_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.popular_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view popular places" ON public.popular_places FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert popular places" ON public.popular_places FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update popular places" ON public.popular_places FOR UPDATE TO public USING (true);
CREATE POLICY "admin_all_popular_places" ON public.popular_places FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));