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
 * PlacementPro — Seed demo accounts
 * Creates: 10 students, 1 admin, 5 industry partners
 * Run: node scripts/seed-users.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = SUPABASE_URL
const SERVICE_KEY  = SERVICE_KEY

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ── Account definitions ────────────────────────────────────────────

const STUDENTS = [
  { name: 'Rahul Sharma',     email: 'rahul.sharma@student.placementpro.dev',     dept: 'Computer Science',       cgpa: 8.5, backlogs: 0 },
  { name: 'Priya Mehta',      email: 'priya.mehta@student.placementpro.dev',      dept: 'Information Technology', cgpa: 7.8, backlogs: 1 },
  { name: 'Arjun Nair',       email: 'arjun.nair@student.placementpro.dev',       dept: 'Electronics',            cgpa: 9.1, backlogs: 0 },
  { name: 'Sneha Patel',      email: 'sneha.patel@student.placementpro.dev',      dept: 'Computer Science',       cgpa: 6.5, backlogs: 2 },
  { name: 'Karthik Rajan',    email: 'karthik.rajan@student.placementpro.dev',    dept: 'Mechanical',             cgpa: 7.2, backlogs: 0 },
  { name: 'Aisha Khan',       email: 'aisha.khan@student.placementpro.dev',       dept: 'Information Technology', cgpa: 8.9, backlogs: 0 },
  { name: 'Vikram Singh',     email: 'vikram.singh@student.placementpro.dev',     dept: 'Computer Science',       cgpa: 7.4, backlogs: 1 },
  { name: 'Divya Reddy',      email: 'divya.reddy@student.placementpro.dev',      dept: 'Electronics',            cgpa: 8.2, backlogs: 0 },
  { name: 'Rohan Gupta',      email: 'rohan.gupta@student.placementpro.dev',      dept: 'Computer Science',       cgpa: 6.9, backlogs: 3 },
  { name: 'Meera Iyer',       email: 'meera.iyer@student.placementpro.dev',       dept: 'Information Technology', cgpa: 9.3, backlogs: 0 },
]

const ADMIN = [
  { name: 'Dr. S. Krishnamurthy', email: 'admin@placementpro.dev', dept: 'Placement Cell' },
]

const PARTNERS = [
  { name: 'Google Recruiter',    email: 'recruit@google.placementpro.dev',    company: 'Google',    industry: 'Technology' },
  { name: 'Microsoft HR',        email: 'recruit@microsoft.placementpro.dev', company: 'Microsoft', industry: 'Technology' },
  { name: 'TCS Campus Team',     email: 'recruit@tcs.placementpro.dev',       company: 'TCS',       industry: 'IT Services' },
  { name: 'Infosys Campus',      email: 'recruit@infosys.placementpro.dev',   company: 'Infosys',   industry: 'IT Services' },
  { name: 'Wipro Technologies',  email: 'recruit@wipro.placementpro.dev',     company: 'Wipro',     industry: 'IT Services' },
]

const PASSWORD = 'PlacementPro@2026'

// ── Create a single user ───────────────────────────────────────────

async function createUser(email, name, role, extra = {}) {
  // Check if already exists
  const { data: existing } = await admin.auth.admin.listUsers()
  const found = existing?.users?.find(u => u.email === email)
  if (found) {
    console.log(`  ⏭  Already exists: ${email}`)
    return { id: found.id, email, existed: true }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: name, role, ...extra },
  })

  if (error) {
    console.error(`  ❌ ${email}: ${error.message}`)
    return null
  }

  console.log(`  ✅ ${role.padEnd(8)} | ${name.padEnd(24)} | ${email}`)
  return { id: data.user.id, email, existed: false }
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(65))
  console.log('  PlacementPro — Creating Demo Accounts')
  console.log('='.repeat(65))

  const results = { students: [], admin: [], partners: [] }

  // Students
  console.log('\n👩‍🎓 Students (10):')
  for (const s of STUDENTS) {
    const r = await createUser(s.email, s.name, 'student', {
      department: s.dept, cgpa: s.cgpa, backlogs: s.backlogs
    })
    if (r) results.students.push({ ...s, id: r.id, password: PASSWORD })
  }

  // Admin
  console.log('\n🛡️  Admin (1):')
  for (const a of ADMIN) {
    const r = await createUser(a.email, a.name, 'admin', { department: a.dept })
    if (r) results.admin.push({ ...a, id: r.id, password: PASSWORD })
  }

  // Partners
  console.log('\n🏢 Industry Partners (5):')
  for (const p of PARTNERS) {
    const r = await createUser(p.email, p.name, 'partner', {
      company: p.company, industry: p.industry
    })
    if (r) results.partners.push({ ...p, id: r.id, password: PASSWORD })
  }

  // ── Write credentials markdown ────────────────────────────────────

  const now = new Date().toISOString().slice(0, 10)
  const md = `# PlacementPro — Demo Account Credentials

> **⚠️ PRIVATE — Never commit this file. It is listed in .gitignore.**
> Generated: ${now}

**App URL:** http://localhost:5173
**Supabase Project:** https://supabase.com/dashboard/project/vrhnxkdkbfqvwfxbahbw
**Default Password for all accounts:** \`${PASSWORD}\`

---

## 🛡️ Admin (1)

| Name | Email | Password |
|------|-------|----------|
${results.admin.map(a => `| ${a.name} | \`${a.email}\` | \`${a.password}\` |`).join('\n')}

Login → select **"Login as Admin"** on the home screen.

---

## 👩‍🎓 Students (10)

| Name | Email | Department | CGPA | Backlogs |
|------|-------|------------|------|----------|
${results.students.map(s =>
  `| ${s.name} | \`${s.email}\` | ${s.dept} | ${s.cgpa} | ${s.backlogs} |`
).join('\n')}

Password for all: \`${PASSWORD}\`
Login → select **"Login as Student"** on the home screen.

---

## 🏢 Industry Partners (5)

| Name | Email | Company | Industry |
|------|-------|---------|----------|
${results.partners.map(p =>
  `| ${p.name} | \`${p.email}\` | ${p.company} | ${p.industry} |`
).join('\n')}

Password for all: \`${PASSWORD}\`
Login → select **"Login as Industry Partner"** on the home screen.

---

## Quick Login Reference

\`\`\`
Role      | Email                                    | Password
----------|------------------------------------------|------------------
Admin     | admin@placementpro.dev                   | ${PASSWORD}
Student   | rahul.sharma@student.placementpro.dev    | ${PASSWORD}
Partner   | recruit@google.placementpro.dev          | ${PASSWORD}
\`\`\`

---

## Notes

- Email confirmation is **pre-confirmed** (no inbox check needed).
- All students were created with realistic academic profiles.
- Partner accounts are pending company verification by the admin.
- To reset a password: Supabase Dashboard → Authentication → Users → Reset.
`

  const credPath = join(__dir, '..', 'CREDENTIALS.md')
  writeFileSync(credPath, md, 'utf8')
  console.log('\n📄 Credentials written to: CREDENTIALS.md')

  // Summary
  const total = results.students.length + results.admin.length + results.partners.length
  console.log('\n' + '='.repeat(65))
  console.log(`  ✅ Done — ${total} accounts ready`)
  console.log(`  Students: ${results.students.length} | Admin: ${results.admin.length} | Partners: ${results.partners.length}`)
  console.log('='.repeat(65))
}

main().catch(console.error)
