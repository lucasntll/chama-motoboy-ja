
ALTER TABLE public.motoboys 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'available',
ADD COLUMN IF NOT EXISTS last_activity timestamp with time zone DEFAULT now();

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS purchase_location text DEFAULT '',
DROP COLUMN IF EXISTS pickup_address,
DROP COLUMN IF EXISTS pickup_lat,
DROP COLUMN IF EXISTS pickup_lng;
