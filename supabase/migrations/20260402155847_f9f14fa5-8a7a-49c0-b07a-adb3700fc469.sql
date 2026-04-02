ALTER TABLE public.onboarding_agreements
  ADD COLUMN startup_id uuid REFERENCES public.startups(id) ON DELETE CASCADE;

CREATE INDEX idx_onboarding_agreements_startup ON public.onboarding_agreements(startup_id);
CREATE INDEX idx_onboarding_agreements_user_startup ON public.onboarding_agreements(user_id, startup_id);