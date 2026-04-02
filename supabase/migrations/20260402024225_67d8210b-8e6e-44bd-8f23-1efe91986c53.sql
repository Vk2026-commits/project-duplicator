
CREATE TABLE public.startup_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  gross_sales numeric NOT NULL DEFAULT 0,
  profit_margin numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.startup_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view startup revenue" ON public.startup_revenue FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert startup revenue" ON public.startup_revenue FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update startup revenue" ON public.startup_revenue FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete startup revenue" ON public.startup_revenue FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_startup_revenue_updated_at BEFORE UPDATE ON public.startup_revenue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
