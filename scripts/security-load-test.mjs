import { performance } from 'node:perf_hooks'

const baseUrl = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const token = process.env.SECURITY_TEST_USER_TOKEN
const documentId = process.env.SECURITY_TEST_DOCUMENT_ID

const concurrency = Number(process.env.CONCURRENCY || 100)
const scenario = process.env.SCENARIO || 'document-url'

if (!baseUrl || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY')
  process.exit(1)
}

const endpoint = scenario === 'document-url'
  ? `${baseUrl}/functions/v1/get-document-url`
  : `${baseUrl}/auth/v1/user`

async function runOne() {
  const started = performance.now()
  const response = await fetch(endpoint, {
    method: scenario === 'document-url' ? 'POST' : 'GET',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(scenario === 'document-url' ? { body: JSON.stringify({ documentId }) } : {}),
  })
  await response.text()
  return { status: response.status, ms: performance.now() - started }
}

const results = await Promise.allSettled(Array.from({ length: concurrency }, runOne))
const fulfilled = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
const failed = results.length - fulfilled.length
const latencies = fulfilled.map((r) => r.ms).sort((a, b) => a - b)
const percentile = (p) => latencies[Math.floor((p / 100) * (latencies.length - 1))] || 0
const statuses = fulfilled.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] || 0) + 1
  return acc
}, {})

console.log(JSON.stringify({
  scenario,
  concurrency,
  completed: fulfilled.length,
  failed,
  statuses,
  latencyMs: {
    p50: Math.round(percentile(50)),
    p95: Math.round(percentile(95)),
    p99: Math.round(percentile(99)),
  },
}, null, 2))

if (failed > 0) process.exit(1)
