ALTER TABLE public.startups DROP CONSTRAINT startups_invested_check;
ALTER TABLE public.startups ADD CONSTRAINT startups_invested_check CHECK (invested >= 0);