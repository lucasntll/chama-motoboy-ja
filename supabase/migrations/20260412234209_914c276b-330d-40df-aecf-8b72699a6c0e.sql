
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_value numeric DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT NULL;
