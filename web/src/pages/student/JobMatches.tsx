import { useState } from 'react'
import { Filter, ChevronRight } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'

interface Job {
  id: string
  company: string
  role: string
  matchingSkills: string[]
  match: number
  logo: string
  logoColor: string
  logoBg: string
  missingSkills: string[]
  eligibility: 'eligible' | 'review_required' | 'not_eligible'
  recommendations: string[]
}

const JOBS: Job[] = [
  {
    id: '1',
    company: 'Google',
    role: 'Software Development Engineer',
    matchingSkills: ['DSA', 'System Design', 'Problem Solving'],
    match: 95,
    logo: 'G',
    logoColor: '#4285F4',
    logoBg: '#E8F0FE',
    missingSkills: ['Kubernetes'],
    eligibility: 'eligible',
    recommendations: ['Learn container orchestration with Kubernetes', 'Practice Google coding rounds on LeetCode'],
  },
  {
    id: '2',
    company: 'Microsoft',
    role: 'Software Engineer',
    matchingSkills: ['Python', 'ML', 'Data Analysis'],
    match: 92,
    logo: 'M',
    logoColor: '#00A4EF',
    logoBg: '#E3F5FD',
    missingSkills: ['Azure', 'C#'],
    eligibility: 'eligible',
    recommendations: ['Explore Microsoft Azure fundamentals', 'Learn C# basics for .NET development'],
  },
  {
    id: '3',
    company: 'TCS',
    role: 'Systems Engineer',
    matchingSkills: ['Java', 'Software', 'Communication'],
    match: 88,
    logo: 'T',
    logoColor: '#E31837',
    logoBg: '#FDEAED',
    missingSkills: [],
    eligibility: 'eligible',
    recommendations: ['Practice TCS NQT mock tests', 'Review core Java concepts'],
  },
]

function MatchBadge({ pct }: { pct: number }) {
  const color = pct >= 90 ? '#16A34A' : pct >= 80 ? '#3B82F6' : '#F59E0B'
  const bg = pct >= 90 ? '#DCFCE7' : pct >= 80 ? '#EFF6FF' : '#FFF7ED'
  return (
    <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ color, background: bg }}>
      {pct}% Match
    </span>
  )
}

export function JobMatches() {
  const [selected, setSelected] = useState<Job | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Your Job Matches</h1>
          <p className="text-sm text-[#4B5563] mt-0.5">Based on your skills, performance and readiness</p>
        </div>
        <button className="flex items-center gap-2 text-sm font-medium text-[#4B5563] px-3 py-2 rounded-lg border border-[#E6E8F5] hover:bg-gray-50 transition-colors">
          <Filter size={15} />
          Filter
        </button>
      </div>

      <div className="space-y-4">
        {JOBS.map(job => (
          <div
            key={job.id}
            className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4"
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xl"
              style={{ background: job.logoBg, color: job.logoColor }}
            >
              {job.logo}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[#111827]">{job.company}</h3>
              <p className="text-sm text-[#4B5563]">{job.role}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Matching Skills: {job.matchingSkills.join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-end">
              <MatchBadge pct={job.match} />
              <button
                onClick={() => setSelected(job)}
                className="text-sm font-medium px-4 py-2 rounded-lg text-white flex items-center gap-1"
                style={{ background: '#4F46E5' }}
              >
                View Details <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Job Match Details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl"
                style={{ background: selected.logoBg, color: selected.logoColor }}
              >
                {selected.logo}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#111827]">{selected.company}</h3>
                <p className="text-sm text-[#4B5563]">{selected.role}</p>
              </div>
              <div className="ml-auto">
                <MatchBadge pct={selected.match} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Matched Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selected.matchingSkills.map(s => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#DCFCE7', color: '#16A34A' }}>{s}</span>
                  ))}
                </div>
              </div>
              {selected.missingSkills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Missing Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.missingSkills.map(s => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#FEE2E2', color: '#EF4444' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#4B5563]">Eligibility:</span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: selected.eligibility === 'eligible' ? '#DCFCE7' : '#FFF7ED',
                  color: selected.eligibility === 'eligible' ? '#16A34A' : '#F59E0B',
                }}
              >
                {selected.eligibility === 'eligible' ? 'Eligible' : 'Review Required'}
              </span>
            </div>

            {selected.recommendations.length > 0 && (
              <div className="rounded-xl p-4 border" style={{ background: '#EEF0FF', borderColor: '#C7D2FE' }}>
                <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wide mb-2">Recommendations</p>
                <ul className="space-y-1.5">
                  {selected.recommendations.map((r, i) => (
                    <li key={i} className="text-sm text-[#4B5563] flex items-start gap-2">
                      <span style={{ color: '#4F46E5' }} className="mt-0.5">•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
