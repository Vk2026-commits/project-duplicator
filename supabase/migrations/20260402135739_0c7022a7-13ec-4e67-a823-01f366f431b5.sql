
-- Create startup_documents table
CREATE TABLE public.startup_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  document_type text NOT NULL DEFAULT 'other',
  file_url text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.startup_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view startup documents" ON public.startup_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert startup documents" ON public.startup_documents FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update startup documents" ON public.startup_documents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete startup documents" ON public.startup_documents FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Create document_acknowledgments table
CREATE TABLE public.document_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.startup_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  acknowledged_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(document_id, user_id)
);

ALTER TABLE public.document_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acknowledgments" ON public.document_acknowledgments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all acknowledgments" ON public.document_acknowledgments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own acknowledgments" ON public.document_acknowledgments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for startup documents
INSERT INTO storage.buckets (id, name, public) VALUES ('startup-documents', 'startup-documents', true);

-- Storage policies
CREATE POLICY "Anyone can view startup documents" ON storage.objects FOR SELECT USING (bucket_id = 'startup-documents');
CREATE POLICY "Admins can upload startup documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'startup-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete startup documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'startup-documents' AND public.has_role(auth.uid(), 'admin'));
