ALTER TABLE public.startup_investors DROP CONSTRAINT IF EXISTS startup_investors_amount_invested_check;
ALTER TABLE public.startup_investors DROP CONSTRAINT IF EXISTS startup_investors_equity_percentage_check;

ALTER TABLE public.startup_investors
  ADD CONSTRAINT startup_investors_amount_invested_check
  CHECK (amount_invested >= 0);

ALTER TABLE public.startup_investors
  ADD CONSTRAINT startup_investors_equity_percentage_check
  CHECK (equity_percentage >= 0 AND equity_percentage <= 100);