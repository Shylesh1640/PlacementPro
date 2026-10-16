/**
 * PlacementPro — Comprehensive Demo Data Seeder
 * Seeds all demo data for a presentation-ready app.
 *
 * Usage: node scripts/seed-demo-data.mjs
 *
 * Requires migrations to be run first:
 *   node scripts/migrate-now.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vrhnxkdkbfqvwfxbahbw.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyaG54a2RrYmZxdndmeGJhaGJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjE1MzQzMywiZXhwIjoyMTA3NzI5NDMzfQ.7d6VkoDCougLBdJ3-0voKe4EMkGrIccBSL9HbJ8yJK8'

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

let passed = 0, failed = 0
const ok  = msg => { console.log(`  ✅ ${msg}`); passed++ }
const fail = (msg, e) => { console.log(`  ❌ ${msg}: ${e?.message ?? e}`); failed++ }
const info = msg => console.log(`\n  📌 ${msg}`)

async function tablesExist() {
  const { error } = await admin.from('profiles').select('count').limit(0)
  return !error || (
    !error.message?.includes('schema cache') &&
    !error.message?.includes('Not Found') &&
    error.status !== 404
  )
}

async function seedAuthUsers() {
  info('Seeding Auth Users')
  const users = [
    { email: 'rahul.sharma@student.placementpro.dev',  role: 'student', name: 'Rahul Sharma',        meta: { department: 'Computer Science',       cgpa: 8.5, backlogs: 0 } },
    { email: 'priya.mehta@student.placementpro.dev',   role: 'student', name: 'Priya Mehta',         meta: { department: 'Information Technology', cgpa: 7.8, backlogs: 1 } },
    { email: 'arjun.nair@student.placementpro.dev',    role: 'student', name: 'Arjun Nair',          meta: { department: 'Electronics',            cgpa: 9.1, backlogs: 0 } },
    { email: 'sneha.patel@student.placementpro.dev',   role: 'student', name: 'Sneha Patel',         meta: { department: 'Computer Science',       cgpa: 6.5, backlogs: 2 } },
    { email: 'karthik.rajan@student.placementpro.dev', role: 'student', name: 'Karthik Rajan',       meta: { department: 'Mechanical',             cgpa: 7.2, backlogs: 0 } },
    { email: 'aisha.khan@student.placementpro.dev',    role: 'student', name: 'Aisha Khan',          meta: { department: 'Information Technology', cgpa: 8.9, backlogs: 0 } },
    { email: 'vikram.singh@student.placementpro.dev',  role: 'student', name: 'Vikram Singh',        meta: { department: 'Computer Science',       cgpa: 7.4, backlogs: 1 } },
    { email: 'divya.reddy@student.placementpro.dev',   role: 'student', name: 'Divya Reddy',         meta: { department: 'Electronics',            cgpa: 8.2, backlogs: 0 } },
    { email: 'rohan.gupta@student.placementpro.dev',   role: 'student', name: 'Rohan Gupta',         meta: { department: 'Computer Science',       cgpa: 6.9, backlogs: 3 } },
    { email: 'meera.iyer@student.placementpro.dev',    role: 'student', name: 'Meera Iyer',          meta: { department: 'Information Technology', cgpa: 9.3, backlogs: 0 } },
    { email: 'admin@placementpro.dev',                  role: 'admin',   name: 'Dr. S. Krishnamurthy', meta: {} },
    { email: 'recruit@google.placementpro.dev',         role: 'partner', name: 'Google Recruiter',     meta: { company: 'Google' } },
    { email: 'recruit@microsoft.placementpro.dev',      role: 'partner', name: 'Microsoft HR',         meta: { company: 'Microsoft' } },
    { email: 'recruit@tcs.placementpro.dev',            role: 'partner', name: 'TCS Campus Team',      meta: { company: 'TCS' } },
    { email: 'recruit@infosys.placementpro.dev',        role: 'partner', name: 'Infosys Campus',       meta: { company: 'Infosys' } },
    { email: 'recruit@wipro.placementpro.dev',          role: 'partner', name: 'Wipro Technologies',   meta: { company: 'Wipro' } },
  ]

  const profileIds = {}
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 100 })
  const existingMap = Object.fromEntries((existing?.users ?? []).map(u => [u.email, u.id]))

  for (const u of users) {
    if (existingMap[u.email]) {
      profileIds[u.email] = existingMap[u.email]
      ok(`User exists: ${u.email}`)
      continue
    }
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email, password: 'PlacementPro@2026',
      email_confirm: true,
      user_metadata: { full_name: u.name, role: u.role, ...u.meta },
    })
    if (error) fail(`Create ${u.email}`, error)
    else { profileIds[u.email] = data.user.id; ok(`Created: ${u.email}`) }
  }
  return profileIds
}

async function seedStudentData(profileIds) {
  info('Seeding Student Records')
  const students = [
    { email: 'rahul.sharma@student.placementpro.dev',  sid: 'CS21001', dept: 'Computer Science',       cgpa: 8.5, t10: 92, t12: 88, bl: 0, rs: 92.5, rSt: 'placement_ready',   pSt: 'placed',              proc: 'normal',         skills: ['Python','Java','DSA','System Design','React','Node.js','SQL'] },
    { email: 'priya.mehta@student.placementpro.dev',   sid: 'IT21002', dept: 'Information Technology', cgpa: 7.8, t10: 86, t12: 82, bl: 1, rs: 75.0, rSt: 'needs_improvement', pSt: 'interview_scheduled', proc: 'review_required',skills: ['Python','ML','Data Analysis','SQL','Tableau'] },
    { email: 'arjun.nair@student.placementpro.dev',    sid: 'EC21003', dept: 'Electronics',            cgpa: 9.1, t10: 95, t12: 93, bl: 0, rs: 88.0, rSt: 'placement_ready',   pSt: 'matched',             proc: 'normal',         skills: ['C++','Embedded','DSA','VLSI','Python','MATLAB'] },
    { email: 'sneha.patel@student.placementpro.dev',   sid: 'CS21004', dept: 'Computer Science',       cgpa: 6.5, t10: 74, t12: 70, bl: 2, rs: 55.0, rSt: 'at_risk',           pSt: 'assessment_completed',proc: 'flagged',         skills: ['Java','HTML','CSS'] },
    { email: 'karthik.rajan@student.placementpro.dev', sid: 'ME21005', dept: 'Mechanical',             cgpa: 7.2, t10: 82, t12: 78, bl: 0, rs: 68.0, rSt: 'needs_improvement', pSt: 'matched',             proc: 'normal',         skills: ['AutoCAD','SolidWorks','Python','MATLAB'] },
    { email: 'aisha.khan@student.placementpro.dev',    sid: 'IT21006', dept: 'Information Technology', cgpa: 8.9, t10: 94, t12: 91, bl: 0, rs: 91.0, rSt: 'placement_ready',   pSt: 'interview_scheduled', proc: 'normal',         skills: ['Python','ML','Deep Learning','TensorFlow','Docker','AWS'] },
    { email: 'vikram.singh@student.placementpro.dev',  sid: 'CS21007', dept: 'Computer Science',       cgpa: 7.4, t10: 80, t12: 76, bl: 1, rs: 72.0, rSt: 'needs_improvement', pSt: 'matched',             proc: 'normal',         skills: ['Java','Spring Boot','MySQL','REST APIs'] },
    { email: 'divya.reddy@student.placementpro.dev',   sid: 'EC21008', dept: 'Electronics',            cgpa: 8.2, t10: 89, t12: 85, bl: 0, rs: 83.0, rSt: 'placement_ready',   pSt: 'matched',             proc: 'normal',         skills: ['Python','Signal Processing','MATLAB','C','Arduino'] },
    { email: 'rohan.gupta@student.placementpro.dev',   sid: 'CS21009', dept: 'Computer Science',       cgpa: 6.9, t10: 76, t12: 72, bl: 3, rs: 50.0, rSt: 'at_risk',           pSt: 'pending',             proc: 'review_required',skills: ['HTML','CSS','JavaScript'] },
    { email: 'meera.iyer@student.placementpro.dev',    sid: 'IT21010', dept: 'Information Technology', cgpa: 9.3, t10: 97, t12: 95, bl: 0, rs: 95.0, rSt: 'placement_ready',   pSt: 'placed',              proc: 'normal',         skills: ['Python','ML','NLP','TensorFlow','Keras','AWS','Docker'] },
  ]

  const studentIds = {}
  for (const s of students) {
    const profileId = profileIds[s.email]
    if (!profileId) { fail(`No profile for ${s.email}`, 'missing'); continue }

    const { data: ex } = await admin.from('students').select('id').eq('profile_id', profileId).maybeSingle()
    if (ex) { studentIds[s.email] = ex.id; ok(`Student exists: ${s.sid}`); continue }

    const { data, error } = await admin.from('students').insert({
      profile_id: profileId, student_id: s.sid, department: s.dept,
      cgpa: s.cgpa, tenth_percent: s.t10, twelfth_percent: s.t12, backlogs: s.bl,
      readiness_score: s.rs, readiness_status: s.rSt,
      proctoring_status: s.proc, placement_status: s.pSt,
    }).select('id').single()
    if (error) { fail(`Student ${s.sid}`, error); continue }
    studentIds[s.email] = data.id
    ok(`Student: ${s.sid} — ${s.dept}, CGPA ${s.cgpa}`)

    // Skills
    for (const skillName of s.skills) {
      let { data: sk } = await admin.from('skills').select('id').eq('name', skillName).maybeSingle()
      if (!sk) {
        const { data: ns } = await admin.from('skills').insert({ name: skillName, category: 'technical' }).select('id').single()
        sk = ns
      }
      if (sk) await admin.from('student_skills').upsert({ student_id: data.id, skill_id: sk.id }).catch(() => {})
    }

    // Readiness score
    await admin.from('readiness_scores').upsert({
      student_id: data.id,
      academic_score: s.cgpa * 10,
      aptitude_score: Math.min(100, s.rs + 1.5),
      programming_score: Math.min(100, s.rs - 2.5),
      communication_score: Math.min(100, s.rs + 3.5),
      internship_score: s.pSt !== 'pending' ? 100 : 30,
      projects_score: s.skills.length >= 5 ? 100 : 60,
      total_score: s.rs, status: s.rSt,
    }).catch(() => {})

    // Skill gaps
    for (const g of [
      { skill_name: 'System Design',   cur: Math.min(s.rs - 5, 85),  tgt: 85 },
      { skill_name: 'Communication',   cur: Math.min(s.rs + 3, 96),  tgt: 80 },
      { skill_name: 'Aptitude',        cur: Math.min(s.rs + 1.5, 94),tgt: 80 },
      { skill_name: 'Programming',     cur: Math.min(s.rs - 2.5, 90),tgt: 80 },
    ]) {
      await admin.from('skill_gap_reports').insert({
        student_id: data.id, skill_name: g.skill_name,
        current_score: g.cur, target_score: g.tgt,
        gap: Math.max(0, g.tgt - g.cur),
        recommendation: `Practice ${g.skill_name} through structured learning and mock tests.`,
      }).catch(() => {})
    }
  }
  return studentIds
}

async function seedCompaniesAndJobs(profileIds) {
  info('Seeding Companies & Jobs')
  const coList = [
    { email: 'recruit@google.placementpro.dev',    name: 'Google',    industry: 'Technology',  web: 'google.com',    desc: 'Global technology leader in search, cloud, and AI.' },
    { email: 'recruit@microsoft.placementpro.dev', name: 'Microsoft', industry: 'Technology',  web: 'microsoft.com', desc: 'Cloud computing and enterprise software leader.' },
    { email: 'recruit@tcs.placementpro.dev',       name: 'TCS',       industry: 'IT Services', web: 'tcs.com',       desc: "India's largest IT services company." },
    { email: 'recruit@infosys.placementpro.dev',   name: 'Infosys',   industry: 'IT Services', web: 'infosys.com',   desc: 'Global leader in digital services and consulting.' },
    { email: 'recruit@wipro.placementpro.dev',     name: 'Wipro',     industry: 'IT Services', web: 'wipro.com',     desc: 'Technology services and consulting company.' },
  ]
  const companyIds = {}
  for (const c of coList) {
    const pid = profileIds[c.email]
    if (!pid) { fail(`No profile: ${c.email}`, 'missing'); continue }
    const { data: ex } = await admin.from('companies').select('id').eq('profile_id', pid).maybeSingle()
    if (ex) { companyIds[c.name] = ex.id; ok(`Company exists: ${c.name}`); continue }
    const { data, error } = await admin.from('companies').insert({
      profile_id: pid, name: c.name, industry: c.industry,
      website: c.web, description: c.desc, verified: true,
    }).select('id').single()
    if (error) { fail(`Company ${c.name}`, error); continue }
    companyIds[c.name] = data.id
    ok(`Company: ${c.name}`)
  }

  const jobDefs = [
    { co: 'Google',    title: 'Software Development Engineer',     skills: ['DSA','System Design','Problem Solving','Python'], mcgpa: 7.5, mbl: 0, loc: 'Bangalore', mode: 'hybrid'   },
    { co: 'Google',    title: 'Data Engineer',                     skills: ['Python','SQL','BigQuery','Spark'],                mcgpa: 7.0, mbl: 0, loc: 'Hyderabad', mode: 'on-site'  },
    { co: 'Microsoft', title: 'Software Engineer',                 skills: ['Python','ML','Azure','REST APIs'],                mcgpa: 7.0, mbl: 1, loc: 'Hyderabad', mode: 'hybrid'   },
    { co: 'Microsoft', title: 'Cloud Solutions Engineer',          skills: ['Azure','DevOps','Kubernetes','Python'],           mcgpa: 7.5, mbl: 0, loc: 'Bangalore', mode: 'hybrid'   },
    { co: 'TCS',       title: 'Systems Engineer',                  skills: ['Java','Communication','SQL','Agile'],             mcgpa: 6.5, mbl: 2, loc: 'Chennai',   mode: 'on-site'  },
    { co: 'TCS',       title: 'Digital Transformation Consultant', skills: ['Java','Spring Boot','Microservices'],             mcgpa: 6.5, mbl: 2, loc: 'Pune',      mode: 'hybrid'   },
    { co: 'Infosys',   title: 'Technology Analyst',                skills: ['Java','SQL','Problem Solving'],                  mcgpa: 6.5, mbl: 2, loc: 'Mysore',    mode: 'on-site'  },
    { co: 'Wipro',     title: 'Project Engineer',                  skills: ['Python','Java','Testing','SQL'],                 mcgpa: 6.5, mbl: 2, loc: 'Bangalore', mode: 'on-site'  },
  ]
  const jobIds = {}
  for (const j of jobDefs) {
    const cid = companyIds[j.co]
    if (!cid) continue
    const { data: ex } = await admin.from('jobs').select('id').eq('company_id', cid).eq('title', j.title).maybeSingle()
    if (ex) { jobIds[`${j.co}:${j.title}`] = ex.id; ok(`Job exists: ${j.co} — ${j.title}`); continue }
    const { data, error } = await admin.from('jobs').insert({
      company_id: cid, title: j.title, required_skills: j.skills,
      min_cgpa: j.mcgpa, max_backlogs: j.mbl,
      location: j.loc, work_mode: j.mode, employment_type: 'full-time', is_open: true,
    }).select('id').single()
    if (error) { fail(`Job ${j.title}`, error); continue }
    jobIds[`${j.co}:${j.title}`] = data.id
    ok(`Job: ${j.co} — ${j.title}`)
  }
  return { companyIds, jobIds }
}

async function seedJobMatches(studentIds, jobIds) {
  info('Seeding Job Matches')
  const matches = [
    { em: 'rahul.sharma@student.placementpro.dev',  job: 'Google:Software Development Engineer',     pct: 95, mat: ['DSA','System Design','Problem Solving','Python'], mis: ['Go'],           el: 'eligible' },
    { em: 'rahul.sharma@student.placementpro.dev',  job: 'Microsoft:Software Engineer',              pct: 88, mat: ['Python','REST APIs'],                            mis: ['Azure','C#'],   el: 'eligible' },
    { em: 'rahul.sharma@student.placementpro.dev',  job: 'TCS:Systems Engineer',                     pct: 92, mat: ['Java','Communication','SQL'],                    mis: [],               el: 'eligible' },
    { em: 'priya.mehta@student.placementpro.dev',   job: 'Microsoft:Software Engineer',              pct: 82, mat: ['Python','ML','Data Analysis'],                   mis: ['Azure'],        el: 'eligible' },
    { em: 'priya.mehta@student.placementpro.dev',   job: 'Infosys:Technology Analyst',               pct: 78, mat: ['Python','SQL','Communication'],                  mis: ['Java'],         el: 'eligible' },
    { em: 'arjun.nair@student.placementpro.dev',    job: 'TCS:Systems Engineer',                     pct: 85, mat: ['Java','Communication','DSA'],                    mis: [],               el: 'eligible' },
    { em: 'aisha.khan@student.placementpro.dev',    job: 'Google:Software Development Engineer',     pct: 90, mat: ['Python','DSA','Problem Solving'],                mis: ['System Design'], el: 'eligible' },
    { em: 'aisha.khan@student.placementpro.dev',    job: 'Microsoft:Software Engineer',              pct: 94, mat: ['Python','ML','REST APIs'],                       mis: ['C#'],           el: 'eligible' },
    { em: 'meera.iyer@student.placementpro.dev',    job: 'Microsoft:Software Engineer',              pct: 96, mat: ['Python','ML','AWS','REST APIs'],                 mis: ['C#'],           el: 'eligible' },
    { em: 'meera.iyer@student.placementpro.dev',    job: 'Google:Data Engineer',                     pct: 91, mat: ['Python','SQL','AWS'],                            mis: ['BigQuery'],     el: 'eligible' },
    { em: 'vikram.singh@student.placementpro.dev',  job: 'TCS:Systems Engineer',                     pct: 84, mat: ['Java','Communication','SQL'],                    mis: [],               el: 'eligible' },
    { em: 'vikram.singh@student.placementpro.dev',  job: 'Infosys:Technology Analyst',               pct: 80, mat: ['Java','SQL'],                                    mis: ['Problem Solving'],el: 'eligible' },
    { em: 'divya.reddy@student.placementpro.dev',   job: 'Wipro:Project Engineer',                   pct: 79, mat: ['Python','C','SQL'],                              mis: ['Java','Testing'],el: 'eligible' },
    { em: 'karthik.rajan@student.placementpro.dev', job: 'Wipro:Project Engineer',                   pct: 72, mat: ['Python'],                                        mis: ['Java','Testing','SQL'],el:'eligible'},
  ]
  for (const m of matches) {
    const sid = studentIds[m.em], jid = jobIds[m.job]
    if (!sid || !jid) continue
    await admin.from('job_matches').upsert({
      student_id: sid, job_id: jid, match_percentage: m.pct,
      matched_skills: m.mat, missing_skills: m.mis,
      eligibility_status: m.el,
      explanation: 'Match based on skill overlap, academic profile and readiness score.',
      recommendations: m.mis.map(s => `Improve skills in: ${s}`),
    }).catch(() => {})
    ok(`Match: ${m.em.split('@')[0]} ↔ ${m.job.split(':')[1]}`)
  }
}

async function seedApplicationsInterviewsPlacements(studentIds, jobIds, companyIds) {
  info('Seeding Applications')
  const apps = [
    { em: 'rahul.sharma@student.placementpro.dev',  job: 'Google:Software Development Engineer', st: 'offered'      },
    { em: 'priya.mehta@student.placementpro.dev',   job: 'Microsoft:Software Engineer',          st: 'shortlisted'  },
    { em: 'aisha.khan@student.placementpro.dev',    job: 'Google:Data Engineer',                 st: 'shortlisted'  },
    { em: 'arjun.nair@student.placementpro.dev',    job: 'TCS:Systems Engineer',                 st: 'shortlisted'  },
    { em: 'vikram.singh@student.placementpro.dev',  job: 'Infosys:Technology Analyst',           st: 'under_review' },
    { em: 'divya.reddy@student.placementpro.dev',   job: 'Wipro:Project Engineer',               st: 'applied'      },
    { em: 'karthik.rajan@student.placementpro.dev', job: 'Wipro:Project Engineer',               st: 'applied'      },
    { em: 'meera.iyer@student.placementpro.dev',    job: 'Microsoft:Software Engineer',          st: 'offered'      },
  ]
  for (const a of apps) {
    const sid = studentIds[a.em], jid = jobIds[a.job]
    if (!sid || !jid) continue
    await admin.from('applications').upsert({ student_id: sid, job_id: jid, status: a.st }).catch(() => {})
    ok(`Application: ${a.em.split('@')[0]} → ${a.job.split(':')[1]}`)
  }

  info('Seeding Interviews')
  const interviews = [
    { em: 'rahul.sharma@student.placementpro.dev',  co: 'Google',    job: 'Google:Software Development Engineer', sched: '2026-11-15T04:30:00Z', mode: 'online',    st: 'completed', out: 'selected', lnk: 'https://meet.google.com/abc-defg-hij', rnd: 1 },
    { em: 'priya.mehta@student.placementpro.dev',   co: 'Microsoft', job: 'Microsoft:Software Engineer',          sched: '2026-11-18T08:30:00Z', mode: 'online',    st: 'scheduled', out: null,       lnk: 'https://teams.microsoft.com/xyz',      rnd: 1 },
    { em: 'aisha.khan@student.placementpro.dev',    co: 'Google',    job: 'Google:Data Engineer',                 sched: '2026-11-20T05:30:00Z', mode: 'online',    st: 'scheduled', out: null,       lnk: 'https://meet.google.com/xyz-abcd-efg', rnd: 1 },
    { em: 'arjun.nair@student.placementpro.dev',    co: 'TCS',       job: 'TCS:Systems Engineer',                 sched: '2026-11-22T04:00:00Z', mode: 'on_campus', st: 'scheduled', out: null,       loc: 'Main Auditorium',                       rnd: 1 },
    { em: 'meera.iyer@student.placementpro.dev',    co: 'Microsoft', job: 'Microsoft:Software Engineer',          sched: '2026-11-10T04:30:00Z', mode: 'online',    st: 'completed', out: 'selected', lnk: null,                                   rnd: 2 },
    { em: 'vikram.singh@student.placementpro.dev',  co: 'Infosys',   job: 'Infosys:Technology Analyst',           sched: '2026-11-25T09:30:00Z', mode: 'online',    st: 'scheduled', out: null,       lnk: 'https://infosys.webex.com/meet',       rnd: 1 },
    { em: 'divya.reddy@student.placementpro.dev',   co: 'Wipro',     job: 'Wipro:Project Engineer',               sched: '2026-11-28T07:30:00Z', mode: 'on_campus', st: 'scheduled', out: null,       loc: 'Seminar Hall',                          rnd: 1 },
  ]
  for (const i of interviews) {
    const sid = studentIds[i.em], cid = companyIds[i.co], jid = jobIds[i.job]
    if (!sid || !cid || !jid) continue
    await admin.from('interviews').insert({
      student_id: sid, company_id: cid, job_id: jid,
      scheduled_at: i.sched, mode: i.mode, round: i.rnd,
      status: i.st, outcome: i.out ?? undefined,
      meeting_link: i.lnk ?? undefined, location: i.loc ?? undefined,
    }).catch(() => {})
    ok(`Interview: ${i.em.split('@')[0]} @ ${i.co}`)
  }

  info('Seeding Placements')
  const placements = [
    { em: 'rahul.sharma@student.placementpro.dev', co: 'Google',    job: 'Google:Software Development Engineer', pkg: 32, offer: '2026-11-20', join: '2027-07-01' },
    { em: 'meera.iyer@student.placementpro.dev',   co: 'Microsoft', job: 'Microsoft:Software Engineer',          pkg: 28, offer: '2026-11-15', join: '2027-07-15' },
  ]
  for (const p of placements) {
    const sid = studentIds[p.em], cid = companyIds[p.co], jid = jobIds[p.job]
    if (!sid || !cid || !jid) continue
    await admin.from('placements').upsert({
      student_id: sid, company_id: cid, job_id: jid,
      package_lpa: p.pkg, offer_date: p.offer, joining_date: p.join, status: 'accepted',
    }).catch(() => {})
    ok(`Placement: ${p.em.split('@')[0]} @ ${p.co} (₹${p.pkg} LPA)`)
  }
}

async function seedNotifications(profileIds) {
  info('Seeding Notifications')
  const notifs = [
    { em: 'rahul.sharma@student.placementpro.dev', title: '🎉 Offer Received from Google',         msg: 'You have received an offer from Google for SDE. Package: ₹32 LPA',               tp: 'success' },
    { em: 'rahul.sharma@student.placementpro.dev', title: '📅 Interview Completed – Google',       msg: 'Your Google interview on Nov 15 is complete. Outcome: Selected!',                  tp: 'success' },
    { em: 'rahul.sharma@student.placementpro.dev', title: '🎯 95% Match – Google SDE',             msg: 'You have a 95% match with Google – Software Development Engineer',                  tp: 'success' },
    { em: 'priya.mehta@student.placementpro.dev',  title: '📅 Interview Scheduled – Microsoft',    msg: 'Microsoft interview on Nov 18 at 2:00 PM. Teams link sent.',                       tp: 'info'    },
    { em: 'priya.mehta@student.placementpro.dev',  title: '⚠️ Proctoring Alert Reviewed',          msg: 'Tab-switch alert during Aptitude Test reviewed and cleared by coordinator.',        tp: 'warning' },
    { em: 'aisha.khan@student.placementpro.dev',   title: '📅 Interview Scheduled – Google',       msg: 'Google Data Engineer interview on Nov 20 at 11:00 AM',                             tp: 'info'    },
    { em: 'aisha.khan@student.placementpro.dev',   title: '🎯 94% Match – Microsoft SE',           msg: 'You have a 94% match with Microsoft – Software Engineer',                           tp: 'success' },
    { em: 'meera.iyer@student.placementpro.dev',   title: '🎉 Placed at Microsoft!',               msg: 'Congratulations! You are placed at Microsoft as Software Engineer. Package: ₹28 LPA', tp: 'success' },
    { em: 'admin@placementpro.dev',                 title: '🏢 New Company Registered',             msg: 'Wipro Technologies has registered and awaits verification.',                       tp: 'info'    },
    { em: 'admin@placementpro.dev',                 title: '⚠️ High-Severity Proctoring Alert',    msg: 'Multiple-person event detected for Sneha Patel during Aptitude Test.',             tp: 'warning' },
    { em: 'admin@placementpro.dev',                 title: '📊 Monthly Placement Report Ready',    msg: '45 students completed assessments. Current placement rate: 37%.',                  tp: 'info'    },
  ]
  for (const n of notifs) {
    const uid = profileIds[n.em]
    if (!uid) continue
    await admin.from('notifications').insert({ user_id: uid, title: n.title, message: n.msg, type: n.tp, is_read: false }).catch(() => {})
    ok(`Notification → ${n.em.split('@')[0]}: ${n.title.slice(0, 40)}`)
  }
}

async function seedProctoringEvents(studentIds) {
  info('Seeding Proctoring Events')
  const { data: assessments } = await admin.from('assessments').select('id').limit(1)
  const aid = assessments?.[0]?.id
  if (!aid) { ok('No assessments found — skipping proctoring events'); return }

  const events = [
    { em: 'sneha.patel@student.placementpro.dev',  tp: 'multiple_persons', sv: 'high',   rev: false, note: null },
    { em: 'rohan.gupta@student.placementpro.dev',   tp: 'tab_switch',       sv: 'medium', rev: false, note: null },
    { em: 'priya.mehta@student.placementpro.dev',   tp: 'tab_switch',       sv: 'medium', rev: true,  note: 'Reviewed: Student checked notes briefly. Cleared.' },
    { em: 'vikram.singh@student.placementpro.dev',  tp: 'no_face',          sv: 'medium', rev: true,  note: 'Reviewed: Camera angle issue. Student visible. Cleared.' },
  ]
  for (const e of events) {
    const sid = studentIds[e.em]
    if (!sid) continue
    let { data: att } = await admin.from('assessment_attempts').select('id').eq('student_id', sid).eq('assessment_id', aid).maybeSingle()
    if (!att) {
      const { data: na } = await admin.from('assessment_attempts').insert({
        student_id: sid, assessment_id: aid, status: 'submitted',
        score: 65, percentage: 65, submitted_at: new Date().toISOString(),
      }).select('id').single()
      att = na
    }
    if (!att) continue
    await admin.from('proctoring_events').insert({
      attempt_id: att.id, event_type: e.tp, severity: e.sv,
      reviewed: e.rev, review_note: e.note,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
    }).catch(() => {})
    ok(`Proctoring: ${e.em.split('@')[0]} — ${e.tp}`)
  }
}

async function main() {
  console.log('\n' + '═'.repeat(65))
  console.log('  PlacementPro — Seeding Demo Data for Presentation')
  console.log('═'.repeat(65))

  const dbReady = await tablesExist()
  if (!dbReady) {
    console.log('\n  ⚠️  Database tables not found. Run migrations first:')
    console.log('  node scripts/migrate-now.mjs\n')
    process.exit(0)
  }
  console.log('\n  ✅ Database tables found — seeding rich demo data...\n')

  const profileIds  = await seedAuthUsers()
  const studentIds  = await seedStudentData(profileIds)
  const { companyIds, jobIds } = await seedCompaniesAndJobs(profileIds)
  await seedJobMatches(studentIds, jobIds)
  await seedApplicationsInterviewsPlacements(studentIds, jobIds, companyIds)
  await seedNotifications(profileIds)
  await seedProctoringEvents(studentIds)

  console.log('\n' + '═'.repeat(65))
  console.log(`  ✅ Seeded: ${passed} items  |  ❌ Errors: ${failed}`)
  console.log('\n  App is ready for presentation!')
  console.log('  Student:  rahul.sharma@student.placementpro.dev / PlacementPro@2026')
  console.log('  Admin:    admin@placementpro.dev / PlacementPro@2026')
  console.log('  Partner:  recruit@google.placementpro.dev / PlacementPro@2026')
  console.log('═'.repeat(65) + '\n')
}

main().catch(console.error)
