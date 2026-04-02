
-- House reference on orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS house_reference text DEFAULT '';

-- Link motoboys to auth users
ALTER TABLE public.motoboys ADD COLUMN IF NOT EXISTS user_id uuid;

-- Commission and payment tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS commission_amount numeric DEFAULT 2,
  ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- App roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'motoboy');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- user_roles RLS
CREATE POLICY "sel_own_roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_all_roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Motoboy auth policies
CREATE POLICY "motoboy_update_self" ON public.motoboys FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_all_motoboys" ON public.motoboys FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Order auth policies
CREATE POLICY "motoboy_sel_orders" ON public.orders FOR SELECT TO authenticated
  USING (motoboy_id IN (SELECT id FROM public.motoboys WHERE user_id = auth.uid()));
CREATE POLICY "motoboy_upd_orders" ON public.orders FOR UPDATE TO authenticated
  USING (motoboy_id IN (SELECT id FROM public.motoboys WHERE user_id = auth.uid()));
CREATE POLICY "admin_all_orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motoboy_id uuid REFERENCES public.motoboys(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  admin_note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "motoboy_sel_payments" ON public.payments FOR SELECT TO authenticated
  USING (motoboy_id IN (SELECT id FROM public.motoboys WHERE user_id = auth.uid()));
CREATE POLICY "admin_all_payments" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
