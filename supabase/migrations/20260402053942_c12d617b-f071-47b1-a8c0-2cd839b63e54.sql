
-- Create deal status enum
CREATE TYPE public.deal_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.deal_vote_type AS ENUM ('approve', 'decline');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'very_high');

-- Deals table
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  investment_required NUMERIC NOT NULL DEFAULT 0,
  expected_return TEXT,
  risk_level public.risk_level NOT NULL DEFAULT 'medium',
  risk_factors TEXT,
  supporting_docs TEXT,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.deal_status NOT NULL DEFAULT 'pending',
  vote_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view deals" ON public.deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can submit deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Admins can update deals" ON public.deals FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete deals" ON public.deals FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Deal votes table
CREATE TABLE public.deal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote public.deal_vote_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (deal_id, user_id)
);

ALTER TABLE public.deal_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view votes" ON public.deal_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can cast own vote" ON public.deal_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vote" ON public.deal_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Member contributions table
CREATE TABLE public.member_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.member_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all contributions" ON public.member_contributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert contributions" ON public.member_contributions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update contributions" ON public.member_contributions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete contributions" ON public.member_contributions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at triggers
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
