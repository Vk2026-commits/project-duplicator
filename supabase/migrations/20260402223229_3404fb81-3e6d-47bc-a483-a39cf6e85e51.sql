ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;