// @ts-nocheck
/**
 * Direct job matching — calls Python AI service then saves to Supabase.
 * Bypasses the edge function (which requires deployment).
 */

import { supabase } from './supabase'

const AI_URL = import.meta.env.VITE_AI_SERVICE_URL ?? 'http://localhost:8000'

export async function runMatchingForStudent(studentId: string): Promise<number> {
  let matchCount = 0
  try {
    const { data: student } = await supabase
      .from('students')
      .select(`
        id, profile_id, cgpa, backlogs, department,
        readiness_scores (total_score),
        student_skills (skills (name))
      `)
      .eq('id', studentId)
      .single()

    if (!student) return 0

    const { data: jobs } = await supabase
      .from('jobs')
      .select('*, companies (name, logo_url)')
      .eq('is_open', true)
      .limit(20)

    if (!jobs?.length) return 0

    const results = await Promise.allSettled(
      jobs.map(async (job: any) => {
        try {
          const res = await fetch(`${AI_URL}/api/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student, job }),
            signal: AbortSignal.timeout(8000),
          })
          if (!res.ok) return null
          const match = await res.json()

          await supabase.from('job_matches').upsert({
            student_id:         studentId,
            job_id:             job.id,
            match_percentage:   match.match_percentage,
            matched_skills:     match.matched_skills ?? [],
            missing_skills:     match.missing_skills ?? [],
            eligibility_status: match.eligibility_status ?? 'eligible',
            explanation:        match.explanation ?? '',
            recommendations:    match.recommendations ?? [],
          }, { onConflict: 'student_id,job_id' })

          if (match.match_percentage >= 60) {
            await supabase.from('students')
              .update({ placement_status: 'matched' })
              .eq('id', studentId)
              .eq('placement_status', 'pending')
          }

          return match
        } catch {
          return null
        }
      })
    )

    matchCount = results.filter(r => r.status === 'fulfilled' && r.value).length
  } catch (err) {
    console.warn('Job matching failed:', err)
  }
  return matchCount
}

export async function runMatchingForJob(jobId: string): Promise<number> {
  let matchCount = 0
  try {
    const { data: job } = await supabase
      .from('jobs')
      .select('*, companies (name)')
      .eq('id', jobId)
      .single()
    if (!job) return 0

    const { data: students } = await supabase
      .from('students')
      .select(`
        id, profile_id, cgpa, backlogs, department,
        readiness_scores (total_score),
        student_skills (skills (name))
      `)
      .not('readiness_score', 'is', null)
      .limit(50)

    if (!students?.length) return 0

    const results = await Promise.allSettled(
      students.map(async (student: any) => {
        try {
          const res = await fetch(`${AI_URL}/api/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student, job }),
            signal: AbortSignal.timeout(8000),
          })
          if (!res.ok) return null
          const match = await res.json()

          await supabase.from('job_matches').upsert({
            student_id:         student.id,
            job_id:             jobId,
            match_percentage:   match.match_percentage,
            matched_skills:     match.matched_skills ?? [],
            missing_skills:     match.missing_skills ?? [],
            eligibility_status: match.eligibility_status ?? 'eligible',
            explanation:        match.explanation ?? '',
            recommendations:    match.recommendations ?? [],
          }, { onConflict: 'student_id,job_id' })

          return match
        } catch { return null }
      })
    )

    matchCount = results.filter(r => r.status === 'fulfilled' && r.value).length
  } catch (err) {
    console.warn('Job matching for job failed:', err)
  }
  return matchCount
}
