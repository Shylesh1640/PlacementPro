import { Search, Filter, Eye } from 'lucide-react'
import { useState } from 'react'

const JOBS = [
  { id: '1', company: 'Google', title: 'Software Development Engineer', skills: ['DSA', 'System Design'], minCgpa: 7.5, isOpen: true, applications: 45 },
  { id: '2', company: 'Microsoft', title: 'Software Engineer', skills: ['Python', 'ML'], minCgpa: 7.0, isOpen: true, applications: 38 },
  { id: '3', company: 'TCS', title: 'Systems Engineer', skills: ['Java', 'Communication'], minCgpa: 6.5, isOpen: true, applications: 120 },
  { id: '4', company: 'Infosys', title: 'Technology Analyst', skills: ['Java', 'SQL'], minCgpa: 6.5, isOpen: false, applications: 89 },
]

export function AdminJobPostings() {
  const [search, setSearch] = useState('')
  const filtered = JOBS.filter(j => j.company.toLowerCase().includes(search.toLowerCase()) || j.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#111827]">Job Postings</h1>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-sm font-medium text-[#4B5563] px-3 py-2 rounded-lg border border-[#E6E8F5] hover:bg-gray-50">
            <Filter size={15} /> Filter
          </button>
        </div>
      </div>
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…" className="w-full pl-9 pr-4 py-2 text-sm border border-[#E6E8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]" />
      </div>
      <div className="space-y-3">
        {filtered.map(job => (
          <div key={job.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0" style={{ background: '#E8F0FE', color: '#4285F4' }}>
              {job.company[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-[#111827]">{job.company}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.isOpen ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-gray-100 text-gray-500'}`}>
                  {job.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
              <p className="text-sm text-[#4B5563]">{job.title}</p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {job.skills.map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#EEF0FF', color: '#4F46E5' }}>{s}</span>
                ))}
                <span className="text-xs text-[#9CA3AF]">Min CGPA: {job.minCgpa}</span>
                <span className="text-xs text-[#9CA3AF]">{job.applications} applications</span>
              </div>
            </div>
            <button className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 flex-shrink-0">
              <Eye size={13} /> View
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
