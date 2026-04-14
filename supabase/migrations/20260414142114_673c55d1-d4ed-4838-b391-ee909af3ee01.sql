ALTER TABLE public.meetings ADD COLUMN meeting_link TEXT DEFAULT NULL;
ALTER TABLE public.calendar_tasks ADD COLUMN meeting_link TEXT DEFAULT NULL;