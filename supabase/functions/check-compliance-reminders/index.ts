import { createClient } from 'npm:@supabase/supabase-js@2'

// This edge function is called by pg_cron every 3 days.
// It checks which members have NOT signed all required onboarding agreements
// and sends them a reminder email. Members who have signed everything get
// a one-time thank-you email (tracked via email_send_log idempotency).

const REQUIRED_AGREEMENTS = ['operating_agreement', 'onboarding_packet']
const AGREEMENT_LABELS: Record<string, string> = {
  'operating_agreement': 'Operating Agreement',
  'onboarding_packet': 'Onboarding Packet',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables')
    return new Response(JSON.stringify({ error: 'Server config error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get all profiles (members)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')

  if (profilesError || !profiles) {
    console.error('Failed to fetch profiles', profilesError)
    return new Response(JSON.stringify({ error: 'Failed to fetch profiles' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Get all onboarding agreements
  const { data: agreements, error: agreementsError } = await supabase
    .from('onboarding_agreements')
    .select('user_id, agreement_type')

  if (agreementsError) {
    console.error('Failed to fetch agreements', agreementsError)
    return new Response(JSON.stringify({ error: 'Failed to fetch agreements' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Build a map of user_id -> set of signed agreement types
  const signedMap = new Map<string, Set<string>>()
  for (const a of (agreements || [])) {
    if (!signedMap.has(a.user_id)) {
      signedMap.set(a.user_id, new Set())
    }
    signedMap.get(a.user_id)!.add(a.agreement_type)
  }

  let remindersSent = 0
  let thankYouSent = 0

  for (const profile of profiles) {
    if (!profile.email) continue

    const signed = signedMap.get(profile.id) || new Set()
    const unsigned = REQUIRED_AGREEMENTS.filter(a => !signed.has(a))

    if (unsigned.length > 0) {
      // Send reminder
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'compliance-reminder',
            recipientEmail: profile.email,
            idempotencyKey: `compliance-reminder-${profile.id}-${new Date().toISOString().slice(0, 10)}`,
            templateData: {
              name: profile.full_name || undefined,
              unsignedAgreements: unsigned.map(a => AGREEMENT_LABELS[a] || a),
            },
          },
        })
        remindersSent++
      } catch (err) {
        console.error('Failed to send reminder', { userId: profile.id, error: err })
      }
    } else {
      // All signed — send thank-you (only once, using a stable idempotency key)
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'compliance-thank-you',
            recipientEmail: profile.email,
            idempotencyKey: `compliance-thankyou-${profile.id}`,
            templateData: {
              name: profile.full_name || undefined,
            },
          },
        })
        thankYouSent++
      } catch (err) {
        console.error('Failed to send thank-you', { userId: profile.id, error: err })
      }
    }
  }

  console.log(`Compliance check complete: ${remindersSent} reminders, ${thankYouSent} thank-yous`)

  return new Response(
    JSON.stringify({ success: true, remindersSent, thankYouSent }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
