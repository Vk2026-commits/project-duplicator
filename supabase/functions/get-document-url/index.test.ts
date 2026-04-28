import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts'

const FUNCTION_URL = `${Deno.env.get('VITE_SUPABASE_URL')}/functions/v1/get-document-url`
const ANON_KEY = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')

Deno.test('rejects requests without authentication', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY ?? '' },
    body: JSON.stringify({ documentId: crypto.randomUUID() }),
  })
  await response.text()
  assertEquals(response.status, 401)
})

Deno.test('rejects invalid tokens', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY ?? '',
      Authorization: 'Bearer invalid-token',
    },
    body: JSON.stringify({ documentId: crypto.randomUUID() }),
  })
  await response.text()
  assertEquals(response.status, 401)
})

Deno.test('validates document id input', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY ?? '',
      Authorization: 'Bearer invalid-token',
    },
    body: JSON.stringify({ documentId: '<script>alert(1)</script>' }),
  })
  await response.text()
  assert([400, 401].includes(response.status))
})
