import { Link } from 'react-router-dom'
import { ClipboardList, Clock, CheckCircle, Lock } from 'lucide-react'

const ASSESSMENTS = [
  {
    id: '1',
    title: 'Aptitude Test – Quantitative Section',
    category: 'aptitude',
    duration: 60,
    totalMarks: 100,
    status: 'completed',
    score: 94,
  },
  {
    id: '2',
    title: 'Programming Skills Assessment',
    category: 'programming',
    duration: 90,
    totalMarks: 100,
    status: 'completed',
    score: 90,
  },
  {
    id: '3',
    title: 'Communication Skills Assessment',
    category: 'communication',
    duration: 60,
    totalMarks: 100,
    status: 'completed',
    score: 96,
  },
]

const categoryColors: Record<string, { bg: string; text: string }> = {
  aptitude: { bg: '#EEF0FF', text: '#4F46E5' },
  programming: { bg: '#F3E8FF', text: '#7C3AED' },
  communication: { bg: '#DCFCE7', text: '#16A34A' },
}

export function Assessments() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Assessments</h1>
      <div className="grid gap-4">
        {ASSESSMENTS.map(a => {
          const cc = categoryColors[a.category]
          return (
            <div key={a.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cc.bg }}>
                <ClipboardList size={22} style={{ color: cc.text }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#111827]">{a.title}</h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cc.bg, color: cc.text }}>
                    {a.category.charAt(0).toUpperCase() + a.category.slice(1)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                    <Clock size={12} /> {a.duration} min
                  </span>
                  <span className="text-xs text-[#9CA3AF]">{a.totalMarks} marks</span>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                {a.status === 'completed' && a.score !== undefined ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} style={{ color: '#16A34A' }} />
                    <span className="text-sm font-bold text-[#111827]">{a.score}%</span>
                  </div>
                ) : a.status === 'available' ? (
                  <Link
                    to={`/student/assessments/${a.id}/take`}
                    className="text-sm font-medium px-4 py-2 rounded-lg text-white"
                    style={{ background: '#4F46E5' }}
                  >
                    Start
                  </Link>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                    <Lock size={13} /> Locked
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
