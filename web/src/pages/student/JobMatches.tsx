import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Filter, ChevronRight, Briefcase, CheckCircle } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../contexts/AuthContext'
import {
  getStudentByProfileId, getJobMatches, applyToJob, getStudentApplications
} from '../../lib/queries'
import { DEMO_MATCHES } from '../../lib/demo-data'


const LOGO_COLORS: Record<string, { color: string; bg: string }> = {
  Google: { color: '#4285F4', bg: '#E8F0FE' },
  Microsoft: { color: '#00A4EF', bg: '#E3F5FD' },
  TCS: { color: '#E31837', bg: '#FDEAED' },
  Infosys: { color: '#007CC3', bg: '#E3F2FA' },
  Wipro: { color: '#341755', bg: '#EDE7F6' },
}

function getLogoStyle(name: string) {
  return LOGO_COLORS[name] ?? { color: '#4F46E5', bg: '#EEF0FF' }
}

function MatchBadge({ pct }: { pct: number }) {
  const color = pct >= 90 ? '#16A34A' : pct >= 75 ? '#3B82F6' : '#F59E0B'
  const bg = pct >= 90 ? '#DCFCE7' : pct >= 75 ? '#EFF6FF' : '#FFF7ED'
  return (
    <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ color, background: bg }}>
      {pct}% Match
    </span>
  )
}

export function JobMatches() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [selected, setSelected] = useState<any | null>(null)

  const { data: student } = useQuery({
    queryKey: ['student', user?.id],
    queryFn: () => getStudentByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['jobMatches', student?.id],
    queryFn: () => getJobMatches(student!.id),
    enabled: !!student?.id,
  })

  const { data: applications = [] } = useQuery({
    queryKey: ['applications', student?.id],
    queryFn: () => getStudentApplications(student!.id),
    enabled: !!student?.id,
  })

  const [refreshing, setRefreshing] = useState(false)

  const applyMutation = useMutation({
    mutationFn: (jobId: string) => applyToJob(student!.id, jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications', student?.id] }),
  })

  const handleRefresh = async () => {
    if (!student?.id) return
    setRefreshing(true)
    try {
      await runMatchingForStudent(student.id)
      await qc.invalidateQueries({ queryKey: ['jobMatches', student?.id] })
    } finally {
      setRefreshing(false)
    }
  }

  // Use DB matches (keyed by match_percentage from DB); fallback to demo only when empty
  const displayMatches = (matches as any[]).length > 0 ? (matches as any[]) : DEMO_MATCHES
  const appliedJobIds = new Set(applications.map((a: any) => a.job_id))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Your Job Matches</h1>
          <p className="text-sm text-[#4B5563] mt-0.5">Based on your skills, performance and readiness</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing || !student?.id}
            className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Finding matches…' : 'Refresh Matches'}
          </button>
          <button className="flex items-center gap-2 text-sm font-medium text-[#4B5563] px-3 py-2 rounded-lg border border-[#E6E8F5] hover:bg-gray-50 transition-colors">
            <Filter size={15} /> Filter
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
        </div>
      ) : displayMatches.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-12 text-center">
          <Briefcase size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-[#9CA3AF]">No job matches yet. Complete your assessments to get matched.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayMatches.map((m: any) => {
            const companyName = m.jobs?.companies?.name ?? 'Company'
            const ls = getLogoStyle(companyName)
            const isApplied = appliedJobIds.has(m.jobs?.id ?? m.id)
            return (
              <div key={m.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0"
                  style={{ background: ls.bg, color: ls.color }}
                >
                  {companyName[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[#111827]">{companyName}</h3>
                  <p className="text-sm text-[#4B5563]">{m.jobs?.title}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    Matching Skills: {(m.matched_skills ?? []).slice(0, 4).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-end">
                  <MatchBadge pct={Math.round(m.match_percentage)} />
                  <button
                    onClick={() => setSelected(m)}
                    className="text-sm font-medium px-3 py-2 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 flex items-center gap-1"
                  >
                    Details <ChevronRight size={14} />
                  </button>
                  {isApplied ? (
                    <span className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                      <CheckCircle size={14} /> Applied
                    </span>
                  ) : (
                    <button
                      onClick={() => !String(m.id).startsWith('d') && applyMutation.mutate(m.jobs?.id ?? m.id)}
                      disabled={applyMutation.isPending}
                      className="text-sm font-medium px-4 py-2 rounded-lg text-white disabled:opacity-60"
                      style={{ background: '#4F46E5' }}
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Job Match Details" size="lg">
        {selected && (() => {
          const companyName = selected.jobs?.companies?.name ?? 'Company'
          const ls = getLogoStyle(companyName)
          return (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl" style={{ background: ls.bg, color: ls.color }}>
                  {companyName[0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#111827]">{companyName}</h3>
                  <p className="text-sm text-[#4B5563]">{selected.jobs?.title}</p>
                </div>
                <MatchBadge pct={Math.round(selected.match_percentage)} />
              </div>

              {selected.explanation && (
                <p className="text-sm text-[#4B5563] leading-relaxed p-3 rounded-xl bg-gray-50 border border-[#E6E8F5]">
                  {selected.explanation}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                {(selected.matched_skills ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Matched Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.matched_skills.map((s: string) => (
                        <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#DCFCE7', color: '#16A34A' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(selected.missing_skills ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Missing Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.missing_skills.map((s: string) => (
                        <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#FEE2E2', color: '#EF4444' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#4B5563]">Eligibility:</span>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                  style={{
                    background: selected.eligibility_status === 'eligible' ? '#DCFCE7' : '#FFF7ED',
                    color: selected.eligibility_status === 'eligible' ? '#16A34A' : '#F59E0B',
                  }}
                >
                  {selected.eligibility_status?.replace('_', ' ')}
                </span>
              </div>

              {(selected.recommendations ?? []).length > 0 && (
                <div className="rounded-xl p-4 border" style={{ background: '#EEF0FF', borderColor: '#C7D2FE' }}>
                  <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wide mb-2">Recommendations</p>
                  <ul className="space-y-1.5">
                    {selected.recommendations.map((r: string, i: number) => (
                      <li key={i} className="text-sm text-[#4B5563] flex items-start gap-2">
                        <span style={{ color: '#4F46E5' }}>•</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
