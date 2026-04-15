
-- Pharmacies table
CREATE TABLE public.pharmacies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL DEFAULT '',
  cnpj TEXT DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  whatsapp TEXT DEFAULT '',
  email TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  short_description TEXT DEFAULT '',
  full_description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  city_id UUID REFERENCES public.cities(id),
  neighborhood TEXT DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  address_number TEXT DEFAULT '',
  complement TEXT DEFAULT '',
  zip_code TEXT DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_time TIME WITHOUT TIME ZONE DEFAULT '08:00',
  closing_time TIME WITHOUT TIME ZONE DEFAULT '22:00',
  sunday_open BOOLEAN NOT NULL DEFAULT false,
  delivery_fee NUMERIC DEFAULT 0,
  delivery_radius_km NUMERIC DEFAULT 10,
  estimated_delivery_time INTEGER DEFAULT 30,
  accepts_pickup BOOLEAN NOT NULL DEFAULT false,
  own_delivery BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pharmacies" ON public.pharmacies
  FOR SELECT USING (true);

CREATE POLICY "Admin manages pharmacies" ON public.pharmacies
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert pharmacies" ON public.pharmacies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update pharmacies" ON public.pharmacies
  FOR UPDATE USING (true);

-- Pharmacy categories
CREATE TABLE public.pharmacy_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pharmacy_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pharmacy categories" ON public.pharmacy_categories
  FOR SELECT USING (true);

CREATE POLICY "Admin manages pharmacy categories" ON public.pharmacy_categories
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert pharmacy categories" ON public.pharmacy_categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update pharmacy categories" ON public.pharmacy_categories
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete pharmacy categories" ON public.pharmacy_categories
  FOR DELETE USING (true);

-- Pharmacy products
CREATE TABLE public.pharmacy_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.pharmacy_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  internal_code TEXT DEFAULT '',
  stock INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pharmacy_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pharmacy products" ON public.pharmacy_products
  FOR SELECT USING (true);

CREATE POLICY "Admin manages pharmacy products" ON public.pharmacy_products
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert pharmacy products" ON public.pharmacy_products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update pharmacy products" ON public.pharmacy_products
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete pharmacy products" ON public.pharmacy_products
  FOR DELETE USING (true);

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pharmacies;
