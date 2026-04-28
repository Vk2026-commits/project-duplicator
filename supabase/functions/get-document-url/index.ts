import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.25.76'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const BodySchema = z.object({
  documentId: z.string().uuid(),
})

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !serviceKey || !anonKey) {
    console.error('get-document-url missing environment configuration')
    return json({ error: 'Server configuration error' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const token = authHeader.replace('Bearer ', '')
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token)

  if (claimsError || !claimsData?.claims?.sub) {
    return json({ error: 'Invalid or expired token' }, 401)
  }

  let parsed: z.infer<typeof BodySchema>
  try {
    const body = await req.json()
    const result = BodySchema.safeParse(body)
    if (!result.success) return json({ error: 'Invalid request' }, 400)
    parsed = result.data
  } catch {
    return json({ error: 'Invalid request' }, 400)
  }

  const userId = claimsData.claims.sub as string
  const admin = createClient(supabaseUrl, serviceKey)

  try {
    const windowStart = new Date(Math.floor(Date.now() / 60000) * 60000).toISOString()
    const { data: requestCount, error: counterError } = await admin.rpc('increment_security_request_counter', {
      _user_id: userId,
      _action_type: 'document_signed_url',
      _window_start: windowStart,
    })

    if (counterError) {
      console.error('document request counter failed', { error: counterError.message, userId })
      return json({ error: 'Unable to access document' }, 500)
    }

    if (Number(requestCount) > 60) {
      await admin.from('document_access_log').insert({
        document_id: parsed.documentId,
        actor_id: userId,
        action_type: 'signed_url_request',
        access_result: 'denied',
        metadata: { reason: 'request_limit_exceeded' },
      })
      return json({ error: 'Too many requests' }, 429)
    }

    const { data: document, error: documentError } = await admin
      .from('startup_documents')
      .select('id, startup_id, file_path')
      .eq('id', parsed.documentId)
      .maybeSingle()

    if (documentError) {
      console.error('document lookup failed', { error: documentError.message, documentId: parsed.documentId })
      return json({ error: 'Unable to access document' }, 500)
    }

    if (!document?.file_path) {
      await admin.from('document_access_log').insert({
        document_id: parsed.documentId,
        actor_id: userId,
        action_type: 'signed_url_request',
        access_result: 'denied',
        metadata: { reason: 'document_not_found_or_no_file' },
      })
      return json({ error: 'Document not found' }, 404)
    }

    const { data: allowed, error: allowedError } = await admin.rpc('can_access_startup_document', {
      _user_id: userId,
      _document_id: parsed.documentId,
    })

    if (allowedError) {
      console.error('document authorization check failed', { error: allowedError.message, documentId: parsed.documentId })
      return json({ error: 'Unable to access document' }, 500)
    }

    if (!allowed) {
      await admin.from('document_access_log').insert({
        document_id: parsed.documentId,
        startup_id: document.startup_id,
        actor_id: userId,
        action_type: 'signed_url_request',
        access_result: 'denied',
        metadata: { reason: 'not_assigned_owner' },
      })
      return json({ error: 'Access denied' }, 403)
    }

    const { data: validPath, error: pathError } = await admin.rpc('validate_startup_document_path', {
      _startup_id: document.startup_id,
      _file_path: document.file_path,
    })

    if (pathError || !validPath) {
      console.error('invalid document storage path', { documentId: parsed.documentId, pathError: pathError?.message })
      return json({ error: 'Unable to access document' }, 500)
    }

    const { data: signed, error: signedError } = await admin.storage
      .from('startup-documents')
      .createSignedUrl(document.file_path, 300)

    if (signedError || !signed?.signedUrl) {
      console.error('signed URL creation failed', { error: signedError?.message, documentId: parsed.documentId })
      return json({ error: 'Unable to access document' }, 500)
    }

    await admin.from('document_access_log').insert({
      document_id: parsed.documentId,
      startup_id: document.startup_id,
      actor_id: userId,
      action_type: 'signed_url_request',
      access_result: 'granted',
      metadata: { expires_in_seconds: 300 },
    })

    return json({ signedUrl: signed.signedUrl, expiresIn: 300 })
  } catch (error) {
    console.error('unexpected get-document-url failure', { error })
    return json({ error: 'Unable to access document' }, 500)
  }
})
