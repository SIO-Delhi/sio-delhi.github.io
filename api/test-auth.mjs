/**
 * Auth Security Test Script
 * Tests that public routes are open and protected routes require valid auth
 * Usage: node test-auth.mjs [api-url]
 */

const API_URL = process.argv[2] || 'https://api.siodelhi.org'

let pass = 0
let fail = 0

const green = (msg) => { console.log(`\x1b[32m✓ ${msg}\x1b[0m`); pass++ }
const red = (msg) => { console.log(`\x1b[31m✗ ${msg}\x1b[0m`); fail++ }

async function testRoute(method, path, headers = {}, expectedStatus, label) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    })
    if (res.status === expectedStatus) {
      green(`${label} => ${res.status}`)
    } else {
      red(`${label} => ${res.status} (expected ${expectedStatus})`)
    }
  } catch (err) {
    red(`${label} => ERROR: ${err.message}`)
  }
}

async function run() {
  console.log('==================================')
  console.log('  Auth Security Tests')
  console.log(`  API: ${API_URL}`)
  console.log('==================================\n')

  // ---- PUBLIC ROUTES (should return 200) ----
  console.log('--- Public Routes (should be accessible without auth) ---\n')

  await testRoute('GET', '/health', {}, 200, 'GET /health (open)')
  await testRoute('GET', '/sections', {}, 200, 'GET /sections (open)')
  await testRoute('GET', '/posts', {}, 200, 'GET /posts (open)')
  await testRoute('GET', '/popups/active', {}, 200, 'GET /popups/active (open)')

  // ---- PROTECTED ROUTES without token (should return 401) ----
  console.log('\n--- Protected Routes WITHOUT token (should return 401) ---\n')

  const protectedRoutes = [
    // Existing admin routes
    ['POST', '/sections'],
    ['PUT', '/sections/test-slug'],
    ['DELETE', '/sections/test-slug'],
    ['POST', '/posts'],
    ['PUT', '/posts/test-slug'],
    ['DELETE', '/posts/test-slug'],
    ['GET', '/popups'],
    ['POST', '/popups'],
    ['PUT', '/popups/test-id'],
    ['DELETE', '/popups/test-id'],
    ['POST', '/upload/image'],
    ['GET', '/stats'],
    ['GET', '/stats/storage'],
    ['GET', '/stats/database'],
    ['GET', '/forms'],
    ['GET', '/analytics/live'],
    ['GET', '/analytics/stats'],
    ['GET', '/analytics/locations'],
    ['GET', '/garbage'],

    // Portal — setup & auth
    ['POST', '/portal/setup'],
    ['POST', '/portal/seed'],
    ['POST', '/portal/auth/me'],

    // Portal — units
    ['GET', '/portal/units'],
    ['POST', '/portal/units'],
    ['PUT', '/portal/units/test-id'],
    ['DELETE', '/portal/units/test-id'],

    // Portal — users
    ['GET', '/portal/users'],
    ['GET', '/portal/users/test-id'],
    ['POST', '/portal/users'],
    ['PUT', '/portal/users/test-id'],
    ['DELETE', '/portal/users/test-id'],

    // Portal — titles
    ['PUT', '/portal/users/test-id/title'],
    ['DELETE', '/portal/users/test-id/title'],

    // Portal — avatars
    ['POST', '/portal/users/test-id/avatar'],
    ['DELETE', '/portal/users/test-id/avatar'],

    // Portal — dashboard & migrations
    ['GET', '/portal/dashboard/stats'],
    ['GET', '/portal/migrations'],
    ['POST', '/portal/migrations'],
    ['PUT', '/portal/migrations/test-id'],

    // Portal — messages
    ['GET', '/portal/messages'],
    ['POST', '/portal/messages'],
    ['PUT', '/portal/messages/test-id/read'],

    // Portal — performance forms
    ['GET', '/portal/performance/forms'],
    ['GET', '/portal/performance/forms/test-id'],
    ['POST', '/portal/performance/forms'],
    ['PUT', '/portal/performance/forms/test-id'],
    ['DELETE', '/portal/performance/forms/test-id'],
    ['GET', '/portal/performance/forms/test-id/responses'],
    ['POST', '/portal/performance/forms/test-id/respond'],

    // Portal — regions
    ['GET', '/portal/regions/test-id/units'],
  ]

  for (const [method, path] of protectedRoutes) {
    await testRoute(method, path, {}, 401, `${method} ${path} (no token => protected)`)
  }

  // ---- PROTECTED ROUTES with fake token (should return 401) ----
  console.log('\n--- Protected Routes WITH fake token (should return 401) ---\n')

  const fakeToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYWtlIiwiZXhwIjoxfQ.fake-signature'
  const fakeAuth = { Authorization: `Bearer ${fakeToken}` }

  const sampleProtected = [
    ['POST', '/sections'],
    ['GET', '/popups'],
    ['GET', '/stats'],
    ['GET', '/forms'],
    ['GET', '/analytics/live'],
    // Portal samples
    ['GET', '/portal/units'],
    ['GET', '/portal/users'],
    ['POST', '/portal/auth/me'],
    ['GET', '/portal/dashboard/stats'],
    ['GET', '/portal/performance/forms'],
    ['GET', '/portal/messages'],
  ]

  for (const [method, path] of sampleProtected) {
    await testRoute(method, path, fakeAuth, 401, `${method} ${path} + fake token (rejected)`)
  }

  // ---- MALFORMED AUTH HEADERS ----
  console.log('\n--- Malformed Auth Headers (should return 401) ---\n')

  // No "Bearer" prefix
  await testRoute('GET', '/stats', { Authorization: fakeToken }, 401, 'No Bearer prefix (rejected)')

  // Empty Authorization header
  await testRoute('GET', '/stats', { Authorization: '' }, 401, 'Empty auth header (rejected)')

  // Bearer with empty token
  await testRoute('GET', '/stats', { Authorization: 'Bearer ' }, 401, 'Bearer + empty token (rejected)')

  // Random string
  await testRoute('GET', '/stats', { Authorization: 'Bearer not-even-a-jwt' }, 401, 'Bearer + garbage (rejected)')

  // ---- SUMMARY ----
  console.log('\n==================================')
  console.log(`  Results: ${pass} passed, ${fail} failed`)
  console.log('==================================')

  process.exit(fail > 0 ? 1 : 0)
}

run()
