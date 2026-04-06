-- Update default commission from R$2 to R$1
ALTER TABLE public.orders ALTER COLUMN commission_amount SET DEFAULT 1;

-- Add public update policy on orders for motoboy acceptance flow (code-based access)
CREATE POLICY "Anyone can update orders"
ON public.orders
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);