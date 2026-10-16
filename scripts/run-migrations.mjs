/**
 * PlacementPro Migration Runner
 * ─────────────────────────────
 * Pushes all SQL migrations to your Supabase project.
 *
 * Usage:
 *   node scripts/run-migrations.mjs <DB_PASSWORD>
 *
 * Get your DB password:
 *   Supabase Dashboard → Settings → Database → "Database password"
 *   OR reset it there if you don't remember it.
 *
 * The connection string format Supabase uses:
 *   Host:     db.vrhnxkdkbfqvwfxbahbw.supabase.co
 *   Port:     5432
 *   Database: postgres
 *   User:     postgres
 *   Password: <your project password>
 */

import pg from 'pg'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const PROJECT_REF = 'vrhnxkdkbfqvwfxbahbw'

const DB_PASSWORD = process.argv[2]

if (!DB_PASSWORD) {
  console.error('\n❌  Missing database password.')
  console.error('\n   Get it from:')
  console.error('   https://supabase.com/dashboard/project/vrhnxkdkbfqvwfxbahbw/settings/database')
  console.error('\n   Then run:')
  console.error('   node scripts/run-migrations.mjs YOUR_DB_PASSWORD\n')
  process.exit(1)
}

const MIGRATIONS = [
  join(__dir, '..', 'supabase', 'migrations', '001_initial_schema.sql'),
  join(__dir, '..', 'supabase', 'migrations', '002_seed_data.sql'),
]

async function run() {
  console.log('\n' + '═'.repeat(60))
  console.log('  PlacementPro — Running Migrations')
  console.log('  Project: ' + PROJECT_REF + '.supabase.co')
  console.log('═'.repeat(60))

  const client = new pg.Client({
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    statement_timeout: 120000,
  })

  try {
    console.log('\n🔗 Connecting to database…')
    await client.connect()
    console.log('  ✅ Connected\n')

    for (const migPath of MIGRATIONS) {
      const name = migPath.split(/[\\/]/).pop()
      if (!existsSync(migPath)) {
        console.log(`  ⚠️  Not found: ${name} — skipping`)
        continue
      }

      process.stdout.write(`  ⏳ Running ${name}… `)
      const sql = readFileSync(migPath, 'utf8')

      // Split on statement boundaries for better error reporting
      const statements = sql
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      let ok = 0
      let skipped = 0
      for (const stmt of statements) {
        try {
          await client.query(stmt + ';')
          ok++
        } catch (err) {
          const msg = err.message ?? ''
          if (
            msg.includes('already exists') ||
            msg.includes('duplicate key') ||
            msg.includes('already been registered')
          ) {
            skipped++
          } else {
            console.log(`\n  ❌ Error in ${name}:\n     ${msg}`)
            console.log(`     Statement: ${stmt.slice(0, 100)}...`)
          }
        }
      }
      console.log(`✅  (${ok} statements, ${skipped} skipped as already exist)`)
    }

    // Verify key tables
    console.log('\n📋 Verifying schema…')
    const tables = ['profiles', 'students', 'assessments', 'companies', 'jobs', 'notifications']
    for (const t of tables) {
      const { rows } = await client.query(
        `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
        [t]
      )
      const exists = rows[0].count > 0
      console.log(`  ${exists ? '✅' : '❌'} ${t}`)
    }

    console.log('\n' + '═'.repeat(60))
    console.log('  ✅ Migrations complete!')
    console.log('  Run: node scripts/test.mjs  to verify everything')
    console.log('═'.repeat(60) + '\n')
  } catch (err) {
    console.error(`\n❌ Connection failed: ${err.message}`)
    console.error('\nDouble-check your password at:')
    console.error('https://supabase.com/dashboard/project/vrhnxkdkbfqvwfxbahbw/settings/database\n')
    process.exit(1)
  } finally {
    await client.end().catch(() => {})
  }
}

run()
