/**
 * PlacementPro Migration Runner
 * Usage: node scripts/push-migrations.mjs [DB_PASSWORD]
 *
 * Get DB password from: Supabase Dashboard → Settings → Database → Database password
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pg from 'pg'

const __dir = dirname(fileURLToPath(import.meta.url))

const PROJECT_REF = 'vrhnxkdkbfqvwfxbahbw'
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyaG54a2RrYmZxdndmeGJhaGJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjE1MzQzMywiZXhwIjoyMTA3NzI5NDMzfQ.7d6VkoDCougLBdJ3-0voKe4EMkGrIccBSL9HbJ8yJK8'

const DB_PASSWORD = process.argv[2]

async function testSupabaseConnectivity() {
  console.log('\n🔗 Testing Supabase REST API connectivity...')
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // Test auth API
  const { data: authData } = await supabase.auth.getSession()
  console.log('  ✅ Supabase client initialized')

  // Test profiles table existence
  const { error: tblError } = await supabase.from('profiles').select('id').limit(1)
  if (tblError?.code === '42P01') {
    console.log('  ⚠️  Tables not yet created — migrations not run')
    return false
  } else if (tblError?.code === 'PGRST116') {
    console.log('  ✅ profiles table exists (empty)')
    return true
  } else if (!tblError) {
    console.log('  ✅ profiles table exists with data')
    return true
  } else {
    console.log(`  ⚠️  profiles table: ${tblError.message}`)
    return false
  }
}

async function pushMigrations(dbPassword) {
  console.log('\n📦 Running migrations via direct Postgres connection...')

  const client = new pg.Client({
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    await client.connect()
    console.log('  ✅ Connected to Postgres')

    const migrations = [
      join(__dir, '..', 'supabase', 'migrations', '001_initial_schema.sql'),
      join(__dir, '..', 'supabase', 'migrations', '002_seed_data.sql'),
    ]

    for (const migrationPath of migrations) {
      const filename = migrationPath.split(/[/\\]/).pop()
      try {
        const sql = readFileSync(migrationPath, 'utf8')
        await client.query(sql)
        console.log(`  ✅ Ran: ${filename}`)
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`  ⏭️  Skipped (already applied): ${filename}`)
        } else {
          console.error(`  ❌ Failed: ${filename} — ${err.message}`)
        }
      }
    }
  } catch (err) {
    console.error(`  ❌ Connection failed: ${err.message}`)
    console.log('\n  To get your DB password:')
    console.log('  → Supabase Dashboard → Settings → Database → "Database password"')
    console.log('  → Then run: node scripts/push-migrations.mjs YOUR_DB_PASSWORD\n')
  } finally {
    await client.end()
  }
}

async function testAuth() {
  console.log('\n🔐 Testing Supabase Auth API...')
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Test admin: list users
  const { data: users, error } = await supabase.auth.admin.listUsers({ perPage: 1 })
  if (!error) {
    console.log(`  ✅ Auth admin API works — ${users.users.length} users in project`)
  } else {
    console.log(`  ⚠️  Auth admin: ${error.message}`)
  }

  // Test anon signup (creates a throwaway test user)
  const anonClient = createClient(SUPABASE_URL,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyaG54a2RrYmZxdndmeGJhaGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTM0MzMsImV4cCI6MjEwNzcyOTQzM30.gotG11pSI_dCKLI-S-UjQl7ch7T_cexzZ_8wRYvOIzk'
  )
  const testEmail = `test_${Date.now()}@placementpro.test`
  const { data: signupData, error: signupError } = await anonClient.auth.signUp({
    email: testEmail,
    password: 'TestPass123!',
    options: { data: { full_name: 'Test User', role: 'student' } }
  })

  if (!signupError) {
    console.log(`  ✅ Auth signUp works — user created: ${testEmail}`)
    // Cleanup
    if (signupData.user?.id) {
      await supabase.auth.admin.deleteUser(signupData.user.id)
      console.log('  ✅ Test user cleaned up')
    }
  } else {
    console.log(`  ⚠️  Auth signUp: ${signupError.message}`)
  }
}

async function testTablesPost() {
  console.log('\n📋 Testing table operations...')
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const tables = ['profiles', 'students', 'assessments', 'companies', 'jobs', 'notifications']
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(0)
    const exists = !error || error.code !== '42P01'
    console.log(`  ${exists ? '✅' : '❌'} ${table}: ${exists ? 'OK' : 'missing (run migrations)'}`)
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('  PlacementPro — Backend Connectivity Test')
  console.log('='.repeat(60))
  console.log(`  Project: ${SUPABASE_URL}`)

  const tablesExist = await testSupabaseConnectivity()

  if (!tablesExist && DB_PASSWORD) {
    await pushMigrations(DB_PASSWORD)
    await testTablesPost()
  } else if (!tablesExist) {
    console.log('\n⚠️  Migrations not applied yet. To push:')
    console.log('  node scripts/push-migrations.mjs YOUR_DB_PASSWORD')
    console.log('  (Get password: Supabase Dashboard → Settings → Database)')
  } else {
    await testTablesPost()
  }

  await testAuth()

  console.log('\n' + '='.repeat(60))
  console.log('  Backend test complete.')
  console.log('='.repeat(60))
}

main().catch(console.error)
