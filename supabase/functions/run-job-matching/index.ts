import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { student_id, job_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch student profile with skills and results
    const { data: student } = await supabase
      .from('students')
      .select(`
        *,
        student_skills (skill_id, skills (name)),
        assessment_results (*),
        readiness_scores (*),
        internships (completed),
        projects (id)
      `)
      .eq('id', student_id)
      .single()

    // Fetch job requirements
    const { data: job } = await supabase
      .from('jobs')
      .select('*, companies (*)')
      .eq('id', job_id)
      .single()

    if (!student || !job) throw new Error('Student or job not found')

    const aiServiceUrl = Deno.env.get('AI_SERVICE_URL') ?? 'http://localhost:8000'

    const response = await fetch(`${aiServiceUrl}/api/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student, job }),
    })

    const matchResult = await response.json()

    // Store match result
    const { error } = await supabase
      .from('job_matches')
      .upsert({
        student_id,
        job_id,
        match_percentage: matchResult.match_percentage,
        matched_skills: matchResult.matched_skills,
        missing_skills: matchResult.missing_skills,
        eligibility_status: matchResult.eligibility_status,
        explanation: matchResult.explanation,
        recommendations: matchResult.recommendations,
      })

    if (error) throw error

    // Update student placement status if significant match
    if (matchResult.match_percentage >= 60) {
      await supabase
        .from('students')
        .update({ placement_status: 'matched' })
        .eq('id', student_id)

      // Notify student
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          user_id: student.profile_id,
          title: 'New Job Match Found!',
          message: `You have a ${matchResult.match_percentage}% match with ${job.companies.name} – ${job.title}`,
          type: 'success',
          link: '/student/job-matches',
        }),
      })
    }

    return new Response(JSON.stringify(matchResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
