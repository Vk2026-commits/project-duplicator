-- Additional least-privilege RLS hardening for personal and financial data.

-- Profiles contain beneficiary/emergency/private contact details; remove public read access.
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view account-level profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Startup investor rows are financial records; remove anonymous/public management.
DROP POLICY IF EXISTS "Anyone can view startup investors" ON public.startup_investors;
DROP POLICY IF EXISTS "Anyone can insert startup investors" ON public.startup_investors;
DROP POLICY IF EXISTS "Anyone can update startup investors" ON public.startup_investors;
DROP POLICY IF EXISTS "Anyone can delete startup investors" ON public.startup_investors;
DROP POLICY IF EXISTS "Admins can manage startup investors" ON public.startup_investors;
DROP POLICY IF EXISTS "Users can view own startup investor records" ON public.startup_investors;

CREATE POLICY "Users can view own startup investor records"
ON public.startup_investors
FOR SELECT
TO authenticated
USING (lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', '')));

CREATE POLICY "Admins can manage startup investor records"
ON public.startup_investors
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Startup revenue is financial performance data; restrict reads to linked members and writes to admins.
DROP POLICY IF EXISTS "Anyone can view startup revenue" ON public.startup_revenue;
DROP POLICY IF EXISTS "Assigned users can view startup revenue" ON public.startup_revenue;

CREATE POLICY "Assigned users can view startup revenue"
ON public.startup_revenue
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profile_startup_links psl
    WHERE psl.startup_id = startup_revenue.startup_id
      AND psl.profile_id = auth.uid()
  )
);

-- Startup rows include investment totals and valuation metrics; block anonymous writes.
DROP POLICY IF EXISTS "Anyone can insert startups" ON public.startups;
DROP POLICY IF EXISTS "Anyone can update startups open" ON public.startups;
DROP POLICY IF EXISTS "Anyone can delete startups" ON public.startups;
DROP POLICY IF EXISTS "Authenticated users can update startups" ON public.startups;
DROP POLICY IF EXISTS "Admins can insert startups" ON public.startups;
DROP POLICY IF EXISTS "Admins can update startups" ON public.startups;
DROP POLICY IF EXISTS "Admins can delete startups" ON public.startups;

CREATE POLICY "Admins can insert startups"
ON public.startups
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update startups"
ON public.startups
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete startups"
ON public.startups
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));