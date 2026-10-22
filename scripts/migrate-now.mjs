import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env from project root
const __d = dirname(fileURLToPath(import.meta.url))
const envPath = join(__d, '..', '.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('
')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
)

const SUPABASE_URL  = env.SUPABASE_URL  ?? ''
const SERVICE_KEY   = env.SUPABASE_SERVICE_KEY ?? ''
const ANON_KEY      = env.SUPABASE_ANON_KEY    ?? ''
const PROJECT_REF   = env.PROJECT_REF  ?? 'vrhnxkdkbfqvwfxbahbw'
const POOLER_HOST   = env.POOLER_HOST  ?? 'aws-0-ap-south-1.pooler.supabase.com'

/**
 * PlacementPro — One-Command Migration Runner
 * ─────────────────────────────────────────────
 * Usage:  node scripts/migrate-now.mjs
 *
 * Your Supabase DB password was just opened in your browser at:
 * https://supabase.com/dashboard/project/vrhnxkdkbfqvwfxbahbw/settings/database
 *
 * Scroll to "Database password" and copy it, then paste it here.
 */

import pg from 'pg'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline'

const __dir = dirname(fileURLToPath(import.meta.url))

const PROJECT_REF  = 'vrhnxkdkbfqvwfxbahbw'
const POOLER_HOST  = 'aws-0-ap-south-1.pooler.supabase.com'
const POOLER_PORT  = 6543
const DB_USER      = `postgres.${PROJECT_REF}`

// ── Password input ─────────────────────────────────────────────────────────
async function askPassword() {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    // Hide password input on Linux/Mac; on Windows it stays visible
    rl.question('\n  Enter your Supabase DB password: ', answer => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

// ── Run SQL file statement by statement ────────────────────────────────────
async function runFile(client, filePath) {
  const name = filePath.split(/[\\/]/).pop()
  if (!existsSync(filePath)) {
    console.log(`  ⚠️  Not found: ${name} — skipping`)
    return
  }
  process.stdout.write(`  ⏳ Running ${name}… `)
  const sql = readFileSync(filePath, 'utf8')

  // Split on statement endings, keeping single-line comments stripped
  const statements = sql
    .replace(/--[^\n]*/g, '')       // strip comments
    .split(/;\s*(\n|$)/)            // split on ; at line end
    .map(s => s.trim())
    .filter(s => s.length > 5)

  let ok = 0, skipped = 0, errors = 0
  for (const stmt of statements) {
    try {
      await client.query(stmt + ';')
      ok++
    } catch (err) {
      const msg = err.message ?? ''
      if (
        msg.includes('already exists') ||
        msg.includes('duplicate key') ||
        msg.includes('duplicate_object')
      ) {
        skipped++
      } else {
        errors++
        // Non-fatal errors (e.g. trying to recreate policies) — log briefly
        if (!msg.includes('policy already exists')) {
          console.log(`\n  ⚠️  ${msg.slice(0, 100)}`)
        }
      }
    }
  }
  console.log(`✅  (${ok} ok, ${skipped} already existed, ${errors} non-fatal)`)
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '═'.repeat(60))
  console.log('  PlacementPro — Database Migration')
  console.log('  Pooler: ' + POOLER_HOST)
  console.log('═'.repeat(60))
  console.log('\n  Your Supabase Settings page has been opened in your browser.')
  console.log('  Go to "Database Settings" and copy your Database password.')

  const password = process.argv[2] ?? await askPassword()

  if (!password) {
    console.error('\n  ❌ No password provided. Exiting.\n')
    process.exit(1)
  }

  const client = new pg.Client({
    host:     POOLER_HOST,
    port:     POOLER_PORT,
    database: 'postgres',
    user:     DB_USER,
    password,
    ssl:  { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    statement_timeout:       120000,
  })

  try {
    process.stdout.write('\n  🔗 Connecting… ')
    await client.connect()
    console.log('✅ Connected!\n')
  } catch (err) {
    console.error(`\n  ❌ Connection failed: ${err.message}`)
    console.error('\n  Wrong password? Copy it from:')
    console.error('  https://supabase.com/dashboard/project/vrhnxkdkbfqvwfxbahbw/settings/database\n')
    process.exit(1)
  }

  const migrations = [
    join(__dir, '..', 'supabase', 'migrations', '001_initial_schema.sql'),
    join(__dir, '..', 'supabase', 'migrations', '002_seed_data.sql'),
  ]

  console.log('  📦 Running migrations…\n')
  for (const m of migrations) await runFile(client, m)

  // Verify
  console.log('\n  📋 Verifying tables…')
  const tables = ['profiles', 'students', 'assessments', 'companies', 'jobs', 'notifications', 'interviews']
  let allOk = true
  for (const t of tables) {
    const { rows } = await client.query(
      `SELECT COUNT(*) as c FROM information_schema.tables
       WHERE table_schema='public' AND table_name=$1`, [t]
    )
    const exists = parseInt(rows[0].c) > 0
    if (!exists) allOk = false
    console.log(`  ${exists ? '✅' : '❌'} ${t}`)
  }

  await client.end()

  console.log('\n' + '═'.repeat(60))
  if (allOk) {
    console.log('  🎉 All migrations applied successfully!')
    console.log('\n  Next steps:')
    console.log('  1. Run: node scripts/test.mjs   (full system verification)')
    console.log('  2. Start frontend: cd web && npm run dev')
    console.log('  3. Login with any account from CREDENTIALS.md')
  } else {
    console.log('  ⚠️  Some tables missing — check errors above.')
    console.log('  Try again or paste SQL manually at:')
    console.log('  https://supabase.com/dashboard/project/vrhnxkdkbfqvwfxbahbw/sql/new')
  }
  console.log('═'.repeat(60) + '\n')
}

main().catch(err => {
  console.error('\n❌ Unexpected error:', err.message)
  process.exit(1)
})
