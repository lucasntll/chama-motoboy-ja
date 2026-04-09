
-- Create motoboy applications table
CREATE TABLE public.motoboy_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  experience TEXT DEFAULT '',
  face_photo_url TEXT,
  vehicle_photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.motoboy_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create applications"
ON public.motoboy_applications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view applications"
ON public.motoboy_applications FOR SELECT
USING (true);

CREATE POLICY "admin_all_applications"
ON public.motoboy_applications FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for application photos
INSERT INTO storage.buckets (id, name, public) VALUES ('motoboy-photos', 'motoboy-photos', true);

CREATE POLICY "Anyone can upload motoboy photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'motoboy-photos');

CREATE POLICY "Anyone can view motoboy photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'motoboy-photos');

CREATE POLICY "Admin can delete motoboy photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'motoboy-photos' AND has_role(auth.uid(), 'admin'::app_role));
