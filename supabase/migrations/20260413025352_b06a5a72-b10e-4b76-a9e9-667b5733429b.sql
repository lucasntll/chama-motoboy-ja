
CREATE POLICY "Anyone can update establishment applications"
ON public.establishment_applications
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can insert cities"
ON public.cities
FOR INSERT
TO public
WITH CHECK (true);
