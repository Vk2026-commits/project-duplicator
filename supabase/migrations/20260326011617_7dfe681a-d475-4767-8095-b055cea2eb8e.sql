CREATE POLICY "Anyone can delete startups" ON public.startups FOR DELETE USING (true);

CREATE POLICY "Anyone can update startups open" ON public.startups FOR UPDATE USING (true);