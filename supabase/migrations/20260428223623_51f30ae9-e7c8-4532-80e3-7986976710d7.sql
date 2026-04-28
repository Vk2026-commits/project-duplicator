-- Security hardening: private document storage and audit logging

-- Admin action audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can view admin audit log"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can create audit events" ON public.admin_audit_log;
CREATE POLICY "Admins can create audit events"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = admin_id);

DROP POLICY IF EXISTS "Service role can create audit events" ON public.admin_audit_log;
CREATE POLICY "Service role can create audit events"
ON public.admin_audit_log
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_created ON public.admin_audit_log (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_created ON public.admin_audit_log (action_type, created_at DESC);

-- Document access audit log
CREATE TABLE IF NOT EXISTS public.document_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid,
  startup_id uuid,
  actor_id uuid,
  action_type text NOT NULL,
  access_result text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view document access log" ON public.document_access_log;
CREATE POLICY "Admins can view document access log"
ON public.document_access_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can create own document access events" ON public.document_access_log;
CREATE POLICY "Authenticated users can create own document access events"
ON public.document_access_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = actor_id);

DROP POLICY IF EXISTS "Service role can create document access events" ON public.document_access_log;
CREATE POLICY "Service role can create document access events"
ON public.document_access_log
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_document_access_log_doc_created ON public.document_access_log (document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_access_log_actor_created ON public.document_access_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_access_log_result_created ON public.document_access_log (access_result, created_at DESC);

-- Store private storage object paths instead of public URLs for startup documents.
ALTER TABLE public.startup_documents
ADD COLUMN IF NOT EXISTS file_path text;

UPDATE public.startup_documents
SET file_path = CASE
  WHEN file_url IS NULL OR btrim(file_url) = '' THEN file_path
  WHEN file_url LIKE '%/storage/v1/object/public/startup-documents/%'
    THEN split_part(file_url, '/storage/v1/object/public/startup-documents/', 2)
  WHEN file_url NOT LIKE 'http%' THEN file_url
  ELSE file_path
END
WHERE file_path IS NULL;

-- Existing UI code can keep using file_url while new code writes file_path only.
-- Tighten document metadata visibility to assigned users and admins only.
DROP POLICY IF EXISTS "Authenticated users can view startup documents" ON public.startup_documents;
CREATE POLICY "Assigned users and admins can view startup documents"
ON public.startup_documents
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1
    FROM public.profile_startup_links psl
    WHERE psl.startup_id = startup_documents.startup_id
      AND psl.profile_id = auth.uid()
  )
);

-- Make document bucket private and remove direct public object access for startup documents.
UPDATE storage.buckets
SET public = false
WHERE id = 'startup-documents';

DROP POLICY IF EXISTS "Startup documents are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view startup documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view startup documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view startup documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view startup documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload startup documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update startup documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete startup documents" ON storage.objects;

CREATE POLICY "Admins can upload startup documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'startup-documents'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update startup documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'startup-documents'
  AND public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'startup-documents'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete startup documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'startup-documents'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Private signed URLs are generated by backend code with explicit ownership validation.
CREATE OR REPLACE FUNCTION public.validate_startup_document_path(_startup_id uuid, _file_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _file_path IS NOT NULL
    AND _file_path !~ '(^|/)\.\.(/|$)'
    AND _file_path LIKE (_startup_id::text || '/%')
$$;

CREATE OR REPLACE FUNCTION public.can_access_startup_document(_user_id uuid, _document_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.startup_documents sd
    JOIN public.profile_startup_links psl ON psl.startup_id = sd.startup_id
    WHERE sd.id = _document_id
      AND psl.profile_id = _user_id
  )
$$;