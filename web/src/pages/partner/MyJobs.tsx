import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Edit, ToggleLeft, ToggleRight, Plus } from 'lucide-react'

const JOBS = [
  { id: '1', title: 'Software Development Engineer', skills: ['DSA', 'System Design', 'Problem Solving'], minCgpa: 7.5, isOpen: true, applications: 45, posted: '2026-10-01' },
  { id: '2', title: 'Data Engineer', skills: ['Python', 'SQL', 'Spark'], minCgpa: 7.0, isOpen: true, applications: 28, posted: '2026-10-05' },
  { id: '3', title: 'Frontend Developer', skills: ['React', 'TypeScript', 'CSS'], minCgpa: 6.5, isOpen: false, applications: 36, posted: '2026-09-15' },
]

export function MyJobs() {
  const [jobs, setJobs] = useState(JOBS)
  const toggle = (id: string) => setJobs(prev => prev.map(j => j.id === id ? { ...j, isOpen: !j.isOpen } : j))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827]">My Jobs</h1>
        <Link to="/partner/post-job" className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white" style={{ background: '#4F46E5' }}>
          <Plus size={16} /> Post New Job
        </Link>
      </div>
      <div className="space-y-4">
        {jobs.map(job => (
          <div key={job.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-[#111827]">{job.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.isOpen ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-gray-100 text-gray-500'}`}>
                    {job.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {job.skills.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EEF0FF', color: '#4F46E5' }}>{s}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-[#9CA3AF]">
                  <span>Min CGPA: {job.minCgpa}</span>
                  <span>{job.applications} applications</span>
                  <span>Posted: {job.posted}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="p-2 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50">
                  <Edit size={15} />
                </button>
                <button onClick={() => toggle(job.id)}>
                  {job.isOpen
                    ? <ToggleRight size={26} style={{ color: '#16A34A' }} />
                    : <ToggleLeft size={26} className="text-gray-300" />
                  }
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
