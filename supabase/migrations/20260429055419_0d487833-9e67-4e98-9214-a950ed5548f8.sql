CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.schedule(
  'expire-network-waitlist-invites',
  '*/15 * * * *',
  $$SELECT public.expire_network_waitlist_invites();$$
)
WHERE NOT EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'expire-network-waitlist-invites'
);