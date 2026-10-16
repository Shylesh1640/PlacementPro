import { Download, Lightbulb } from 'lucide-react'

const skills = [
  { name: 'Aptitude', score: 94, color: '#4F46E5' },
  { name: 'Programming', score: 90, color: '#7C3AED' },
  { name: 'Communication', score: 96, color: '#16A34A' },
]

const RADIUS = 70
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function GaugeChart({ score }: { score: number }) {
  const pct = score / 100
  const dashOffset = CIRCUMFERENCE * (1 - pct)
  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="90" cy="90" r={RADIUS} fill="none" stroke="#E6E8F5" strokeWidth="14" />
        <circle
          cx="90" cy="90" r={RADIUS}
          fill="none"
          stroke="url(#gauge-gradient)"
          strokeWidth="14"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#16A34A" />
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
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827]">My Results</h1>
        <button className="flex items-center gap-2 text-sm font-medium text-[#4B5563] px-3 py-2 rounded-lg border border-[#E6E8F5] hover:bg-gray-50 transition-colors">
          <Download size={16} />
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-sm font-semibold text-[#111827] mb-6">Placement Readiness Score</h3>
          <div className="flex flex-col items-center">
            <GaugeChart score={92.5} />
            <div className="mt-4 px-4 py-1.5 rounded-full text-sm font-semibold" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              Ready for Placement
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-sm font-semibold text-[#111827] mb-6">Detailed Performance</h3>
          <div className="space-y-5">
            {skills.map(skill => (
              <div key={skill.name}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-[#4B5563] font-medium">{skill.name}</span>
                  <span className="text-sm font-bold text-[#111827]">{skill.score}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${skill.score}%`, background: skill.color }}
                  />
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
            <p className="text-sm text-[#4B5563] leading-relaxed">
              Great progress! You are well prepared for placement. Focus on strengthening advanced <strong>Data Structures</strong> and <strong>System Design</strong> for even better opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
