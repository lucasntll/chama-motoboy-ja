
-- 1. Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT '🏪',
  color text NOT NULL DEFAULT '#10B981',
  description text DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin manages categories" ON public.categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can insert categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update categories" ON public.categories FOR UPDATE USING (true);

-- 2. Add columns to establishments
ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id),
  ADD COLUMN IF NOT EXISTS owner_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS document_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS short_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS full_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS neighborhood text DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS complement text DEFAULT '',
  ADD COLUMN IF NOT EXISTS zip_code text DEFAULT '',
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS sunday_open boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_radius_km numeric DEFAULT 10,
  ADD COLUMN IF NOT EXISTS estimated_delivery_time integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS accepts_pickup boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS own_delivery boolean DEFAULT false;

-- 3. Establishment internal categories (for products)
CREATE TABLE IF NOT EXISTS public.establishment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.establishment_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view establishment categories" ON public.establishment_categories FOR SELECT USING (true);
CREATE POLICY "Admin manages establishment categories" ON public.establishment_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can insert establishment categories" ON public.establishment_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update establishment categories" ON public.establishment_categories FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete establishment categories" ON public.establishment_categories FOR DELETE USING (true);

-- 4. Establishment products
CREATE TABLE IF NOT EXISTS public.establishment_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.establishment_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  internal_code text DEFAULT '',
  stock integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.establishment_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view establishment products" ON public.establishment_products FOR SELECT USING (true);
CREATE POLICY "Admin manages establishment products" ON public.establishment_products FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can insert establishment products" ON public.establishment_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update establishment products" ON public.establishment_products FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete establishment products" ON public.establishment_products FOR DELETE USING (true);

-- 5. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.establishment_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.establishment_products;

-- 6. Seed categories
INSERT INTO public.categories (name, slug, icon, color, display_order) VALUES
  ('Lanche', 'lanche', '🍔', '#F59E0B', 1),
  ('Remédio', 'remedio', '💊', '#EF4444', 2),
  ('Mercado', 'mercado', '🛒', '#10B981', 3),
  ('Bebida', 'bebida', '🍺', '#3B82F6', 4),
  ('Padaria', 'padaria', '🥖', '#D97706', 5),
  ('Açougue', 'acougue', '🥩', '#DC2626', 6),
  ('Loja', 'loja', '🏪', '#8B5CF6', 7),
  ('Documento', 'documento', '📄', '#6B7280', 8),
  ('Outros', 'outros', '🧩', '#14B8A6', 9);
