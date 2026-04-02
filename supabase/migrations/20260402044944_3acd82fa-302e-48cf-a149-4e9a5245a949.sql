
CREATE TABLE public.disclaimer_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  ip_address text,
  UNIQUE(user_id)
);

ALTER TABLE public.disclaimer_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acceptance" ON public.disclaimer_acceptances
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own acceptance" ON public.disclaimer_acceptances
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all acceptances" ON public.disclaimer_acceptances
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
