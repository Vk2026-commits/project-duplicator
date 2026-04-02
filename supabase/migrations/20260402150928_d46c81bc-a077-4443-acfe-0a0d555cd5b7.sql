
CREATE TABLE public.onboarding_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agreement_type text NOT NULL,
  full_name text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  UNIQUE(user_id, agreement_type)
);

ALTER TABLE public.onboarding_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding agreements"
  ON public.onboarding_agreements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all onboarding agreements"
  ON public.onboarding_agreements FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own onboarding agreements"
  ON public.onboarding_agreements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
