import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { ClipboardList, Clock, CheckCircle, ChevronRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getStudentByProfileId, getActiveAssessments, getStudentAttempts } from '../../lib/queries'

const categoryConfig: Record<string, { bg: string; color: string }> = {
  aptitude: { bg: '#EEF0FF', color: '#4F46E5' },
  programming: { bg: '#F3E8FF', color: '#7C3AED' },
  communication: { bg: '#DCFCE7', color: '#16A34A' },
}

const DEMO_ASSESSMENTS = [
  { id: 'demo-1', title: 'Aptitude Test – Quantitative Section', category: 'aptitude', duration_minutes: 60, total_marks: 100, is_active: true, demoScore: 94 },
  { id: 'demo-2', title: 'Programming Skills Assessment', category: 'programming', duration_minutes: 90, total_marks: 100, is_active: true, demoScore: 90 },
  { id: 'demo-3', title: 'Communication Skills Assessment', category: 'communication', duration_minutes: 60, total_marks: 100, is_active: true, demoScore: 96 },
]

export function Assessments() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: student } = useQuery({
    queryKey: ['student', user?.id],
    queryFn: () => getStudentByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const { data: assessments = [], isLoading: loadingA } = useQuery({
    queryKey: ['assessments'],
    queryFn: getActiveAssessments,
  })

  const { data: attemptsRaw = [], isLoading: loadingAt } = useQuery({
    queryKey: ['attempts', student?.id],
    queryFn: () => getStudentAttempts(student!.id),
    enabled: !!student?.id,
  })
  const attempts = attemptsRaw as any[]

  const displayAssessments = assessments.length > 0 ? assessments : DEMO_ASSESSMENTS
  const getAttempt = (assessmentId: string) =>
    attempts.find((a: any) => a.assessment_id === assessmentId)
  const isLoading = loadingA || loadingAt

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827]">Assessments</h1>
        <span className="text-sm text-[#9CA3AF]">{displayAssessments.length} available</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {displayAssessments.map((a: any) => {
            const attempt = getAttempt(a.id)
            const isDone = attempt?.status === 'submitted' || attempt?.status === 'auto_submitted'
            const inProgress = attempt?.status === 'in_progress'
            const cc = categoryConfig[a.category] ?? categoryConfig.aptitude
            const score = attempt?.percentage ?? a.demoScore

            return (
              <div key={a.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cc.bg }}>
                  <ClipboardList size={22} style={{ color: cc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#111827]">{a.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: cc.bg, color: cc.color }}>
                      {a.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                      <Clock size={12} /> {a.duration_minutes} min
                    </span>
                    <span className="text-xs text-[#9CA3AF]">{a.total_marks} marks</span>
                    {isDone && attempt?.submitted_at && (
                      <span className="text-xs text-[#9CA3AF]">
                        Submitted {new Date(attempt.submitted_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {isDone ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} style={{ color: '#16A34A' }} />
                      <span className="text-sm font-bold text-[#111827]">{Math.round(score ?? 0)}%</span>
                      <Link to="/student/results" className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50">
                        View Results
                      </Link>
                    </div>
                  ) : inProgress ? (
                    <button
                      onClick={() => navigate(`/student/assessments/${a.id}/take`)}
                      className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white"
                      style={{ background: '#F59E0B' }}
                    >
                      Continue <ChevronRight size={14} />
                    </button>
                  ) : a.id.startsWith('demo-') ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} style={{ color: '#16A34A' }} />
                      <span className="text-sm font-bold text-[#111827]">{score}%</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate(`/student/assessments/${a.id}/take`)}
                      className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white"
                      style={{ background: '#4F46E5' }}
                    >
                      Start <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
