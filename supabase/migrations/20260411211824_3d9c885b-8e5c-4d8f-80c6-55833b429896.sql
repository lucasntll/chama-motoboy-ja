
-- 1. Cities table
CREATE TABLE public.cities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  state text NOT NULL DEFAULT 'MG',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active cities" ON public.cities FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manages cities" ON public.cities FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Establishments table
CREATE TABLE public.establishments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city_id uuid REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL DEFAULT 'Restaurante',
  access_code text,
  is_open boolean NOT NULL DEFAULT false,
  auto_schedule boolean NOT NULL DEFAULT false,
  open_time time,
  close_time time,
  photo_url text,
  status text NOT NULL DEFAULT 'active',
  commission_per_order numeric NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active establishments" ON public.establishments FOR SELECT USING (true);
CREATE POLICY "Admin manages establishments" ON public.establishments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Establishments can update themselves" ON public.establishments FOR UPDATE USING (true);

-- 3. Establishment applications
CREATE TABLE public.establishment_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  owner_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  category text NOT NULL DEFAULT 'Restaurante',
  description text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.establishment_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create establishment applications" ON public.establishment_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view establishment applications" ON public.establishment_applications FOR SELECT USING (true);
CREATE POLICY "Admin manages establishment applications" ON public.establishment_applications FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Add city_id to motoboys
ALTER TABLE public.motoboys ADD COLUMN city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL;

-- 5. Add city_id, establishment_id, order_type to orders
ALTER TABLE public.orders ADD COLUMN city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN establishment_id uuid REFERENCES public.establishments(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN order_type text NOT NULL DEFAULT 'free';
ALTER TABLE public.orders ADD COLUMN establishment_commission numeric DEFAULT 0;

-- Enable realtime for establishments and cities
ALTER PUBLICATION supabase_realtime ADD TABLE public.establishments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cities;
