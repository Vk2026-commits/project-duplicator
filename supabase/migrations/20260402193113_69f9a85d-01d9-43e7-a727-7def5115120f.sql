ALTER TABLE public.startup_investors
  ADD COLUMN IF NOT EXISTS pledge_amount numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS investment_round text DEFAULT NULL;