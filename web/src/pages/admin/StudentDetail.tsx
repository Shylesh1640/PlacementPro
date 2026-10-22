import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, User, BarChart2, Briefcase, Calendar,
  Shield, Trophy, CheckCircle, AlertTriangle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const RADIUS = 54
const CIRC = 2 * Math.PI * RADIUS

function Gauge({ score }: { score: number }) {
  const pct = Math.min(score, 100) / 100
  const color = score >= 80 ? '#16A34A' : score >= 60 ? '#F59E0B' : '#EF4444'
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="#E6E8F5" strokeWidth="10" />
        <circle cx="70" cy="70" r={RADIUS} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#111827]">{parseFloat(score.toString()).toFixed(1)}</span>
        <span className="text-xs text-[#9CA3AF]">/100</span>
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#E6E8F5] bg-gray-50/50">
        {icon}
        <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  placement_ready:   { bg: '#DCFCE7', color: '#16A34A', label: 'Placement Ready' },
  needs_improvement: { bg: '#FFF7ED', color: '#F59E0B', label: 'Needs Improvement' },
  at_risk:           { bg: '#FEE2E2', color: '#EF4444', label: 'At Risk' },
}

export function AdminStudentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: student, isLoading } = useQuery({
    queryKey: ['studentDetail', id],
    queryFn: async () => {
      const { data } = await supabase.from('students').select(`
        *,
        profiles (full_name, email, role),
        readiness_scores (*),
        skill_gap_reports (*),
        student_skills (skill_id, skills (name, category))
      `).eq('id', id!).single()
      return data as any
    },
    enabled: !!id,
  })

  const { data: results = [] } = useQuery({
    queryKey: ['studentResults', id],
    queryFn: async () => {
      const { data } = await supabase.from('assessment_results')
        .select('*, assessments (title, category)')
        .eq('student_id', id!).order('created_at', { ascending: false })
      return (data ?? []) as any[]
    },
    enabled: !!id,
  })

  const { data: matches = [] } = useQuery({
    queryKey: ['studentMatchesDetail', id],
    queryFn: async () => {
      const { data } = await supabase.from('job_matches')
        .select('*, jobs (title, companies (name))')
        .eq('student_id', id!).order('match_percentage', { ascending: false })
      return (data ?? []) as any[]
    },
    enabled: !!id,
  })

  const { data: applications = [] } = useQuery({
    queryKey: ['studentAppsDetail', id],
    queryFn: async () => {
      const { data } = await supabase.from('applications')
        .select('*, jobs (title, companies (name))')
        .eq('student_id', id!).order('applied_at', { ascending: false })
      return (data ?? []) as any[]
    },
    enabled: !!id,
  })

  const { data: interviews = [] } = useQuery({
    queryKey: ['studentInterviewsDetail', id],
    queryFn: async () => {
      const { data } = await supabase.from('interviews')
        .select('*, jobs (title), companies (name)')
        .eq('student_id', id!).order('scheduled_at')
      return (data ?? []) as any[]
    },
    enabled: !!id,
  })

  const { data: placement } = useQuery({
    queryKey: ['studentPlacementDetail', id],
    queryFn: async () => {
      const { data } = await supabase.from('placements')
        .select('*, jobs (title), companies (name)')
        .eq('student_id', id!).maybeSingle()
      return data as any
    },
    enabled: !!id,
  })

  const { data: procEvents = [] } = useQuery({
    queryKey: ['studentProctoringDetail', id],
    queryFn: async () => {
      // Get attempts for this student, then their proctoring events
      const { data: attempts } = await supabase.from('assessment_attempts')
        .select('id').eq('student_id', id!)
      if (!attempts?.length) return []
      const attemptIds = attempts.map((a: any) => a.id)
      const { data } = await supabase.from('proctoring_events')
        .select('*').in('attempt_id', attemptIds)
        .order('timestamp', { ascending: false }).limit(20)
      return (data ?? []) as any[]
    },
    enabled: !!id,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
    </div>
  )

  if (!student) return (
    <div className="text-center py-20">
      <p className="text-[#9CA3AF]">Student not found.</p>
      <button onClick={() => navigate('/admin/students')} className="mt-4 text-sm text-[#4F46E5] underline">
        Back to Students
      </button>
    </div>
  )

  const readiness = student.readiness_scores
  const gaps      = student.skill_gap_reports ?? []
  const skills    = student.student_skills ?? []
  const profile   = student.profiles
  const ss        = STATUS_CFG[readiness?.status ?? ''] ?? { bg: '#F3F4F6', color: '#9CA3AF', label: 'Not Assessed' }

  const appStatusCfg: Record<string, { bg: string; color: string }> = {
    offered:      { bg: '#F3E8FF', color: '#7C3AED' },
    shortlisted:  { bg: '#DCFCE7', color: '#16A34A' },
    under_review: { bg: '#FFF7ED', color: '#F59E0B' },
    applied:      { bg: '#EEF0FF', color: '#4F46E5' },
    rejected:     { bg: '#FEE2E2', color: '#EF4444' },
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button
          onClick={() => navigate('/admin/students')}
          className="p-2 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 flex-shrink-0 mt-1"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[#111827]">{profile?.full_name ?? '—'}</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">
            {profile?.email} · {student.student_id ?? '—'} · {student.department ?? '—'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: ss.bg, color: ss.color }}>
            {ss.label}
          </span>
          {student.proctoring_status && student.proctoring_status !== 'normal' && (
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: '#FEE2E2', color: '#EF4444' }}>
              Proctoring: {student.proctoring_status.replace('_', ' ')}
            </span>
          )}
          {placement && (
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              Placed ✓
            </span>
          )}
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left: Profile + Skills + Placement ── */}
        <div className="space-y-5">
          <Section title="Academic Profile" icon={<User size={15} style={{ color: '#4F46E5' }} />}>
            <div className="space-y-2.5">
              {[
                { label: 'Student ID',        value: student.student_id },
                { label: 'Department',         value: student.department },
                { label: 'CGPA',               value: student.cgpa },
                { label: '10th %',             value: student.tenth_percent },
                { label: '12th %',             value: student.twelfth_percent },
                { label: 'Backlogs',           value: student.backlogs ?? 0 },
                { label: 'Phone',              value: student.contact_phone ?? '—' },
                { label: 'Placement Status',   value: student.placement_status?.replace(/_/g, ' ') },
              ].map(f => (
                <div key={f.label} className="flex justify-between text-sm">
                  <span className="text-[#9CA3AF]">{f.label}</span>
                  <span className="font-medium text-[#111827] capitalize">{f.value ?? '—'}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Technical Skills" icon={<BarChart2 size={15} style={{ color: '#4F46E5' }} />}>
            {skills.length === 0
              ? <p className="text-sm text-[#9CA3AF]">No skills added.</p>
              : (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s: any) => (
                    <span key={s.skill_id} className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: '#EEF0FF', color: '#4F46E5' }}>
                      {s.skills?.name}
                    </span>
                  ))}
                </div>
              )}
          </Section>

          {placement && (
            <Section title="Placement Offer" icon={<Trophy size={15} style={{ color: '#F59E0B' }} />}>
              <div className="text-center py-2">
                <div className="text-3xl mb-1">🏆</div>
                <p className="font-bold text-[#111827] text-base">{placement.companies?.name}</p>
                <p className="text-sm text-[#4B5563]">{placement.jobs?.title}</p>
                {placement.package_lpa && (
                  <p className="text-xl font-bold mt-1.5" style={{ color: '#16A34A' }}>
                    ₹{placement.package_lpa} LPA
                  </p>
                )}
                {placement.offer_date && (
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    Offer: {new Date(placement.offer_date).toLocaleDateString()}
                  </p>
                )}
                {placement.joining_date && (
                  <p className="text-xs text-[#9CA3AF]">
                    Joining: {new Date(placement.joining_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Section>
          )}
        </div>

        {/* ── Middle: Readiness + Skill Gaps ── */}
        <div className="space-y-5">
          <Section title="Placement Readiness" icon={<BarChart2 size={15} style={{ color: '#4F46E5' }} />}>
            {readiness ? (
              <div className="flex flex-col items-center gap-4">
                <Gauge score={readiness.total_score} />
                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                <div className="w-full space-y-2.5">
                  {[
                    { label: 'Aptitude',      score: readiness.aptitude_score,      color: '#4F46E5' },
                    { label: 'Programming',   score: readiness.programming_score,   color: '#7C3AED' },
                    { label: 'Communication', score: readiness.communication_score, color: '#16A34A' },
                    { label: 'Academic',      score: readiness.academic_score,      color: '#3B82F6' },
                    { label: 'Internship',    score: readiness.internship_score,    color: '#F59E0B' },
                    { label: 'Projects',      score: readiness.projects_score,      color: '#EF4444' },
                  ].map(b => (
                    <div key={b.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-[#4B5563]">{b.label}</span>
                        <span className="text-xs font-semibold text-[#111827]">{Math.round(b.score ?? 0)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(100, b.score ?? 0)}%`, background: b.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#9CA3AF] text-center py-6">
                No readiness score yet. Student needs to complete assessments.
              </p>
            )}
          </Section>

          {gaps.length > 0 && (
            <Section title="Skill Gap Analysis" icon={<BarChart2 size={15} style={{ color: '#F59E0B' }} />}>
              <div className="space-y-3">
                {(gaps as any[]).map((g: any) => (
                  <div key={g.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#4B5563] font-medium">{g.skill_name}</span>
                      <span className="text-[#9CA3AF]">{Math.round(g.current_score)} / {g.target_score}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 relative">
                      <div className="h-2 rounded-full"
                        style={{ width: `${Math.min(100, g.current_score)}%`, background: g.gap > 15 ? '#EF4444' : g.gap > 5 ? '#F59E0B' : '#16A34A' }} />
                      {/* Target marker */}
                      <div className="absolute top-0 h-2 w-0.5 bg-gray-500 rounded"
                        style={{ left: `${Math.min(100, g.target_score)}%` }} />
                    </div>
                    {g.recommendation && (
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5 leading-relaxed">{g.recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── Right: Assessments + Matches + Proctoring ── */}
        <div className="space-y-5">
          <Section
            title={`Assessments (${results.length})`}
            icon={<CheckCircle size={15} style={{ color: '#16A34A' }} />}
          >
            {results.length === 0
              ? <p className="text-sm text-[#9CA3AF]">No assessments completed yet.</p>
              : (
                <div className="space-y-2">
                  {results.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-2.5 rounded-xl border border-[#E6E8F5]">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#111827] truncate">{r.assessments?.title ?? 'Assessment'}</p>
                        <p className="text-[10px] text-[#9CA3AF] capitalize">{r.assessments?.category}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                        style={{
                          background: r.percentage >= 80 ? '#DCFCE7' : r.percentage >= 60 ? '#FFF7ED' : '#FEE2E2',
                          color:      r.percentage >= 80 ? '#16A34A' : r.percentage >= 60 ? '#F59E0B' : '#EF4444',
                        }}>
                        {Math.round(r.percentage)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
          </Section>

          <Section
            title={`Job Matches (${matches.length})`}
            icon={<Briefcase size={15} style={{ color: '#4F46E5' }} />}
          >
            {matches.length === 0
              ? <p className="text-sm text-[#9CA3AF]">No job matches yet.</p>
              : (
                <div className="space-y-2">
                  {matches.slice(0, 6).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl border border-[#E6E8F5]">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#111827]">{m.jobs?.companies?.name}</p>
                        <p className="text-[10px] text-[#9CA3AF] truncate">{m.jobs?.title}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                        style={{
                          background: m.match_percentage >= 80 ? '#DCFCE7' : '#FFF7ED',
                          color:      m.match_percentage >= 80 ? '#16A34A' : '#F59E0B',
                        }}>
                        {Math.round(m.match_percentage)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
          </Section>

          {procEvents.length > 0 && (
            <Section
              title={`Proctoring Events (${procEvents.length})`}
              icon={<Shield size={15} style={{ color: '#EF4444' }} />}
            >
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {procEvents.map((e: any) => (
                  <div key={e.id} className="flex items-center gap-2 p-1.5 rounded-lg"
                    style={{ background: e.severity === 'high' ? '#FEF2F2' : e.severity === 'medium' ? '#FFFBEB' : '#F0FFF4' }}>
                    {e.severity === 'high'
                      ? <AlertTriangle size={11} style={{ color: '#EF4444' }} />
                      : <Shield size={11} style={{ color: '#F59E0B' }} />}
                    <p className="text-[10px] font-medium flex-1 truncate capitalize"
                      style={{ color: e.severity === 'high' ? '#EF4444' : '#F59E0B' }}>
                      {e.event_type?.replace(/_/g, ' ')}
                    </p>
                    <span className="text-[9px] text-[#9CA3AF] flex-shrink-0">
                      {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {e.reviewed && <span className="text-[9px] text-[#16A34A] flex-shrink-0">✓</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Full-width Interviews + Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section
          title={`Interviews (${interviews.length})`}
          icon={<Calendar size={15} style={{ color: '#4F46E5' }} />}
        >
          {interviews.length === 0
            ? <p className="text-sm text-[#9CA3AF]">No interviews scheduled.</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E6E8F5]">
                      {['Company', 'Role', 'Date', 'Mode', 'Status', 'Outcome'].map(h => (
                        <th key={h} className="text-left pb-2 text-xs font-semibold text-[#9CA3AF] uppercase pr-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {interviews.map((i: any) => (
                      <tr key={i.id} className="hover:bg-gray-50/50">
                        <td className="py-2 pr-3 font-medium text-[#111827] text-xs whitespace-nowrap">{i.companies?.name}</td>
                        <td className="py-2 pr-3 text-[#4B5563] text-xs max-w-[90px] truncate">{i.jobs?.title}</td>
                        <td className="py-2 pr-3 text-[#9CA3AF] text-xs whitespace-nowrap">{new Date(i.scheduled_at).toLocaleDateString()}</td>
                        <td className="py-2 pr-3">
                          <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ background: '#EEF0FF', color: '#4F46E5' }}>
                            {i.mode?.replace('_', '-')}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <span className="text-[10px] px-1.5 py-0.5 rounded capitalize"
                            style={{ background: i.status === 'completed' ? '#DCFCE7' : '#FFF7ED', color: i.status === 'completed' ? '#16A34A' : '#F59E0B' }}>
                            {i.status}
                          </span>
                        </td>
                        <td className="py-2 text-xs capitalize text-[#4B5563]">{i.outcome ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </Section>

        <Section
          title={`Applications (${applications.length})`}
          icon={<Briefcase size={15} style={{ color: '#7C3AED' }} />}
        >
          {applications.length === 0
            ? <p className="text-sm text-[#9CA3AF]">No applications yet.</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E6E8F5]">
                      {['Company', 'Role', 'Applied', 'Status'].map(h => (
                        <th key={h} className="text-left pb-2 text-xs font-semibold text-[#9CA3AF] uppercase pr-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {applications.map((a: any) => {
                      const appCfg: Record<string, { bg: string; color: string }> = {
                        offered:      { bg: '#F3E8FF', color: '#7C3AED' },
                        shortlisted:  { bg: '#DCFCE7', color: '#16A34A' },
                        under_review: { bg: '#FFF7ED', color: '#F59E0B' },
                        applied:      { bg: '#EEF0FF', color: '#4F46E5' },
                        rejected:     { bg: '#FEE2E2', color: '#EF4444' },
                      }
                      const sc = appCfg[a.status] ?? appCfg.applied
                      return (
                        <tr key={a.id} className="hover:bg-gray-50/50">
                          <td className="py-2 pr-3 font-medium text-[#111827] text-xs">{a.jobs?.companies?.name}</td>
                          <td className="py-2 pr-3 text-[#4B5563] text-xs max-w-[80px] truncate">{a.jobs?.title}</td>
                          <td className="py-2 pr-3 text-[#9CA3AF] text-xs whitespace-nowrap">{new Date(a.applied_at).toLocaleDateString()}</td>
                          <td className="py-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                              style={{ background: sc.bg, color: sc.color }}>
                              {a.status?.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </Section>
      </div>
    </div>
  )
}
