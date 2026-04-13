CREATE POLICY "Anyone can insert establishments"
ON public.establishments
FOR INSERT
TO public
WITH CHECK (true);