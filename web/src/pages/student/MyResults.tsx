import { useQuery } from '@tanstack/react-query'
import { Download, Lightbulb } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  getStudentByProfileId, getReadinessScore, getSkillGaps, getAssessmentResults
} from '../../lib/queries'
import { DEMO_RESULTS } from '../../lib/demo-data'

const RADIUS = 70
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function GaugeChart({ score }: { score: number }) {
  const pct = Math.min(score, 100) / 100
  const dashOffset = CIRCUMFERENCE * (1 - pct)
  const color = score >= 80 ? '#16A34A' : score >= 60 ? '#F59E0B' : '#EF4444'
  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="90" cy="90" r={RADIUS} fill="none" stroke="#E6E8F5" strokeWidth="14" />
        <circle cx="90" cy="90" r={RADIUS} fill="none" stroke="url(#gg)" strokeWidth="14"
          strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset} strokeLinecap="round" />
        <defs>
          <linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[#111827]">{score}</span>
        <span className="text-sm text-[#9CA3AF]">/ 100</span>
      </div>
    </div>
  )
}

export function MyResults() {
  const { user } = useAuth()

  const { data: student } = useQuery({
    queryKey: ['student', user?.id],
    queryFn: () => getStudentByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const { data: readiness, isLoading } = useQuery({
    queryKey: ['readiness', student?.id],
    queryFn: () => getReadinessScore(student!.id),
    enabled: !!student?.id,
  })

  const { data: skillGaps = [] } = useQuery({
    queryKey: ['skillGaps', student?.id],
    queryFn: () => getSkillGaps(student!.id),
    enabled: !!student?.id,
  })

  const { data: results = [] } = useQuery({
    queryKey: ['results', student?.id],
    queryFn: () => getAssessmentResults(student!.id),
    enabled: !!student?.id,
  })

  const score = readiness?.total_score ?? DEMO_RESULTS.readiness.total_score
  const displayScore = parseFloat(score.toString())

  const statusLabel = readiness?.status === 'needs_improvement' ? 'Needs Improvement'
    : readiness?.status === 'at_risk' ? 'At Risk'
    : 'Ready for Placement'
  const statusColor = readiness?.status === 'needs_improvement' ? '#F59E0B'
    : readiness?.status === 'at_risk' ? '#EF4444' : '#16A34A'
  const statusBg = readiness?.status === 'needs_improvement' ? '#FFF7ED'
    : readiness?.status === 'at_risk' ? '#FEE2E2' : '#DCFCE7'

  const performanceBars = readiness
    ? [
        { name: 'Aptitude',       score: readiness.aptitude_score,       color: '#4F46E5' },
        { name: 'Programming',    score: readiness.programming_score,    color: '#7C3AED' },
        { name: 'Communication',  score: readiness.communication_score,  color: '#16A34A' },
        { name: 'Academic',       score: readiness.academic_score,       color: '#3B82F6' },
      ]
    : [
        { name: 'Aptitude',       score: DEMO_RESULTS.readiness.aptitude_score,       color: '#4F46E5' },
        { name: 'Programming',    score: DEMO_RESULTS.readiness.programming_score,    color: '#7C3AED' },
        { name: 'Communication',  score: DEMO_RESULTS.readiness.communication_score,  color: '#16A34A' },
        { name: 'Academic',       score: DEMO_RESULTS.readiness.academic_score,       color: '#3B82F6' },
      ]

  const recommendation = (skillGaps as any[]).length > 0
    ? `Focus on: ${(skillGaps as any[]).slice(0, 2).map((g: any) => `${g.skill_name} (gap ${Math.round(g.gap)}pts)`).join(' and ')}.`
    : DEMO_RESULTS.skillGaps[0]?.recommendation ?? 'Great progress! Focus on strengthening advanced Data Structures and System Design for even better opportunities.'

  // Show demo assessment scores when DB has no results
  const displayResults = (results as any[]).length > 0 ? (results as any[]) : DEMO_RESULTS.assessments

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#111827]">My Results</h1>
        <button className="flex items-center gap-2 text-sm font-medium text-[#4B5563] px-3 py-2 rounded-lg border border-[#E6E8F5] hover:bg-gray-50 transition-colors">
          <Download size={16} /> Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-sm font-semibold text-[#111827] mb-6">Placement Readiness Score</h3>
          <div className="flex flex-col items-center">
            <GaugeChart score={displayScore} />
            <div className="mt-4 px-4 py-1.5 rounded-full text-sm font-semibold" style={{ background: statusBg, color: statusColor }}>
              {statusLabel}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-sm font-semibold text-[#111827] mb-6">Detailed Performance</h3>
          <div className="space-y-5">
            {performanceBars.map(bar => (
              <div key={bar.name}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-[#4B5563] font-medium">{bar.name}</span>
                  <span className="text-sm font-bold text-[#111827]">{Math.round(bar.score)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, bar.score)}%`, background: bar.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[12px] p-5 border border-[#C7D2FE]" style={{ background: '#EEF0FF' }}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#E0E3FF' }}>
            <Lightbulb size={18} style={{ color: '#4F46E5' }} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#111827] mb-1">Skill Gap Analysis</h4>
            <p className="text-sm text-[#4B5563] leading-relaxed">{recommendation}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E6E8F5]">
          <h3 className="text-base font-semibold text-[#111827]">Assessment Scores</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50 border-b border-[#E6E8F5]">
              {['Assessment', 'Category', 'Score', '%'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {displayResults.map((r: any, idx: number) => (
              <tr key={r.id ?? idx} className="hover:bg-gray-50/50">
                <td className="px-5 py-3.5 font-medium text-[#111827]">{r.assessments?.title ?? r.title}</td>
                <td className="px-5 py-3.5 text-[#4B5563] capitalize">{r.assessments?.category ?? r.category}</td>
                <td className="px-5 py-3.5 font-semibold text-[#111827]">{r.total_score}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: r.percentage >= 80 ? '#DCFCE7' : r.percentage >= 60 ? '#FFF7ED' : '#FEE2E2',
                      color:      r.percentage >= 80 ? '#16A34A' : r.percentage >= 60 ? '#F59E0B' : '#EF4444'
                    }}>
                    {Math.round(r.percentage)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
