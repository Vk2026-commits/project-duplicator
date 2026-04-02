
CREATE TABLE public.investor_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_investor_id uuid NOT NULL REFERENCES public.startup_investors(id) ON DELETE CASCADE,
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  investor_name text NOT NULL,
  amount numeric NOT NULL,
  contribution_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.investor_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contributions" ON public.investor_contributions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view contributions" ON public.investor_contributions FOR SELECT TO authenticated USING (true);
