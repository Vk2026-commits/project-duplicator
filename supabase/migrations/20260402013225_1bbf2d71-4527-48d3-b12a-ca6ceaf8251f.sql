
-- Junction table linking user profiles to startups they invest in
CREATE TABLE public.profile_startup_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, startup_id)
);

ALTER TABLE public.profile_startup_links ENABLE ROW LEVEL SECURITY;

-- Anyone can view links (needed for visibility checks)
CREATE POLICY "Anyone can view profile startup links"
ON public.profile_startup_links FOR SELECT
TO public
USING (true);

-- Admins can insert links
CREATE POLICY "Admins can insert profile startup links"
ON public.profile_startup_links FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete links
CREATE POLICY "Admins can delete profile startup links"
ON public.profile_startup_links FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
