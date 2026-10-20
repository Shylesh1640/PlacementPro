// @ts-nocheck — supabase inserts use runtime types not covered by our Database Row-only type defs
/**
 * Calculate and store readiness score after assessment completion.
 * Called automatically after a student submits any assessment.
 * Non-blocking — assessment submission succeeds even if this fails.
 */
import { supabase } from './supabase'

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL ?? 'http://localhost:8000'

interface StudentData {
  studentId: string
  profileId: string
  cgpa: number
  tenthPercent: number
  twelfthPercent: number
  backlogs: number
}

export async function calculateAndSaveReadiness(data: StudentData): Promise<void> {
  try {
    // 1. Get all assessment results for this student
    const { data: results } = await supabase
      .from('assessment_results')
      .select('*, assessments(category)')
      .eq('student_id', data.studentId)

    // 2. Get internship/project counts
    const [{ count: internshipCount }, { count: projectCount }] = await Promise.all([
      supabase.from('internships').select('count', { count: 'exact', head: true })
        .eq('student_id', data.studentId).eq('completed', true),
      supabase.from('projects').select('count', { count: 'exact', head: true })
        .eq('student_id', data.studentId),
    ])

    // 3. Extract component scores from results
    const arr = (results ?? []) as any[]
    const aptResult  = arr.find(r => r.assessments?.category === 'aptitude'      || r.aptitude_score)
    const progResult = arr.find(r => r.assessments?.category === 'programming'   || r.programming_score)
    const commResult = arr.find(r => r.assessments?.category === 'communication' || r.communication_score)

    const aptScore  = aptResult?.percentage  ?? aptResult?.aptitude_score     ?? 0
    const progScore = progResult?.percentage ?? progResult?.programming_score  ?? 0
    const commScore = commResult?.percentage ?? commResult?.communication_score ?? 0

    // 4. Call AI service readiness endpoint
    const res = await fetch(`${AI_SERVICE_URL}/api/readiness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cgpa:                data.cgpa,
        tenth_percent:       data.tenthPercent,
        twelfth_percent:     data.twelfthPercent,
        backlogs:            data.backlogs,
        aptitude_score:      aptScore,
        programming_score:   progScore,
        communication_score: commScore,
        has_internship:      (internshipCount ?? 0) > 0,
        project_count:       projectCount ?? 0,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) throw new Error(`AI service responded ${res.status}`)
    const readiness = await res.json()

    // 5. Upsert readiness score in DB
    await supabase.from('readiness_scores').upsert({
      student_id:          data.studentId,
      academic_score:      readiness.academic_score,
      aptitude_score:      readiness.aptitude_score,
      programming_score:   readiness.programming_score,
      communication_score: readiness.communication_score,
      internship_score:    readiness.internship_score,
      projects_score:      readiness.projects_score,
      total_score:         readiness.total_score,
      status:              readiness.status,
      calculated_at:       new Date().toISOString(),
    })

    // 6. Update student row
    await supabase.from('students').update({
      readiness_score:  readiness.total_score,
      readiness_status: readiness.status,
      placement_status: 'assessment_completed',
    }).eq('id', data.studentId)

    // 7. Save skill gaps (delete old, insert new)
    if (Array.isArray(readiness.skill_gaps) && readiness.skill_gaps.length > 0) {
      await supabase.from('skill_gap_reports').delete().eq('student_id', data.studentId)
      const gapRows = readiness.skill_gaps.map((g: any) => ({
        student_id:     data.studentId,
        skill_name:     g.skill_name,
        current_score:  g.current_score,
        target_score:   g.target_score,
        gap:            g.gap,
        recommendation: (readiness.recommendations as string[] ?? []).find(
          (r: string) => r.toLowerCase().includes((g.skill_name as string).toLowerCase())
        ) ?? null,
      }))
      await supabase.from('skill_gap_reports').insert(gapRows)
    }

    // 8. Trigger job matching via edge functions (non-blocking fire-and-forget)
    triggerJobMatching(data.studentId).catch(() => {})

  } catch (err) {
    console.warn('Readiness calculation failed (non-fatal):', err)
  }
}

async function triggerJobMatching(studentId: string, _profileId?: string): Promise<void> {
  try {
    // Call AI service directly — bypasses undeployed edge function
    const { runMatchingForStudent } = await import('./matching')
    const count = await runMatchingForStudent(studentId)
    if (count > 0) console.log(`Job matching complete: ${count} matches calculated`)
  } catch {
    // Silent fail — assessment submission succeeds regardless
  }
}
