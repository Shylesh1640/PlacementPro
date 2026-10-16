import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ToggleLeft, ToggleRight, Plus, Users } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getCompanyByProfileId, getCompanyJobs, toggleJobOpen } from '../../lib/queries'
import { DEMO_JOBS as DEMO_JOBS_RAW } from '../../lib/demo-data'

const GOOGLE_DEMO_JOBS = DEMO_JOBS_RAW.filter(j => j.companyName === 'Google').map(j => ({
  id: j.id, title: j.title, required_skills: j.skills, min_cgpa: j.minCgpa,
  location: j.location, work_mode: j.workMode, is_open: j.isOpen,
  created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  applications: [{ count: j.applications }],
}))

export function MyJobs() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: company } = useQuery({
    queryKey: ['company', user?.id],
    queryFn: () => getCompanyByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['companyJobs', company?.id],
    queryFn: () => getCompanyJobs(company!.id),
    enabled: !!company?.id,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isOpen }: { id: string; isOpen: boolean }) => toggleJobOpen(id, isOpen),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companyJobs', company?.id] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">My Jobs</h1>
          <p className="text-sm text-[#4B5563] mt-0.5">{(jobs as any[]).length || GOOGLE_DEMO_JOBS.length} job{((jobs as any[]).length || GOOGLE_DEMO_JOBS.length) !== 1 ? 's' : ''} posted</p>
        </div>
        <Link to="/partner/post-job" className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white" style={{ background: '#4F46E5' }}>
          <Plus size={16} /> Post New Job
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {((jobs as any[]).length > 0 ? jobs as any[] : GOOGLE_DEMO_JOBS).map((job: any) => {
            const appCount = job.applications?.[0]?.count ?? 0
            return (
              <div key={job.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[#111827]">{job.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.is_open ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-gray-100 text-gray-500'}`}>
                        {job.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(job.required_skills ?? []).slice(0, 5).map((s: string) => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EEF0FF', color: '#4F46E5' }}>{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#9CA3AF]">
                      {job.min_cgpa > 0 && <span>Min CGPA: {job.min_cgpa}</span>}
                      {job.location && <span>📍 {job.location}</span>}
                      {job.work_mode && <span className="capitalize">{job.work_mode}</span>}
                      <span className="flex items-center gap-1"><Users size={11} /> {appCount} applications</span>
                      <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate({ id: job.id, isOpen: !job.is_open })}
                    className="flex-shrink-0 mt-1"
                    title={job.is_open ? 'Close job' : 'Reopen job'}
                  >
                    {job.is_open
                      ? <ToggleRight size={26} style={{ color: '#16A34A' }} />
                      : <ToggleLeft size={26} className="text-gray-300" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
