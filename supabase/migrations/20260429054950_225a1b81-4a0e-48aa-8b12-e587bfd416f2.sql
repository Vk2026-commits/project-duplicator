DO $$ BEGIN
  CREATE TYPE public.network_waitlist_status AS ENUM ('waiting', 'invited', 'accepted', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.network_interest_type AS ENUM ('learn', 'invest', 'build_wealth', 'partnership', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.network_engagement_level AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.network_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  occupation text NOT NULL,
  interest_type public.network_interest_type NOT NULL DEFAULT 'learn',
  engagement_level public.network_engagement_level NOT NULL DEFAULT 'medium',
  status public.network_waitlist_status NOT NULL DEFAULT 'waiting',
  tags text[] NOT NULL DEFAULT ARRAY['Waitlist - Network']::text[],
  completed_onboarding boolean NOT NULL DEFAULT false,
  estate_profile_completed boolean NOT NULL DEFAULT false,
  date_joined_waitlist timestamptz NOT NULL DEFAULT now(),
  invite_date timestamptz,
  invite_expires_at timestamptz,
  invite_token_hash text UNIQUE,
  invite_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS network_waitlist_email_unique_idx ON public.network_waitlist (lower(email));
CREATE INDEX IF NOT EXISTS network_waitlist_status_joined_idx ON public.network_waitlist (status, date_joined_waitlist);
CREATE INDEX IF NOT EXISTS network_waitlist_priority_idx ON public.network_waitlist (completed_onboarding DESC, estate_profile_completed DESC, engagement_level, date_joined_waitlist);
CREATE INDEX IF NOT EXISTS network_waitlist_token_hash_idx ON public.network_waitlist (invite_token_hash) WHERE invite_token_hash IS NOT NULL;

ALTER TABLE public.network_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can join network waitlist" ON public.network_waitlist;
CREATE POLICY "Anyone can join network waitlist"
ON public.network_waitlist
FOR INSERT
TO public
WITH CHECK (
  status = 'waiting'::public.network_waitlist_status
  AND invite_token_hash IS NULL
  AND invite_date IS NULL
  AND invite_expires_at IS NULL
  AND invite_accepted_at IS NULL
);

DROP POLICY IF EXISTS "Users can view own waitlist entry" ON public.network_waitlist;
CREATE POLICY "Users can view own waitlist entry"
ON public.network_waitlist
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

DROP POLICY IF EXISTS "Admins can view network waitlist" ON public.network_waitlist;
CREATE POLICY "Admins can view network waitlist"
ON public.network_waitlist
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update network waitlist" ON public.network_waitlist;
CREATE POLICY "Admins can update network waitlist"
ON public.network_waitlist
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete network waitlist" ON public.network_waitlist;
CREATE POLICY "Admins can delete network waitlist"
ON public.network_waitlist
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS update_network_waitlist_updated_at ON public.network_waitlist;
CREATE TRIGGER update_network_waitlist_updated_at
BEFORE UPDATE ON public.network_waitlist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.expire_network_waitlist_invites()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  UPDATE public.network_waitlist
  SET status = 'expired'::public.network_waitlist_status,
      invite_token_hash = NULL,
      updated_at = now()
  WHERE status = 'invited'::public.network_waitlist_status
    AND invite_expires_at <= now();

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_network_invite(_token text)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token_hash text;
  _entry public.network_waitlist%ROWTYPE;
  _email text;
BEGIN
  _email := lower(COALESCE(auth.jwt() ->> 'email', ''));
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT false, 'Please sign in to accept your invitation.';
    RETURN;
  END IF;

  IF _token IS NULL OR length(_token) < 32 THEN
    RETURN QUERY SELECT false, 'This invitation link is invalid.';
    RETURN;
  END IF;

  PERFORM public.expire_network_waitlist_invites();
  _token_hash := encode(digest(_token, 'sha256'), 'hex');

  SELECT * INTO _entry
  FROM public.network_waitlist
  WHERE invite_token_hash = _token_hash
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'This invitation link is invalid or has already been used.';
    RETURN;
  END IF;

  IF _entry.status <> 'invited'::public.network_waitlist_status THEN
    RETURN QUERY SELECT false, 'This invitation is no longer active.';
    RETURN;
  END IF;

  IF _entry.invite_expires_at <= now() THEN
    UPDATE public.network_waitlist
    SET status = 'expired'::public.network_waitlist_status,
        invite_token_hash = NULL,
        updated_at = now()
    WHERE id = _entry.id;
    RETURN QUERY SELECT false, 'This invitation has expired.';
    RETURN;
  END IF;

  IF lower(_entry.email) <> _email THEN
    RETURN QUERY SELECT false, 'Please sign in with the email address this invitation was sent to.';
    RETURN;
  END IF;

  UPDATE public.network_waitlist
  SET status = 'accepted'::public.network_waitlist_status,
      user_id = auth.uid(),
      invite_accepted_at = now(),
      invite_token_hash = NULL,
      updated_at = now()
  WHERE id = _entry.id;

  RETURN QUERY SELECT true, 'Invitation accepted.';
END;
$$;

CREATE OR REPLACE FUNCTION public.network_waitlist_analytics()
RETURNS TABLE(total_waitlist_users bigint, invite_conversion_rate numeric, average_time_to_acceptance_hours numeric, expired_invites bigint, active_network_members bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint AS total_waitlist_users,
    COALESCE(ROUND((COUNT(*) FILTER (WHERE status = 'accepted')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('invited','accepted','expired')), 0)) * 100, 2), 0) AS invite_conversion_rate,
    COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (invite_accepted_at - invite_date)) / 3600) FILTER (WHERE invite_accepted_at IS NOT NULL AND invite_date IS NOT NULL), 2), 0) AS average_time_to_acceptance_hours,
    COUNT(*) FILTER (WHERE status = 'expired')::bigint AS expired_invites,
    COUNT(*) FILTER (WHERE status = 'accepted')::bigint AS active_network_members
  FROM public.network_waitlist
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role);
$$;