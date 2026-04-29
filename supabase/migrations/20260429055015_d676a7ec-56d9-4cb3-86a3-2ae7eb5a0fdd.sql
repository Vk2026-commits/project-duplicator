CREATE OR REPLACE FUNCTION public.generate_network_waitlist_invite(_waitlist_id uuid)
RETURNS TABLE(invite_url text, invite_token text, recipient_email text, recipient_name text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token text;
  _token_hash text;
  _entry public.network_waitlist%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can generate network invitations';
  END IF;

  PERFORM public.expire_network_waitlist_invites();

  SELECT * INTO _entry
  FROM public.network_waitlist
  WHERE id = _waitlist_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Waitlist entry not found';
  END IF;

  IF _entry.status = 'accepted'::public.network_waitlist_status THEN
    RAISE EXCEPTION 'This waitlist member has already accepted an invitation';
  END IF;

  _token := encode(gen_random_bytes(32), 'hex');
  _token_hash := encode(digest(_token, 'sha256'), 'hex');

  UPDATE public.network_waitlist
  SET status = 'invited'::public.network_waitlist_status,
      invite_date = now(),
      invite_expires_at = now() + interval '48 hours',
      invite_token_hash = _token_hash,
      updated_at = now()
  WHERE id = _waitlist_id
  RETURNING * INTO _entry;

  RETURN QUERY SELECT
    ('https://faithnancial.com/network-invite?token=' || _token)::text,
    _token::text,
    _entry.email::text,
    trim(_entry.first_name || ' ' || _entry.last_name)::text,
    _entry.invite_expires_at;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_network_waitlist_invites() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_network_invite(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.network_waitlist_analytics() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_network_waitlist_invite(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.accept_network_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_network_waitlist_invites() TO authenticated;
GRANT EXECUTE ON FUNCTION public.network_waitlist_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_network_waitlist_invite(uuid) TO authenticated;