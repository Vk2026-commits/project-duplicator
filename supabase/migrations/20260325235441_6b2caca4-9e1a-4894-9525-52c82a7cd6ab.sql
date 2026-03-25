
-- Allow anonymous users to also insert startups (until auth is added)
DROP POLICY "Authenticated users can insert startups" ON public.startups;
CREATE POLICY "Anyone can insert startups"
  ON public.startups FOR INSERT
  WITH CHECK (true);
