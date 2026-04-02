CREATE OR REPLACE FUNCTION public.sync_startup_invested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _startup_id uuid;
  _total numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _startup_id := OLD.startup_id;
  ELSE
    _startup_id := NEW.startup_id;
  END IF;

  SELECT COALESCE(SUM(amount_invested), 0) INTO _total
  FROM public.startup_investors
  WHERE startup_id = _startup_id AND archived = false;

  UPDATE public.startups SET invested = _total, current_value = _total WHERE id = _startup_id;

  IF TG_OP = 'UPDATE' AND OLD.startup_id IS DISTINCT FROM NEW.startup_id THEN
    SELECT COALESCE(SUM(amount_invested), 0) INTO _total
    FROM public.startup_investors
    WHERE startup_id = OLD.startup_id AND archived = false;

    UPDATE public.startups SET invested = _total, current_value = _total WHERE id = OLD.startup_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;