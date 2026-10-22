/* eslint-disable @typescript-eslint/no-explicit-any */
// All functions in this file return Promise<any> intentionally.
// The Database type only defines Row shapes; Insert/Update shapes are inferred at runtime.
// Type safety for query results is enforced at the useQuery call sites.
/**
 * Central Supabase query functions used by all pages via TanStack Query.
 * Every function returns {data, error} compatible with react-query's queryFn pattern.
 * Falls back gracefully when tables don't yet exist (pre-migration).
 *
 * ts-nocheck: Database type only defines Row shapes, not Insert/Update.
 * Type safety is enforced at the call sites via react-query generics.
 */

import { supabase } from './supabase'

// Cast to any — Database type only defines Row, not Insert/Update shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = supabase

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Swallow "table not found" errors and return empty data instead. */
function tableMissing(err: any) {
  return (
    err?.code === '42P01' ||
    err?.code === 'PGRST116' ||
    err?.message?.includes('schema cache') ||
    err?.message?.includes('Not Found') ||
    err?.status === 404
  )
}

// ─── Student ──────────────────────────────────────────────────────────────

export async function getStudentByProfileId(profileId: string): Promise<any> {
  const { data, error } = await db
    .from('students')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle()
  if (error && !tableMissing(error)) throw error
  return data
}

export async function getOrCreateStudent(profileId: string, meta?: Record<string, any>): Promise<any> {
  let student = await getStudentByProfileId(profileId)
  if (!student) {
    const { data, error } = await db
      .from('students')
      .insert({
        profile_id: profileId,
        student_id: `STU${Date.now().toString().slice(-6)}`,
        department: meta?.department ?? '',
        cgpa: meta?.cgpa ?? 0,
        backlogs: meta?.backlogs ?? 0,
      })
      .select()
      .single()
    if (error && !tableMissing(error)) throw error
    student = data
  }
  return student
}

export async function updateStudent(studentId: string, payload: Record<string, any>): Promise<any> {
  const { data, error } = await db
    .from('students')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', studentId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getStudentSkills(studentId: string): Promise<any> {
  const { data, error } = await db
    .from('student_skills')
    .select('*, skills(name, category)')
    .eq('student_id', studentId)
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function upsertStudentSkill(studentId: string, skillName: string): Promise<any> {
  // Get or create the skill
  let { data: skill } = await db
    .from('skills')
    .select('id')
    .eq('name', skillName)
    .maybeSingle()

  if (!skill) {
    const { data: newSkill, error: se } = await db
      .from('skills')
      .insert({ name: skillName, category: 'technical' })
      .select('id')
      .single()
    if (se) throw se
    skill = newSkill
  }

  const { error } = await db
    .from('student_skills')
    .upsert({ student_id: studentId, skill_id: skill!.id })
  if (error) throw error
}

export async function deleteStudentSkill(studentId: string, skillId: string): Promise<any> {
  const { error } = await db
    .from('student_skills')
    .delete()
    .eq('student_id', studentId)
    .eq('skill_id', skillId)
  if (error) throw error
}

export async function getStudentProjects(studentId: string): Promise<any> {
  const { data, error } = await db
    .from('projects')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function getStudentInternships(studentId: string): Promise<any> {
  const { data, error } = await db
    .from('internships')
    .select('*')
    .eq('student_id', studentId)
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

// ─── Assessments ──────────────────────────────────────────────────────────

export async function getActiveAssessments(department?: string): Promise<any> {
  const { data, error } = await db
    .from('assessments')
    .select('*')
    .eq('is_active', true)
    .order('created_at')
  if (error && !tableMissing(error)) throw error
  const all = data ?? []
  if (!department) return all
  // Show if eligible_departments is empty (all depts) or includes this department
  return all.filter((a: any) => {
    const depts: string[] = a.eligible_departments ?? []
    return depts.length === 0 || depts.includes(department)
  })
}

export async function getStudentAttempts(studentId: string): Promise<any> {
  const { data, error } = await db
    .from('assessment_attempts')
    .select('*, assessments(title, category, total_marks)')
    .eq('student_id', studentId)
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function getAssessmentWithQuestions(assessmentId: string): Promise<any> {
  const { data: aqRows, error } = await db
    .from('assessment_questions')
    .select('order_index, question_bank(*)')
    .eq('assessment_id', assessmentId)
    .order('order_index')
  if (error && !tableMissing(error)) throw error
  return (aqRows ?? []).map((r: any) => r.question_bank)
}

export async function startAttempt(assessmentId: string, studentId: string): Promise<any> {
  const { data: existing } = await db
    .from('assessment_attempts')
    .select('id, status')
    .eq('assessment_id', assessmentId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (existing) return existing

  const { data, error } = await db
    .from('assessment_attempts')
    .insert({ assessment_id: assessmentId, student_id: studentId, status: 'in_progress' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  selectedAnswer: string,
  isCorrect: boolean
) {
  const { error } = await db
    .from('attempt_answers')
    .upsert({
      attempt_id: attemptId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
    })
  if (error) throw error
}

export async function submitAttempt(attemptId: string, score: number, percentage: number, status = 'submitted'): Promise<any> {
  const { data, error } = await db
    .from('assessment_attempts')
    .update({
      status,
      score,
      percentage,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Results ──────────────────────────────────────────────────────────────

export async function getReadinessScore(studentId: string): Promise<any> {
  const { data, error } = await db
    .from('readiness_scores')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle()
  if (error && !tableMissing(error)) throw error
  return data
}

export async function getSkillGaps(studentId: string): Promise<any> {
  const { data, error } = await db
    .from('skill_gap_reports')
    .select('*')
    .eq('student_id', studentId)
    .order('gap', { ascending: false })
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function getAssessmentResults(studentId: string): Promise<any> {
  const { data, error } = await db
    .from('assessment_results')
    .select('*, assessments(title, category)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

// ─── Job Matches ──────────────────────────────────────────────────────────

export async function getJobMatches(studentId: string): Promise<any> {
  const { data, error } = await db
    .from('job_matches')
    .select('*, jobs(title, description, required_skills, companies(name, logo_url, industry))')
    .eq('student_id', studentId)
    .order('match_percentage', { ascending: false })
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function applyToJob(studentId: string, jobId: string): Promise<any> {
  const { data, error } = await db
    .from('applications')
    .upsert({ student_id: studentId, job_id: jobId, status: 'applied' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getStudentApplications(studentId: string): Promise<any> {
  const { data, error } = await db
    .from('applications')
    .select('*, jobs(title, companies(name))')
    .eq('student_id', studentId)
    .order('applied_at', { ascending: false })
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

// ─── Interviews ───────────────────────────────────────────────────────────

export async function getStudentInterviews(studentId: string): Promise<any> {
  const { data, error } = await db
    .from('interviews')
    .select('*, jobs(title), companies(name, logo_url)')
    .eq('student_id', studentId)
    .order('scheduled_at')
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function getAllInterviews(): Promise<any> {
  const { data, error } = await db
    .from('interviews')
    .select(`
      *,
      jobs(title),
      companies(name),
      students(student_id, profiles(full_name, email))
    `)
    .order('scheduled_at')
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function createInterview(payload: {
  studentId: string
  jobId: string
  companyId: string
  scheduledAt: string
  mode: string
  round?: number
  meetingLink?: string
  location?: string
}) {
  const { data, error } = await db
    .from('interviews')
    .insert({
      student_id: payload.studentId,
      job_id: payload.jobId,
      company_id: payload.companyId,
      scheduled_at: payload.scheduledAt,
      mode: payload.mode,
      round: payload.round ?? 1,
      meeting_link: payload.meetingLink,
      location: payload.location,
      status: 'scheduled',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Placement ────────────────────────────────────────────────────────────

export async function getStudentPlacement(studentId: string): Promise<any> {
  const { data, error } = await db
    .from('placements')
    .select('*, jobs(title), companies(name, logo_url)')
    .eq('student_id', studentId)
    .maybeSingle()
  if (error && !tableMissing(error)) throw error
  return data
}

// ─── Notifications ────────────────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<any> {
  const { data, error } = await db
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function markNotificationRead(id: string): Promise<any> {
  const { error } = await db
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead(userId: string): Promise<any> {
  const { error } = await db
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) throw error
}

// ─── Admin ────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<any> {
  const results = await Promise.allSettled([
    db.from('students').select('count', { count: 'exact', head: true }),
    db.from('companies').select('count', { count: 'exact', head: true }),
    db.from('interviews').select('count', { count: 'exact', head: true }).eq('status', 'scheduled'),
    db.from('assessments').select('count', { count: 'exact', head: true }).eq('is_active', true),
  ])
  return {
    students: (results[0].status === 'fulfilled' ? results[0].value.count : null) ?? 0,
    companies: (results[1].status === 'fulfilled' ? results[1].value.count : null) ?? 0,
    upcomingInterviews: (results[2].status === 'fulfilled' ? results[2].value.count : null) ?? 0,
    activeAssessments: (results[3].status === 'fulfilled' ? results[3].value.count : null) ?? 0,
  }
}

export async function getAllStudentsAdmin(page = 0, pageSize = 20): Promise<any> {
  const from = page * pageSize
  const to   = from + pageSize - 1
  const { data, error, count } = await db
    .from('students')
    .select(`*, profiles(full_name, email), readiness_scores(total_score, status)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error && !tableMissing(error)) throw error
  return { data: data ?? [], count: count ?? 0 }
}

export async function getAllAssessmentsAdmin(): Promise<any> {
  const { data, error } = await db
    .from('assessments')
    .select('*')
    .order('created_at', { ascending: false })
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function createAssessment(payload: {
  title: string
  description?: string
  category: string
  duration_minutes: number
  total_marks: number
  pass_marks: number
  eligible_departments?: string[]
}): Promise<any> {
  const { data, error } = await db
    .from('assessments')
    .insert({ ...payload, eligible_departments: payload.eligible_departments ?? [] })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleAssessmentActive(id: string, isActive: boolean): Promise<any> {
  const { error } = await db
    .from('assessments')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw error
}

export async function deleteAssessment(id: string): Promise<any> {
  const { error } = await db.from('assessments').delete().eq('id', id)
  if (error) throw error
}

export async function updateAssessment(id: string, payload: {
  title?: string
  description?: string
  duration_minutes?: number
  total_marks?: number
  pass_marks?: number
  eligible_departments?: string[]
}): Promise<any> {
  const { data, error } = await db
    .from('assessments')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Question Bank ────────────────────────────────────────────────────────

export async function getAllQuestions(filters?: { category?: string; difficulty?: string }): Promise<any> {
  let q = db.from('question_bank').select('*').order('created_at', { ascending: false })
  if (filters?.category) q = q.eq('category', filters.category)
  if (filters?.difficulty) q = q.eq('difficulty', filters.difficulty)
  const { data, error } = await q
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function createQuestion(payload: {
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  topic: string
  difficulty: string
  category: string
}) {
  const { data, error } = await db.from('question_bank').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteQuestion(id: string): Promise<any> {
  const { error } = await db.from('question_bank').delete().eq('id', id)
  if (error) throw error
}

// ─── Companies ────────────────────────────────────────────────────────────

export async function getCompanyByProfileId(profileId: string): Promise<any> {
  const { data, error } = await db
    .from('companies')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle()
  if (error && !tableMissing(error)) throw error
  return data
}

export async function getAllCompanies(): Promise<any> {
  const { data, error } = await db
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function verifyCompany(id: string, verified: boolean, note?: string): Promise<any> {
  const { error } = await db
    .from('companies')
    .update({ verified, verification_note: note })
    .eq('id', id)
  if (error) throw error
}

export async function upsertCompany(profileId: string, payload: {
  name: string
  industry?: string
  website?: string
  description?: string
}) {
  const { data, error } = await db
    .from('companies')
    .upsert({ profile_id: profileId, ...payload })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Jobs ─────────────────────────────────────────────────────────────────

export async function getCompanyJobs(companyId: string): Promise<any> {
  const { data, error } = await db
    .from('jobs')
    .select('*, applications(count)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function getAllJobsAdmin(page = 0, pageSize = 15): Promise<any> {
  const from = page * pageSize
  const to   = from + pageSize - 1
  const { data, error, count } = await db
    .from('jobs')
    .select('*, companies(name, verified)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error && !tableMissing(error)) throw error
  return { data: data ?? [], count: count ?? 0 }
}

export async function createJob(companyId: string, payload: {
  title: string
  description?: string
  required_skills?: string[]
  preferred_skills?: string[]
  min_cgpa?: number
  max_backlogs?: number
  eligible_departments?: string[]
  experience_level?: string
  location?: string
  work_mode?: string
  employment_type?: string
}) {
  const { data, error } = await db
    .from('jobs')
    .insert({ company_id: companyId, ...payload })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleJobOpen(id: string, isOpen: boolean): Promise<any> {
  const { error } = await db.from('jobs').update({ is_open: isOpen }).eq('id', id)
  if (error) throw error
}

// ─── Applications ─────────────────────────────────────────────────────────

export async function getApplicationsForCompany(companyId: string): Promise<any> {
  const { data, error } = await db
    .from('applications')
    .select(`
      *,
      jobs(title, company_id),
      students(
        cgpa, backlogs, department, readiness_score, proctoring_status,
        profiles(full_name, email)
      )
    `)
    .eq('jobs.company_id', companyId)
    .order('applied_at', { ascending: false })
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function updateApplicationStatus(id: string, status: string, note?: string): Promise<any> {
  const { error } = await db
    .from('applications')
    .update({ status, reviewer_note: note, reviewed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ─── Proctoring ───────────────────────────────────────────────────────────

export async function getProctoringEvents(filters?: { reviewed?: boolean }): Promise<any> {
  let q = supabase
    .from('proctoring_events')
    .select(`
      *,
      assessment_attempts(
        students(profiles(full_name)),
        assessments(title)
      )
    `)
    .order('timestamp', { ascending: false })
    .limit(100)

  if (filters?.reviewed !== undefined) q = q.eq('reviewed', filters.reviewed)
  const { data, error } = await q
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function reviewProctoringEvent(id: string, decision: 'clear' | 'flag', note: string): Promise<any> {
  const { error } = await db
    .from('proctoring_events')
    .update({
      reviewed: true,
      review_note: note,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
  // If flagged, update student proctoring_status
  if (decision === 'flag') {
    const { data: evt } = await db
      .from('proctoring_events')
      .select('attempt_id')
      .eq('id', id)
      .single()
    if (evt) {
      const { data: attempt } = await db
        .from('assessment_attempts')
        .select('student_id')
        .eq('id', evt.attempt_id)
        .single()
      if (attempt) {
        await db.from('students').update({ proctoring_status: 'flagged' }).eq('id', attempt.student_id)
      }
    }
  }
}

export async function saveProctoringEvent(
  attemptId: string,
  eventType: string,
  severity: 'high' | 'medium' | 'low',
  snapshotUrl?: string
): Promise<any> {
  const { data, error } = await db
    .from('proctoring_events')
    .insert({
      attempt_id:   attemptId,
      event_type:   eventType,
      severity,
      snapshot_url: snapshotUrl ?? null,
      timestamp:    new Date().toISOString(),
      reviewed:     false,
    })
    .select()
    .single()
  if (error && !tableMissing(error)) throw error
  return data
}

// ─── Analytics ────────────────────────────────────────────────────────────

export async function getPlacementChartData(): Promise<any> {
  const { data, error } = await db
    .from('placements')
    .select('created_at, status')
    .order('created_at')
  if (error && !tableMissing(error)) throw error
  // Group by month
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const counts: Record<string, number> = {}
  ;(data ?? []).forEach((p: any) => {
    const d = new Date(p.created_at)
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`
    counts[key] = (counts[key] ?? 0) + 1
  })
  return Object.entries(counts).map(([month, placements]) => ({ month, placements }))
}

export async function getDepartmentStats(): Promise<any> {
  const { data, error } = await db
    .from('students')
    .select('department, placement_status')
  if (error && !tableMissing(error)) throw error
  const deptMap: Record<string, { total: number; placed: number }> = {}
  ;(data ?? []).forEach((s: any) => {
    const dept = s.department || 'Other'
    if (!deptMap[dept]) deptMap[dept] = { total: 0, placed: 0 }
    deptMap[dept].total++
    if (s.placement_status === 'placed') deptMap[dept].placed++
  })
  return Object.entries(deptMap).map(([dept, v]) => ({ dept, ...v }))
}

// ─── Readiness weights ────────────────────────────────────────────────────

export async function getReadinessWeights(): Promise<any> {
  const { data, error } = await db
    .from('readiness_weights')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error && !tableMissing(error)) throw error
  return data ?? {
    academic_weight: 25,
    aptitude_weight: 20,
    programming_weight: 20,
    communication_weight: 15,
    internship_weight: 10,
    projects_weight: 10,
  }
}

export async function updateReadinessWeights(weights: Record<string, number>): Promise<any> {
  const { error } = await db
    .from('readiness_weights')
    .insert({ ...weights, updated_at: new Date().toISOString() })
  if (error) throw error
}

// ─── Assessment Questions ─────────────────────────────────────────────────

export async function getAssessmentQuestionIds(assessmentId: string): Promise<any> {
  const { data, error } = await db
    .from('assessment_questions')
    .select('question_id, order_index')
    .eq('assessment_id', assessmentId)
    .order('order_index')
  if (error && !tableMissing(error)) throw error
  return data ?? []
}

export async function addQuestionToAssessment(assessmentId: string, questionId: string, orderIndex: number): Promise<any> {
  const { error } = await db
    .from('assessment_questions')
    .upsert({ assessment_id: assessmentId, question_id: questionId, order_index: orderIndex })
  if (error) throw error
}

export async function removeQuestionFromAssessment(assessmentId: string, questionId: string): Promise<any> {
  const { error } = await db
    .from('assessment_questions')
    .delete()
    .eq('assessment_id', assessmentId)
    .eq('question_id', questionId)
  if (error) throw error
}
