CREATE UNIQUE INDEX IF NOT EXISTS network_waitlist_phone_unique_idx
ON public.network_waitlist (regexp_replace(phone, '[^0-9]+', '', 'g'))
WHERE phone IS NOT NULL AND regexp_replace(phone, '[^0-9]+', '', 'g') <> '';