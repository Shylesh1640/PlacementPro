/**
 * PlacementPro — Comprehensive Demo Data Seeder
 * Usage: node scripts/seed-demo-data.mjs
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vrhnxkdkbfqvwfxbahbw.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyaG54a2RrYmZxdndmeGJhaGJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjE1MzQzMywiZXhwIjoyMTA3NzI5NDMzfQ.7d6VkoDCougLBdJ3-0voKe4EMkGrIccBSL9HbJ8yJK8'

// Use service role — bypasses RLS
const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

let passed = 0, failed = 0
const ok   = msg        => { process.stdout.write(`  OK  ${msg}\n`); passed++ }
const fail = (msg, err) => { process.stdout.write(`  ERR ${msg}: ${err?.message ?? err}\n`); failed++ }
const info = msg        => process.stdout.write(`\n  >> ${msg}\n`)

// ── helpers ────────────────────────────────────────────────────────────────

async function upsert(table, data, conflictCol = 'id') {
  const { error } = await db.from(table).upsert(data, { onConflict: conflictCol })
  return error
}

async function insert(table, data) {
  const { error } = await db.from(table).insert(data)
  if (error && !error.message?.includes('duplicate') && !error.message?.includes('unique')) return error
  return null
}

// ── 1. Ensure profiles exist for every auth user ──────────────────────────
async function ensureProfiles() {
  info('Ensuring profiles exist for all auth users')

  const { data: { users } } = await db.auth.admin.listUsers({ perPage: 100 })
  if (!users?.length) { fail('listUsers', 'no users'); return {} }

  const profileIds = {}
  for (const u of users) {
    if (!u.email) continue

    const role = u.user_metadata?.role ?? 'student'
    const name = u.user_metadata?.full_name ?? u.email.split('@')[0]

    // Upsert profile — handles both new (trigger missed) and existing
    const { error } = await db.from('profiles').upsert({
      id:        u.id,
      email:     u.email,
      full_name: name,
      role,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    if (error) fail(`Profile ${u.email}`, error)
    else       ok(`Profile ready: ${u.email} (${role})`)

    profileIds[u.email] = u.id
  }
  return profileIds
}

// ── 2. Student records ────────────────────────────────────────────────────
async function seedStudents(profileIds) {
  info('Seeding Student Records')

  const STUDENTS = [
    { email: 'rahul.sharma@student.placementpro.dev',  sid: 'CS21001', dept: 'Computer Science',       cgpa: 8.5, t10: 92, t12: 88, bl: 0, rs: 92.5, rSt: 'placement_ready',   pSt: 'placed',               proc: 'normal',          skills: ['Python','Java','DSA','System Design','React','Node.js','SQL'] },
    { email: 'priya.mehta@student.placementpro.dev',   sid: 'IT21002', dept: 'Information Technology', cgpa: 7.8, t10: 86, t12: 82, bl: 1, rs: 75.0, rSt: 'needs_improvement', pSt: 'interview_scheduled',  proc: 'review_required', skills: ['Python','ML','Data Analysis','SQL','Tableau'] },
    { email: 'arjun.nair@student.placementpro.dev',    sid: 'EC21003', dept: 'Electronics',            cgpa: 9.1, t10: 95, t12: 93, bl: 0, rs: 88.0, rSt: 'placement_ready',   pSt: 'matched',              proc: 'normal',          skills: ['C++','Embedded','DSA','VLSI','Python','MATLAB'] },
    { email: 'sneha.patel@student.placementpro.dev',   sid: 'CS21004', dept: 'Computer Science',       cgpa: 6.5, t10: 74, t12: 70, bl: 2, rs: 55.0, rSt: 'at_risk',           pSt: 'assessment_completed', proc: 'flagged',          skills: ['Java','HTML','CSS'] },
    { email: 'karthik.rajan@student.placementpro.dev', sid: 'ME21005', dept: 'Mechanical',             cgpa: 7.2, t10: 82, t12: 78, bl: 0, rs: 68.0, rSt: 'needs_improvement', pSt: 'matched',              proc: 'normal',          skills: ['AutoCAD','SolidWorks','Python','MATLAB'] },
    { email: 'aisha.khan@student.placementpro.dev',    sid: 'IT21006', dept: 'Information Technology', cgpa: 8.9, t10: 94, t12: 91, bl: 0, rs: 91.0, rSt: 'placement_ready',   pSt: 'interview_scheduled',  proc: 'normal',          skills: ['Python','ML','Deep Learning','TensorFlow','Docker','AWS'] },
    { email: 'vikram.singh@student.placementpro.dev',  sid: 'CS21007', dept: 'Computer Science',       cgpa: 7.4, t10: 80, t12: 76, bl: 1, rs: 72.0, rSt: 'needs_improvement', pSt: 'matched',              proc: 'normal',          skills: ['Java','Spring Boot','MySQL','REST APIs'] },
    { email: 'divya.reddy@student.placementpro.dev',   sid: 'EC21008', dept: 'Electronics',            cgpa: 8.2, t10: 89, t12: 85, bl: 0, rs: 83.0, rSt: 'placement_ready',   pSt: 'matched',              proc: 'normal',          skills: ['Python','Signal Processing','MATLAB','C','Arduino'] },
    { email: 'rohan.gupta@student.placementpro.dev',   sid: 'CS21009', dept: 'Computer Science',       cgpa: 6.9, t10: 76, t12: 72, bl: 3, rs: 50.0, rSt: 'at_risk',           pSt: 'pending',              proc: 'review_required', skills: ['HTML','CSS','JavaScript'] },
    { email: 'meera.iyer@student.placementpro.dev',    sid: 'IT21010', dept: 'Information Technology', cgpa: 9.3, t10: 97, t12: 95, bl: 0, rs: 95.0, rSt: 'placement_ready',   pSt: 'placed',               proc: 'normal',          skills: ['Python','ML','NLP','TensorFlow','Keras','AWS','Docker'] },
  ]

  const studentIds = {}
  for (const s of STUDENTS) {
    const pid = profileIds[s.email]
    if (!pid) { fail(`No profile for ${s.email}`, 'skipped'); continue }

    const { data: existing } = await db.from('students').select('id').eq('profile_id', pid).maybeSingle()
    if (existing) { studentIds[s.email] = existing.id; ok(`Student exists: ${s.sid}`); }
    else {
      const { data, error } = await db.from('students').insert({
        profile_id: pid, student_id: s.sid, department: s.dept,
        cgpa: s.cgpa, tenth_percent: s.t10, twelfth_percent: s.t12, backlogs: s.bl,
        readiness_score: s.rs, readiness_status: s.rSt,
        proctoring_status: s.proc, placement_status: s.pSt,
      }).select('id').single()
      if (error) { fail(`Student ${s.sid}`, error); continue }
      studentIds[s.email] = data.id
      ok(`Student created: ${s.sid} — ${s.dept} CGPA ${s.cgpa}`)
    }

    const sid = studentIds[s.email]

    // Skills
    for (const skillName of s.skills) {
      let { data: skill } = await db.from('skills').select('id').eq('name', skillName).maybeSingle()
      if (!skill) {
        const { data: ns } = await db.from('skills').insert({ name: skillName, category: 'technical' }).select('id').single()
        skill = ns
      }
      if (skill) {
        await db.from('student_skills').upsert({ student_id: sid, skill_id: skill.id }, { onConflict: 'student_id,skill_id' })
      }
    }

    // Readiness score
    await db.from('readiness_scores').upsert({
      student_id: sid, academic_score: s.cgpa * 10,
      aptitude_score: Math.min(99, s.rs + 1.5),
      programming_score: Math.min(99, s.rs - 2),
      communication_score: Math.min(99, s.rs + 3),
      internship_score: s.pSt !== 'pending' ? 100 : 30,
      projects_score: s.skills.length >= 5 ? 100 : 60,
      total_score: s.rs, status: s.rSt,
    }, { onConflict: 'student_id' })

    // Skill gaps
    for (const gap of [
      { skill_name: 'System Design',   current_score: s.rs - 8,  target_score: 85, recommendation: 'Study HLD/LLD patterns and distributed systems.' },
      { skill_name: 'Communication',   current_score: s.rs + 3,  target_score: 80, recommendation: 'Practice professional writing and presentation skills.' },
      { skill_name: 'Aptitude',        current_score: s.rs + 1,  target_score: 80, recommendation: 'Practice quantitative aptitude and logical reasoning daily.' },
      { skill_name: 'Programming',     current_score: s.rs - 2,  target_score: 80, recommendation: 'Strengthen DSA fundamentals and practice LeetCode problems.' },
    ]) {
      await db.from('skill_gap_reports').insert({
        student_id: sid,
        skill_name:    gap.skill_name,
        current_score: Math.max(0, Math.min(100, gap.current_score)),
        target_score:  gap.target_score,
        gap:           Math.max(0, gap.target_score - gap.current_score),
        recommendation:gap.recommendation,
      }).then(() => {}, () => {}) // ignore duplicate errors
    }
  }
  return studentIds
}

// ── 3. Companies & Jobs ───────────────────────────────────────────────────
async function seedCompaniesJobs(profileIds) {
  info('Seeding Companies & Jobs')

  const COMPANIES = [
    { email: 'recruit@google.placementpro.dev',    name: 'Google',    industry: 'Technology',  website: 'google.com' },
    { email: 'recruit@microsoft.placementpro.dev', name: 'Microsoft', industry: 'Technology',  website: 'microsoft.com' },
    { email: 'recruit@tcs.placementpro.dev',       name: 'TCS',       industry: 'IT Services', website: 'tcs.com' },
    { email: 'recruit@infosys.placementpro.dev',   name: 'Infosys',   industry: 'IT Services', website: 'infosys.com' },
    { email: 'recruit@wipro.placementpro.dev',     name: 'Wipro',     industry: 'IT Services', website: 'wipro.com' },
  ]

  const companyIds = {}
  for (const c of COMPANIES) {
    const pid = profileIds[c.email]
    if (!pid) { fail(`No profile for ${c.email}`, 'skipped'); continue }

    const { data: existing } = await db.from('companies').select('id').eq('profile_id', pid).maybeSingle()
    if (existing) { companyIds[c.name] = existing.id; ok(`Company exists: ${c.name}`); continue }

    const { data, error } = await db.from('companies').insert({
      profile_id: pid, name: c.name, industry: c.industry,
      website: c.website, verified: true,
      description: `${c.name} is a leading ${c.industry} company.`,
    }).select('id').single()
    if (error) { fail(`Company ${c.name}`, error); continue }
    companyIds[c.name] = data.id
    ok(`Company: ${c.name}`)
  }

  const JOBS = [
    { co: 'Google',    title: 'Software Development Engineer',     skills: ['DSA','System Design','Problem Solving','Python'], minCgpa: 7.5, maxBl: 0, loc: 'Bangalore', mode: 'hybrid'  },
    { co: 'Google',    title: 'Data Engineer',                     skills: ['Python','SQL','BigQuery','Spark'],                minCgpa: 7.0, maxBl: 0, loc: 'Hyderabad', mode: 'on-site' },
    { co: 'Microsoft', title: 'Software Engineer',                 skills: ['Python','ML','Azure','REST APIs'],                minCgpa: 7.0, maxBl: 1, loc: 'Hyderabad', mode: 'hybrid'  },
    { co: 'Microsoft', title: 'Cloud Solutions Engineer',          skills: ['Azure','DevOps','Kubernetes','Python'],           minCgpa: 7.5, maxBl: 0, loc: 'Bangalore', mode: 'hybrid'  },
    { co: 'TCS',       title: 'Systems Engineer',                  skills: ['Java','Communication','SQL','Agile'],             minCgpa: 6.5, maxBl: 2, loc: 'Chennai',   mode: 'on-site' },
    { co: 'TCS',       title: 'Digital Transformation Consultant', skills: ['Java','Spring Boot','Microservices'],             minCgpa: 6.5, maxBl: 2, loc: 'Pune',      mode: 'hybrid'  },
    { co: 'Infosys',   title: 'Technology Analyst',                skills: ['Java','SQL','Problem Solving'],                  minCgpa: 6.5, maxBl: 2, loc: 'Mysore',    mode: 'on-site' },
    { co: 'Wipro',     title: 'Project Engineer',                  skills: ['Python','Java','Testing','SQL'],                 minCgpa: 6.5, maxBl: 2, loc: 'Bangalore', mode: 'on-site' },
  ]

  const jobIds = {}
  for (const j of JOBS) {
    const cid = companyIds[j.co]
    if (!cid) continue
    const { data: existing } = await db.from('jobs').select('id').eq('company_id', cid).eq('title', j.title).maybeSingle()
    if (existing) { jobIds[`${j.co}:${j.title}`] = existing.id; ok(`Job exists: ${j.co} – ${j.title}`); continue }

    const { data, error } = await db.from('jobs').insert({
      company_id: cid, title: j.title, required_skills: j.skills,
      min_cgpa: j.minCgpa, max_backlogs: j.maxBl,
      location: j.loc, work_mode: j.mode, employment_type: 'full-time', is_open: true,
    }).select('id').single()
    if (error) { fail(`Job ${j.title}`, error); continue }
    jobIds[`${j.co}:${j.title}`] = data.id
    ok(`Job: ${j.co} – ${j.title}`)
  }

  return { companyIds, jobIds }
}

// ── 4. Job Matches ────────────────────────────────────────────────────────
async function seedMatches(studentIds, jobIds) {
  info('Seeding Job Matches')
  const MATCHES = [
    { s: 'rahul.sharma@student.placementpro.dev',  j: 'Google:Software Development Engineer',     pct: 95, matched: ['DSA','System Design','Python'], missing: ['Go'] },
    { s: 'rahul.sharma@student.placementpro.dev',  j: 'TCS:Systems Engineer',                     pct: 92, matched: ['Java','Communication','SQL'],   missing: [] },
    { s: 'rahul.sharma@student.placementpro.dev',  j: 'Microsoft:Software Engineer',              pct: 88, matched: ['Python','REST APIs'],           missing: ['Azure','C#'] },
    { s: 'priya.mehta@student.placementpro.dev',   j: 'Microsoft:Software Engineer',              pct: 82, matched: ['Python','ML'],                  missing: ['Azure'] },
    { s: 'priya.mehta@student.placementpro.dev',   j: 'Infosys:Technology Analyst',               pct: 78, matched: ['Python','SQL'],                 missing: ['Java'] },
    { s: 'arjun.nair@student.placementpro.dev',    j: 'TCS:Systems Engineer',                     pct: 85, matched: ['Java','Communication','DSA'],   missing: [] },
    { s: 'aisha.khan@student.placementpro.dev',    j: 'Google:Software Development Engineer',     pct: 90, matched: ['Python','DSA','Problem Solving'], missing: ['System Design'] },
    { s: 'aisha.khan@student.placementpro.dev',    j: 'Microsoft:Software Engineer',              pct: 94, matched: ['Python','ML','REST APIs'],       missing: ['C#'] },
    { s: 'meera.iyer@student.placementpro.dev',    j: 'Microsoft:Software Engineer',              pct: 96, matched: ['Python','ML','AWS'],             missing: ['C#'] },
    { s: 'meera.iyer@student.placementpro.dev',    j: 'Google:Data Engineer',                     pct: 91, matched: ['Python','SQL','AWS'],            missing: ['BigQuery'] },
    { s: 'vikram.singh@student.placementpro.dev',  j: 'TCS:Systems Engineer',                     pct: 84, matched: ['Java','Communication','SQL'],   missing: [] },
    { s: 'divya.reddy@student.placementpro.dev',   j: 'Wipro:Project Engineer',                   pct: 79, matched: ['Python','C','SQL'],              missing: ['Java'] },
    { s: 'karthik.rajan@student.placementpro.dev', j: 'Wipro:Project Engineer',                   pct: 72, matched: ['Python'],                        missing: ['Java','Testing'] },
  ]
  for (const m of MATCHES) {
    const sid = studentIds[m.s]; const jid = jobIds[m.j]
    if (!sid || !jid) continue
    const err = await upsert('job_matches', {
      student_id: sid, job_id: jid, match_percentage: m.pct,
      matched_skills: m.matched, missing_skills: m.missing,
      eligibility_status: 'eligible',
      explanation: `Match based on skill overlap and academic profile.`,
      recommendations: m.missing.map(s => `Improve skills in: ${s}`),
    }, 'student_id,job_id')
    if (!err) ok(`Match: ${m.s.split('@')[0]} ↔ ${m.j.split(':')[1]} (${m.pct}%)`)
  }
}

// ── 5. Applications ───────────────────────────────────────────────────────
async function seedApplications(studentIds, jobIds) {
  info('Seeding Applications')
  const APPS = [
    { s: 'rahul.sharma@student.placementpro.dev',  j: 'Google:Software Development Engineer',  status: 'offered'       },
    { s: 'priya.mehta@student.placementpro.dev',   j: 'Microsoft:Software Engineer',           status: 'shortlisted'   },
    { s: 'aisha.khan@student.placementpro.dev',    j: 'Google:Data Engineer',                  status: 'shortlisted'   },
    { s: 'arjun.nair@student.placementpro.dev',    j: 'TCS:Systems Engineer',                  status: 'shortlisted'   },
    { s: 'vikram.singh@student.placementpro.dev',  j: 'Infosys:Technology Analyst',            status: 'under_review'  },
    { s: 'divya.reddy@student.placementpro.dev',   j: 'Wipro:Project Engineer',                status: 'applied'       },
    { s: 'karthik.rajan@student.placementpro.dev', j: 'Wipro:Project Engineer',                status: 'applied'       },
    { s: 'meera.iyer@student.placementpro.dev',    j: 'Microsoft:Software Engineer',           status: 'offered'       },
  ]
  for (const a of APPS) {
    const sid = studentIds[a.s]; const jid = jobIds[a.j]
    if (!sid || !jid) continue
    const err = await upsert('applications', { student_id: sid, job_id: jid, status: a.status }, 'student_id,job_id')
    if (!err) ok(`Application: ${a.s.split('@')[0]} → ${a.j.split(':')[1]}`)
  }
}

// ── 6. Interviews ─────────────────────────────────────────────────────────
async function seedInterviews(studentIds, jobIds, companyIds) {
  info('Seeding Interviews')
  const INTERVIEWS = [
    { s: 'rahul.sharma@student.placementpro.dev',  co: 'Google',    j: 'Google:Software Development Engineer',  sched: '2026-11-15T04:30:00Z', mode: 'online',    round: 1, status: 'completed', outcome: 'selected',  link: 'https://meet.google.com/abc-defg-hij' },
    { s: 'priya.mehta@student.placementpro.dev',   co: 'Microsoft', j: 'Microsoft:Software Engineer',           sched: '2026-11-18T08:30:00Z', mode: 'online',    round: 1, status: 'scheduled', outcome: 'pending',   link: 'https://teams.microsoft.com/xyz' },
    { s: 'aisha.khan@student.placementpro.dev',    co: 'Google',    j: 'Google:Data Engineer',                  sched: '2026-11-20T05:30:00Z', mode: 'online',    round: 1, status: 'scheduled', outcome: 'pending',   link: 'https://meet.google.com/xyz-abcd-efg' },
    { s: 'arjun.nair@student.placementpro.dev',    co: 'TCS',       j: 'TCS:Systems Engineer',                  sched: '2026-11-22T04:00:00Z', mode: 'on_campus', round: 1, status: 'scheduled', outcome: 'pending',   location: 'Main Auditorium, Block A' },
    { s: 'meera.iyer@student.placementpro.dev',    co: 'Microsoft', j: 'Microsoft:Software Engineer',           sched: '2026-11-10T04:30:00Z', mode: 'online',    round: 2, status: 'completed', outcome: 'selected',  link: null },
    { s: 'vikram.singh@student.placementpro.dev',  co: 'Infosys',   j: 'Infosys:Technology Analyst',            sched: '2026-11-25T09:30:00Z', mode: 'online',    round: 1, status: 'scheduled', outcome: 'pending',   link: 'https://infosys.webex.com/meet' },
    { s: 'divya.reddy@student.placementpro.dev',   co: 'Wipro',     j: 'Wipro:Project Engineer',                sched: '2026-11-28T07:30:00Z', mode: 'on_campus', round: 1, status: 'scheduled', outcome: 'pending',   location: 'Seminar Hall, Block B' },
  ]
  for (const i of INTERVIEWS) {
    const sid = studentIds[i.s]; const jid = jobIds[i.j]; const cid = companyIds[i.co]
    if (!sid || !jid || !cid) continue
    const row = {
      student_id: sid, job_id: jid, company_id: cid,
      scheduled_at: i.sched, mode: i.mode, round: i.round,
      status: i.status, outcome: i.outcome,
    }
    if (i.link)     row.meeting_link = i.link
    if (i.location) row.location     = i.location
    const { error } = await db.from('interviews').insert(row)
    if (!error || error.message?.includes('duplicate') || error.message?.includes('unique'))
      ok(`Interview: ${i.s.split('@')[0]} @ ${i.co} (${i.status})`)
    else
      fail(`Interview ${i.s.split('@')[0]} @ ${i.co}`, error)
  }
}

// ── 7. Placements ─────────────────────────────────────────────────────────
async function seedPlacements(studentIds, jobIds, companyIds) {
  info('Seeding Placements')
  const PLACED = [
    { s: 'rahul.sharma@student.placementpro.dev', co: 'Google',    j: 'Google:Software Development Engineer',  pkg: 32, offer: '2026-11-20', join: '2027-07-01' },
    { s: 'meera.iyer@student.placementpro.dev',   co: 'Microsoft', j: 'Microsoft:Software Engineer',           pkg: 28, offer: '2026-11-15', join: '2027-07-15' },
  ]
  for (const p of PLACED) {
    const sid = studentIds[p.s]; const jid = jobIds[p.j]; const cid = companyIds[p.co]
    if (!sid || !jid || !cid) continue
    const err = await upsert('placements', {
      student_id: sid, job_id: jid, company_id: cid,
      package_lpa: p.pkg, offer_date: p.offer, joining_date: p.join, status: 'accepted',
    }, 'student_id')
    if (!err) ok(`Placement: ${p.s.split('@')[0]} @ ${p.co} — ${p.pkg} LPA`)
  }
}

// ── 8. Proctoring events ──────────────────────────────────────────────────
async function seedProctoringEvents(studentIds) {
  info('Seeding Proctoring Events')
  const { data: assessments } = await db.from('assessments').select('id').limit(1)
  const asmId = assessments?.[0]?.id
  if (!asmId) { fail('No assessments', 'run seed 002 first'); return }

  const EVENTS = [
    { email: 'sneha.patel@student.placementpro.dev',  eventType: 'multiple_persons', sev: 'high',   reviewed: false },
    { email: 'rohan.gupta@student.placementpro.dev',   eventType: 'tab_switch',       sev: 'medium', reviewed: false },
    { email: 'priya.mehta@student.placementpro.dev',   eventType: 'tab_switch',       sev: 'medium', reviewed: true, note: 'Reviewed: Checked notes briefly. Cleared.' },
    { email: 'vikram.singh@student.placementpro.dev',  eventType: 'no_face',          sev: 'medium', reviewed: true, note: 'Reviewed: Camera angle issue. Cleared.' },
  ]

  for (const e of EVENTS) {
    const sid = studentIds[e.email]
    if (!sid) continue
    // Get or create an attempt
    let { data: attempt } = await db.from('assessment_attempts').select('id').eq('student_id', sid).eq('assessment_id', asmId).maybeSingle()
    if (!attempt) {
      const { data: newA } = await db.from('assessment_attempts').insert({
        student_id: sid, assessment_id: asmId, status: 'submitted',
        score: 65, percentage: 65, submitted_at: new Date().toISOString(),
      }).select('id').single()
      attempt = newA
    }
    if (!attempt) continue
    const { error } = await db.from('proctoring_events').insert({
      attempt_id: attempt.id, event_type: e.eventType, severity: e.sev,
      reviewed: e.reviewed, review_note: e.note ?? null,
      timestamp: new Date(Date.now() - Math.random() * 3 * 86400000).toISOString(),
    })
    if (!error || error.message?.includes('duplicate'))
      ok(`Proctoring: ${e.email.split('@')[0]} — ${e.eventType}`)
  }
}

// ── 9. Notifications ──────────────────────────────────────────────────────
async function seedNotifications(profileIds) {
  info('Seeding Notifications')
  const NOTIFS = [
    { email: 'rahul.sharma@student.placementpro.dev', title: 'Congratulations! Offer Received',   message: 'You have received an offer from Google for SDE. Package: 32 LPA', type: 'success' },
    { email: 'rahul.sharma@student.placementpro.dev', title: 'Interview Completed',               message: 'Your Google interview on Nov 15 is complete. Outcome: Selected!', type: 'success' },
    { email: 'rahul.sharma@student.placementpro.dev', title: '95% Job Match Found',               message: 'You have a 95% match with Google Software Development Engineer',  type: 'success' },
    { email: 'priya.mehta@student.placementpro.dev',  title: 'Interview Scheduled — Microsoft',   message: 'Your Microsoft interview is on Nov 18 at 2:00 PM. Link sent.',    type: 'info'    },
    { email: 'aisha.khan@student.placementpro.dev',   title: 'Interview Scheduled — Google',      message: 'Google Data Engineer interview on Nov 20 at 11:00 AM',            type: 'info'    },
    { email: 'meera.iyer@student.placementpro.dev',   title: 'Placed at Microsoft!',             message: 'Placed at Microsoft as Software Engineer. Package: 28 LPA',       type: 'success' },
    { email: 'admin@placementpro.dev',                 title: 'Proctoring Alert',                 message: 'High-severity alert for Sneha Patel during Aptitude Test',        type: 'warning' },
    { email: 'admin@placementpro.dev',                 title: 'New Company Registered',           message: 'Wipro Technologies registered — pending verification',             type: 'info'    },
  ]
  for (const n of NOTIFS) {
    const uid = profileIds[n.email]
    if (!uid) continue
    const { error } = await db.from('notifications').insert({ user_id: uid, title: n.title, message: n.message, type: n.type, is_read: false })
    if (!error || error.message?.includes('duplicate'))
      ok(`Notification: ${n.email.split('@')[0]} — ${n.title.slice(0, 40)}`)
    else
      fail(`Notification for ${n.email}`, error)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  process.stdout.write('\n' + '='.repeat(65) + '\n')
  process.stdout.write('  PlacementPro — Seeding Demo Data\n')
  process.stdout.write('='.repeat(65) + '\n')

  // Verify tables exist
  const { error: tErr } = await db.from('profiles').select('count').limit(0)
  if (tErr?.message?.includes('schema cache') || tErr?.message?.includes('Not Found')) {
    process.stdout.write('\n  Tables not found — run migrations first.\n\n')
    process.exit(1)
  }

  const profileIds = await ensureProfiles()
  const studentIds = await seedStudents(profileIds)
  const { companyIds, jobIds } = await seedCompaniesJobs(profileIds)
  await seedMatches(studentIds, jobIds)
  await seedApplications(studentIds, jobIds)
  await seedInterviews(studentIds, jobIds, companyIds)
  await seedPlacements(studentIds, jobIds, companyIds)
  await seedProctoringEvents(studentIds)
  await seedNotifications(profileIds)

  process.stdout.write('\n' + '='.repeat(65) + '\n')
  process.stdout.write(`  Done: ${passed} succeeded | ${failed} failed\n`)
  if (failed === 0) process.stdout.write('  All demo data seeded successfully!\n')
  process.stdout.write('='.repeat(65) + '\n\n')
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
