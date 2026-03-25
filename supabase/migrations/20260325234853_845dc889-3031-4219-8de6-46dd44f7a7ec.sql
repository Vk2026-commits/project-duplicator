
-- Create startups table
CREATE TABLE public.startups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C')),
  invested NUMERIC NOT NULL CHECK (invested > 0),
  current_value NUMERIC NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT NOT NULL DEFAULT 'on-track' CHECK (status IN ('on-track', 'at-risk', 'outperforming')),
  founded TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read startups (public portfolio dashboard)
CREATE POLICY "Anyone can view startups"
  ON public.startups FOR SELECT
  USING (true);

-- Allow authenticated users to insert startups
CREATE POLICY "Authenticated users can insert startups"
  ON public.startups FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update startups
CREATE POLICY "Authenticated users can update startups"
  ON public.startups FOR UPDATE
  TO authenticated
  USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_startups_updated_at
  BEFORE UPDATE ON public.startups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
