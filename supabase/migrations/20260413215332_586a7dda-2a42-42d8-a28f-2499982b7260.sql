
-- Add dispatched_to column to track which motoboys can see the order
ALTER TABLE public.orders ADD COLUMN dispatched_to text[] DEFAULT '{}';

-- Add dispatched_at to know when it was dispatched (for timeout/redistribution)
ALTER TABLE public.orders ADD COLUMN dispatched_at timestamp with time zone DEFAULT NULL;
