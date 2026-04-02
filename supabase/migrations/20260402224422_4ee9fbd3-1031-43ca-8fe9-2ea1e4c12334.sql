
-- Calendar tasks table for the Year 1 execution roadmap
CREATE TABLE public.calendar_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase integer NOT NULL DEFAULT 1,
  phase_name text NOT NULL,
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  due_date_end date,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'not_started',
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_rule text,
  is_milestone boolean NOT NULL DEFAULT false,
  color text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_tasks ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all tasks
CREATE POLICY "Authenticated users can view calendar tasks"
  ON public.calendar_tasks FOR SELECT TO authenticated
  USING (true);

-- Admins can manage tasks
CREATE POLICY "Admins can insert calendar tasks"
  ON public.calendar_tasks FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update calendar tasks"
  ON public.calendar_tasks FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete calendar tasks"
  ON public.calendar_tasks FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Members can update status of tasks assigned to them
CREATE POLICY "Assigned users can update own tasks"
  ON public.calendar_tasks FOR UPDATE TO authenticated
  USING (auth.uid() = assigned_to);
