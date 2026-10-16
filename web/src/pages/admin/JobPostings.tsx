import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Eye, Briefcase } from 'lucide-react'
import { getAllJobsAdmin } from '../../lib/queries'
import { DEMO_JOBS as DEMO_JOBS_RAW } from '../../lib/demo-data'

const DEMO_JOBS = DEMO_JOBS_RAW.map(j => ({
  id: j.id,
  title: j.title,
  required_skills: j.skills,
  min_cgpa: j.minCgpa,
  location: j.location,
  work_mode: j.workMode,
  is_open: j.isOpen,
  companies: { name: j.companyName, verified: true },
}))

export function AdminJobPostings() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['adminJobs'],
    queryFn: getAllJobsAdmin,
    refetchInterval: 60000,
  })

  const displayJobs = (jobs as any[]).length > 0 ? jobs as any[] : DEMO_JOBS

  const filtered = displayJobs.filter((j: any) => {
    const name = j.companies?.name ?? ''
    const title = j.title ?? ''
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || (statusFilter === 'open' ? j.is_open : !j.is_open)
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Job Postings</h1>
          <p className="text-sm text-[#4B5563] mt-0.5">{filtered.length} jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | 'open' | 'closed')}
            className="text-sm border border-[#E6E8F5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by company or title…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-[#E6E8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-12 text-center">
          <Briefcase size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-[#9CA3AF]">No job postings found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job: any) => (
            <div key={job.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0"
                style={{ background: '#EEF0FF', color: '#4F46E5' }}
              >
                {(job.companies?.name ?? 'C')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-[#111827]">{job.companies?.name ?? '—'}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      job.is_open ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {job.is_open ? 'Open' : 'Closed'}
                  </span>
                  {!job.companies?.verified && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#FFF7ED] text-[#F59E0B]">
                      Unverified
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#4B5563]">{job.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {(job.required_skills ?? []).slice(0, 4).map((s: string) => (
                    <span
                      key={s}
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#EEF0FF', color: '#4F46E5' }}
                    >
                      {s}
                    </span>
                  ))}
                  {job.min_cgpa > 0 && (
                    <span className="text-xs text-[#9CA3AF]">Min CGPA: {job.min_cgpa}</span>
                  )}
                  {job.location && (
                    <span className="text-xs text-[#9CA3AF]">📍 {job.location}</span>
                  )}
                  {job.created_at && (
                    <span className="text-xs text-[#9CA3AF]">
                      Posted {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 flex-shrink-0 transition-colors">
                <Eye size={13} /> View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
