
-- Table to track individual investors in each startup
CREATE TABLE public.startup_investors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  investor_name TEXT NOT NULL,
  email TEXT,
  amount_invested NUMERIC NOT NULL CHECK (amount_invested > 0),
  equity_percentage NUMERIC NOT NULL CHECK (equity_percentage > 0 AND equity_percentage <= 100),
  investment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.startup_investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view startup investors"
  ON public.startup_investors FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert startup investors"
  ON public.startup_investors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update startup investors"
  ON public.startup_investors FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete startup investors"
  ON public.startup_investors FOR DELETE
  USING (true);

CREATE TRIGGER update_startup_investors_updated_at
  BEFORE UPDATE ON public.startup_investors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
