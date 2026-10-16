/**
 * PlacementPro — Comprehensive Frontend & Backend Test
 * Run: node scripts/test.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vrhnxkdkbfqvwfxbahbw.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyaG54a2RrYmZxdndmeGJhaGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTM0MzMsImV4cCI6MjEwNzcyOTQzM30.gotG11pSI_dCKLI-S-UjQl7ch7T_cexzZ_8wRYvOIzk'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyaG54a2RrYmZxdndmeGJhaGJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjE1MzQzMywiZXhwIjoyMTA3NzI5NDMzfQ.7d6VkoDCougLBdJ3-0voKe4EMkGrIccBSL9HbJ8yJK8'

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

let passed = 0
let failed = 0

function ok(msg) { console.log(`  ✅ ${msg}`); passed++ }
function fail(msg) { console.log(`  ❌ ${msg}`); failed++ }
function warn(msg) { console.log(`  ⚠️  ${msg}`) }
function section(title) {
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`  ${title}`)
  console.log('─'.repeat(50))
}

// ─── 1. Connectivity ─────────────────────────────────
section('1. Supabase Connectivity')

async function testConnectivity() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
    headers: { apikey: ANON_KEY }
  })
  if (res.ok) {
    const data = await res.json()
    ok(`Auth service healthy (GoTrue ${data.version})`)
  } else {
    fail(`Auth service unreachable: ${res.status}`)
  }

  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  })
  if (res2.ok) {
    ok('PostgREST API reachable')
  } else {
    fail(`PostgREST unreachable: ${res2.status}`)
  }

  const res3 = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  })
  if (res3.ok || res3.status === 200) {
    ok('Storage API reachable')
  } else {
    warn(`Storage API: ${res3.status} — OK, may need buckets created`)
  }
}

// ─── 2. Schema Check ─────────────────────────────────
section('2. Schema / Migrations Check')

async function testSchema() {
  const tables = [
    'profiles', 'students', 'skills', 'assessments', 'question_bank',
    'assessment_attempts', 'assessment_results', 'readiness_scores',
    'skill_gap_reports', 'proctoring_events', 'companies', 'jobs',
    'job_matches', 'applications', 'interviews', 'placements', 'notifications'
  ]

  let missingCount = 0
  for (const table of tables) {
    const { error } = await admin.from(table).select('count').limit(0)
    if (!error) {
      ok(`Table exists: ${table}`)
    } else if (error.code === '42P01') {
      fail(`Table missing: ${table} — run migrations first`)
      missingCount++
    } else if (error.message?.includes('schema cache')) {
      fail(`Table missing: ${table} — schema not loaded`)
      missingCount++
    } else {
      warn(`Table ${table}: ${error.message}`)
    }
  }

  if (missingCount > 0) {
    console.log(`\n  📌 ${missingCount} tables missing. To create them:`)
    console.log('  1. Go to: https://supabase.com/dashboard/project/vrhnxkdkbfqvwfxbahbw/sql/new')
    console.log('  2. Paste and run: supabase/migrations/001_initial_schema.sql')
    console.log('  3. Then run: supabase/migrations/002_seed_data.sql')
    console.log('  4. OR: node scripts/push-migrations.mjs YOUR_DB_PASSWORD')
    console.log('     (DB password from: Settings → Database → "Database password")')
  }
  return missingCount === 0
}

// ─── 3. Auth Tests ───────────────────────────────────
section('3. Authentication')

async function testAuth(schemaReady) {
  // Test admin can list users
  const { data: users, error: listErr } = await admin.auth.admin.listUsers({ perPage: 5 })
  if (!listErr) {
    ok(`Auth admin API: ${users.users.length} existing users`)
  } else {
    fail(`Auth admin: ${listErr.message}`)
  }

  // Create test users for each role
  const testUsers = [
    { email: 'test.student@placementpro.dev', role: 'student', name: 'Test Student' },
    { email: 'test.admin@placementpro.dev', role: 'admin', name: 'Test Admin' },
    { email: 'test.partner@placementpro.dev', role: 'partner', name: 'Test Partner' },
  ]

  const createdIds = []
  for (const u of testUsers) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: 'TestPass123!',
      email_confirm: true,
      user_metadata: { full_name: u.name, role: u.role }
    })
    if (!error && data.user) {
      ok(`Created ${u.role} test user: ${u.email}`)
      createdIds.push(data.user.id)
    } else if (error?.message?.includes('already been registered')) {
      warn(`User ${u.email} already exists — skip`)
    } else {
      fail(`Create user ${u.role}: ${error?.message}`)
    }
  }

  // Test sign-in with anon client
  const anonClient = createClient(SUPABASE_URL, ANON_KEY)
  const { data: signIn, error: signInErr } = await anonClient.auth.signInWithPassword({
    email: 'test.student@placementpro.dev',
    password: 'TestPass123!'
  })
  if (!signInErr && signIn.user) {
    ok(`Sign-in works — student JWT issued`)
    const payload = JSON.parse(atob(signIn.session.access_token.split('.')[1]))
    ok(`JWT role claim: ${payload.role ?? 'none (profiles table trigger needed)'}`)
    await anonClient.auth.signOut()
  } else {
    fail(`Sign-in: ${signInErr?.message}`)
  }

  // If schema ready, test that profile trigger fired
  if (schemaReady && createdIds.length > 0) {
    const { data: prof, error: profErr } = await admin
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('id', createdIds[0])
      .single()

    if (!profErr && prof) {
      ok(`Profile trigger fired: ${prof.email} (role: ${prof.role})`)
    } else {
      warn(`Profile not auto-created: ${profErr?.message} — trigger may need checking`)
    }
  }

  // Cleanup test users
  for (const id of createdIds) {
    await admin.auth.admin.deleteUser(id)
  }
  if (createdIds.length > 0) ok('Test users cleaned up')
}

// ─── 4. Storage Check ────────────────────────────────
section('4. Storage Buckets')

async function testStorage() {
  const { data: buckets, error } = await admin.storage.listBuckets()
  if (!error) {
    const expected = ['resumes', 'certificates', 'company-logos', 'offer-letters', 'proctoring-snapshots']
    const existing = buckets.map(b => b.name)

    for (const bucket of expected) {
      if (existing.includes(bucket)) {
        ok(`Bucket exists: ${bucket}`)
      } else {
        warn(`Bucket missing: ${bucket} — creating...`)
        const { error: createErr } = await admin.storage.createBucket(bucket, { public: false })
        if (!createErr) {
          ok(`Bucket created: ${bucket}`)
        } else {
          fail(`Bucket create ${bucket}: ${createErr.message}`)
        }
      }
    }
  } else {
    fail(`Storage list: ${error.message}`)
  }
}

// ─── 5. Seed Data Check ──────────────────────────────
section('5. Seed Data')

async function testSeedData(schemaReady) {
  if (!schemaReady) {
    warn('Skipping — tables not yet created')
    return
  }

  const { count: skillCount } = await admin.from('skills').select('*', { count: 'exact', head: true })
  if (skillCount > 0) ok(`Skills seeded: ${skillCount} skills`)
  else warn('No skills found — seed data may not have run')

  const { count: qCount } = await admin.from('question_bank').select('*', { count: 'exact', head: true })
  if (qCount > 0) ok(`Questions seeded: ${qCount} questions`)
  else warn('No questions found — run 002_seed_data.sql')

  const { count: aCount } = await admin.from('assessments').select('*', { count: 'exact', head: true })
  if (aCount > 0) ok(`Assessments seeded: ${aCount} assessments`)
  else warn('No assessments found — run 002_seed_data.sql')
}

// ─── 6. Frontend Build Check ─────────────────────────
section('6. Frontend Build')

async function testFrontend() {
  const { existsSync } = await import('fs')
  const { join, dirname } = await import('path')
  const { fileURLToPath } = await import('url')
  const __dir = dirname(fileURLToPath(import.meta.url))

  const distPath = join(__dir, '..', 'web', 'dist', 'index.html')
  const envPath = join(__dir, '..', 'web', '.env.local')

  if (existsSync(distPath)) {
    ok('Production build exists (web/dist/index.html)')
  } else {
    warn('No production build — run: cd web && npm run build')
  }

  if (existsSync(envPath)) {
    const env = (await import('fs')).readFileSync(envPath, 'utf8')
    if (env.includes('vrhnxkdkbfqvwfxbahbw')) {
      ok('Frontend env configured with correct Supabase URL')
    } else {
      fail('Frontend env missing Supabase URL')
    }
    if (env.includes('VITE_SUPABASE_ANON_KEY')) {
      ok('Frontend anon key configured')
    } else {
      fail('Frontend anon key missing')
    }
  } else {
    fail('.env.local missing — Supabase credentials not configured')
  }

  // Check key source files
  const srcFiles = [
    'web/src/App.tsx',
    'web/src/lib/supabase.ts',
    'web/src/contexts/AuthContext.tsx',
    'web/src/pages/auth/LoginPage.tsx',
    'web/src/pages/student/Dashboard.tsx',
    'web/src/pages/admin/Dashboard.tsx',
    'web/src/pages/partner/PostJob.tsx',
    'web/src/pages/student/AssessmentTake.tsx',
    'web/src/pages/student/PlacementTracking.tsx',
  ]
  const missing = srcFiles.filter(f => !existsSync(join(__dir, '..', f)))
  if (missing.length === 0) {
    ok(`All 9 screen source files present`)
  } else {
    fail(`Missing source files: ${missing.join(', ')}`)
  }
}

// ─── Main ─────────────────────────────────────────────
async function main() {
  console.log('╔' + '═'.repeat(58) + '╗')
  console.log('║  PlacementPro — Full System Test                         ║')
  console.log('║  Project: vrhnxkdkbfqvwfxbahbw.supabase.co               ║')
  console.log('╚' + '═'.repeat(58) + '╝')

  await testConnectivity()
  const schemaReady = await testSchema()
  await testAuth(schemaReady)
  await testStorage()
  await testSeedData(schemaReady)
  await testFrontend()

  section('Test Summary')
  console.log(`  Passed: ${passed}  Failed: ${failed}`)
  if (failed === 0) {
    console.log('  🎉 All checks passed!')
  } else if (!schemaReady) {
    console.log('  📌 Run migrations to fix remaining failures:')
    console.log('     https://supabase.com/dashboard/project/vrhnxkdkbfqvwfxbahbw/sql/new')
    console.log('     Paste: supabase/migrations/001_initial_schema.sql → Run')
    console.log('     Paste: supabase/migrations/002_seed_data.sql → Run')
    console.log('     Then re-run: node scripts/test.mjs')
  } else {
    console.log('  Some checks failed — see details above.')
  }
  console.log('═'.repeat(60))
}

main().catch(console.error)
