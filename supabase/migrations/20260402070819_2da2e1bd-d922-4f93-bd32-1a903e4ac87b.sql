
CREATE TABLE public.startup_info_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, startup_id)
);

ALTER TABLE public.startup_info_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON public.startup_info_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests" ON public.startup_info_requests
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert own requests
CREATE POLICY "Users can insert own requests" ON public.startup_info_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update requests" ON public.startup_info_requests
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete requests
CREATE POLICY "Admins can delete requests" ON public.startup_info_requests
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
