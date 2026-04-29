import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

type WaitlistBody = {
  action?: 'join' | 'invite'
  entryId?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  occupation?: string
  interestType?: 'learn' | 'invest' | 'build_wealth' | 'partnership' | 'other'
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const clean = (value?: string) => value?.trim() ?? ''
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return json({ error: 'Server configuration error' }, 500)

  const adminClient = createClient(supabaseUrl, serviceKey)
  const authHeader = req.headers.get('Authorization') ?? ''

  let body: WaitlistBody
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  if (body.action === 'invite') {
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Please sign in as an admin.' }, 401)
    if (!body.entryId) return json({ error: 'Waitlist entry is required.' }, 400)

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } })
    const { data: invite, error } = await userClient.rpc('generate_network_waitlist_invite', { _waitlist_id: body.entryId }).single()
    if (error) return json({ error: error.message }, 400)

    const firstName = String(invite.recipient_name ?? '').split(' ')[0]
    const emailResult = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({
        templateName: 'network-invite',
        recipientEmail: invite.recipient_email,
        idempotencyKey: `network-invite-${body.entryId}-${Date.now()}`,
        templateData: { firstName, inviteUrl: invite.invite_url, expiresIn: '48 hours' },
      }),
    })
    if (!emailResult.ok) return json({ error: 'Invitation was created, but the email could not be sent.' }, 500)
    return json({ success: true, inviteUrl: invite.invite_url })
  }

  const firstName = clean(body.firstName)
  const lastName = clean(body.lastName)
  const email = clean(body.email).toLowerCase()
  const occupation = clean(body.occupation)
  const interestType = body.interestType ?? 'learn'
  if (!firstName || !lastName || !occupation || !isEmail(email)) return json({ error: 'Please complete all required fields.' }, 400)

  let userId: string | null = null
  if (authHeader.startsWith('Bearer ')) {
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } })
    const { data } = await userClient.auth.getUser()
    userId = data.user?.id ?? null
  }

  const { data: existing } = await adminClient.from('network_waitlist').select('id, status').ilike('email', email).maybeSingle()
  const payload = {
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: clean(body.phone) || null,
    occupation,
    interest_type: interestType,
    status: existing?.status === 'accepted' ? 'accepted' : 'waiting',
    tags: ['Waitlist - Network'],
  }

  const result = existing
    ? await adminClient.from('network_waitlist').update(payload).eq('id', existing.id).select('id').single()
    : await adminClient.from('network_waitlist').insert(payload).select('id').single()
  if (result.error) return json({ error: result.error.message }, 400)

  await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
    body: JSON.stringify({
      templateName: 'network-waitlist-confirmation',
      recipientEmail: email,
      idempotencyKey: `network-waitlist-${result.data.id}`,
      templateData: { firstName },
    }),
  })

  return json({ success: true })
})