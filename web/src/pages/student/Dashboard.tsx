import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend
} from 'recharts'
import { Target, CheckSquare, Briefcase, Calendar } from 'lucide-react'

const skillData = [
  { subject: 'Programming', student: 90, target: 80 },
  { subject: 'Communication', student: 96, target: 80 },
  { subject: 'Aptitude', student: 94, target: 80 },
  { subject: 'Technical Skills', student: 85, target: 80 },
  { subject: 'Problem Solving', student: 88, target: 80 },
]

const jobMatches = [
  {
    company: 'Google',
    role: 'Software Development Engineer',
    match: 95,
    logo: 'G',
    logoColor: '#4285F4',
    logoBg: '#E8F0FE',
  },
  {
    company: 'Microsoft',
    role: 'Software Engineer',
    match: 92,
    logo: 'M',
    logoColor: '#00A4EF',
    logoBg: '#E3F5FD',
  },
  {
    company: 'TCS',
    role: 'Systems Engineer',
    match: 88,
    logo: 'T',
    logoColor: '#E31837',
    logoBg: '#FDEAED',
  },
]

export function StudentDashboard() {
  const { user } = useAuth()
  const firstName = user?.full_name?.split(' ')[0] ?? 'Student'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Hello, {firstName}!</h1>
        <p className="text-sm text-[#4B5563] mt-0.5">Here's your placement overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#EEF0FF' }}>
            <Target size={22} style={{ color: '#4F46E5' }} />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Placement Readiness</p>
            <p className="text-2xl font-bold text-[#111827]">92.5 <span className="text-sm font-normal text-[#9CA3AF]">/ 100</span></p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#DCFCE7' }}>
            <CheckSquare size={22} style={{ color: '#16A34A' }} />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Assessments Completed</p>
            <p className="text-2xl font-bold text-[#111827]">3 <span className="text-sm font-normal text-[#9CA3AF]">/ 3</span></p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#EFF6FF' }}>
            <Briefcase size={22} style={{ color: '#3B82F6' }} />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Eligible Job Matches</p>
            <p className="text-2xl font-bold text-[#111827]">5+</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FFF7ED' }}>
            <Calendar size={22} style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Upcoming Interviews</p>
            <p className="text-2xl font-bold text-[#111827]">1</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-4">Your Skill Gap Analysis</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={skillData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#E6E8F5" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#4B5563', fontSize: 11 }} />
              <Radar
                name="Your Score"
                dataKey="student"
                stroke="#4F46E5"
                fill="#4F46E5"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Radar
                name="Target"
                dataKey="target"
                stroke="#C7D2FE"
                fill="#C7D2FE"
                fillOpacity={0.1}
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => <span style={{ color: '#4B5563' }}>{value}</span>}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#111827]">Recommended Job Opportunities</h3>
            <Link to="/student/job-matches" className="text-sm font-medium" style={{ color: '#4F46E5' }}>
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {jobMatches.map((job) => (
              <div
                key={job.company}
                className="flex items-center gap-3 p-3 rounded-xl border border-[#E6E8F5] hover:border-indigo-200 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-base"
                  style={{ background: job.logoBg, color: job.logoColor }}
                >
                  {job.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{job.company}</p>
                  <p className="text-xs text-[#4B5563] truncate">{job.role}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: '#16A34A' }}>
                    Match: {job.match}%
                  </p>
                </div>
                <button
                  className="text-xs font-medium px-3 py-1.5 rounded-lg text-white flex-shrink-0"
                  style={{ background: '#4F46E5' }}
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
