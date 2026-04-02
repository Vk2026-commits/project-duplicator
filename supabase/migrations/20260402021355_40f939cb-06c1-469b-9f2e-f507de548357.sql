
UPDATE public.startups s
SET invested = sub.total
FROM (
  SELECT startup_id, COALESCE(SUM(amount_invested), 0) as total
  FROM public.startup_investors
  WHERE archived = false
  GROUP BY startup_id
) sub
WHERE s.id = sub.startup_id;
