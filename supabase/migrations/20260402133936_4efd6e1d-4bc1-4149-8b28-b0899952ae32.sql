
-- Remove overly permissive UPDATE policy on orders (only motoboys/admins should update)
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
