-- Tighten helper function execution and add ad-hoc per-user request counters for explicit security requirement.

CREATE TABLE IF NOT EXISTS public.security_request_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, action_type, window_start)
);

ALTER TABLE public.security_request_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage security request counters" ON public.security_request_counters;
CREATE POLICY "Service role can manage security request counters"
ON public.security_request_counters
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_security_request_counters_user_action_window
ON public.security_request_counters (user_id, action_type, window_start DESC);

CREATE OR REPLACE FUNCTION public.increment_security_request_counter(
  _user_id uuid,
  _action_type text,
  _window_start timestamptz
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  INSERT INTO public.security_request_counters (user_id, action_type, window_start, request_count, updated_at)
  VALUES (_user_id, _action_type, _window_start, 1, now())
  ON CONFLICT (user_id, action_type, window_start)
  DO UPDATE SET request_count = public.security_request_counters.request_count + 1,
                updated_at = now()
  RETURNING request_count INTO _count;

  RETURN _count;
END;
$$;

-- Recreate existing SECURITY DEFINER queue helpers with fixed search_path.
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

-- Prevent anonymous/direct public invocation of security-definer helpers.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_startup_invested() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_startup_document_path(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_access_startup_document(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_security_request_counter(uuid, text, timestamptz) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_startup_document_path(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_startup_document(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_security_request_counter(uuid, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;