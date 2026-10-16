import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Briefcase, Users, Calendar, TrendingUp, ChevronRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getCompanyByProfileId, getCompanyJobs, getApplicationsForCompany } from '../../lib/queries'
import { supabase } from '../../lib/supabase'

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  applied:      { bg: '#EEF0FF', color: '#4F46E5',  label: 'Applied' },
  under_review: { bg: '#FFF7ED', color: '#F59E0B',  label: 'Under Review' },
  shortlisted:  { bg: '#DCFCE7', color: '#16A34A',  label: 'Shortlisted' },
  rejected:     { bg: '#FEE2E2', color: '#EF4444',  label: 'Rejected' },
  offered:      { bg: '#F3E8FF', color: '#7C3AED',  label: 'Offered' },
}

const DEMO_APPS = [
  { id: 'd1', student: 'Rahul Sharma', role: 'Software Development Engineer', match: 95, status: 'under_review' },
  { id: 'd2', student: 'Priya Mehta',  role: 'Software Development Engineer', match: 78, status: 'applied' },
  { id: 'd3', student: 'Arjun Nair',   role: 'Software Development Engineer', match: 82, status: 'shortlisted' },
]

export function PartnerDashboard() {
  const { user } = useAuth()

  const { data: company } = useQuery({
    queryKey: ['company', user?.id],
    queryFn: () => getCompanyByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const companyId = (company as any)?.id

  const { data: jobs = [] } = useQuery({
    queryKey: ['companyJobs', companyId],
    queryFn: () => getCompanyJobs(companyId),
    enabled: !!companyId,
  })

  const { data: applications = [] } = useQuery({
    queryKey: ['companyApplications', companyId],
    queryFn: () => getApplicationsForCompany(companyId),
    enabled: !!companyId,
  })

  const { data: interviewCount = 0 } = useQuery({
    queryKey: ['partnerInterviewCount', companyId],
    queryFn: async () => {
      const { count } = await supabase
        .from('interviews')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'scheduled')
      return count ?? 0
    },
    enabled: !!companyId,
  })

  const activeJobs  = (jobs as any[]).filter((j: any) => j.is_open).length
  const totalApps   = (applications as any[]).length
  const shortlisted = (applications as any[]).filter((a: any) => a.status === 'shortlisted').length

  const recentApps = (applications as any[]).slice(0, 3).map((a: any) => ({
    id: a.id,
    student: a.students?.profiles?.full_name ?? '—',
    role: a.jobs?.title ?? '—',
    match: null,
    status: a.status,
  }))

  const displayApps = recentApps.length > 0 ? recentApps : DEMO_APPS

  const companyName = (company as any)?.name ?? user?.full_name ?? 'Your Company'

  const kpis = [
    { label: 'Active Jobs',           value: companyId ? activeJobs  : 3,  icon: <Briefcase  size={22} style={{ color: '#4F46E5' }} />, bg: '#EEF0FF' },
    { label: 'Total Applications',    value: companyId ? totalApps   : 45, icon: <Users      size={22} style={{ color: '#16A34A' }} />, bg: '#DCFCE7' },
    { label: 'Interviews Scheduled',  value: companyId ? interviewCount : 8, icon: <Calendar size={22} style={{ color: '#F59E0B' }} />, bg: '#FFF7ED' },
    { label: 'Shortlisted',           value: companyId ? shortlisted : 12, icon: <TrendingUp size={22} style={{ color: '#3B82F6' }} />, bg: '#EFF6FF' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Welcome, {companyName}</h1>
        <p className="text-sm text-[#4B5563] mt-0.5">Manage your job postings and applications</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: k.bg }}>
              {k.icon}
            </div>
            <div>
              <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">{k.label}</p>
              <p className="text-2xl font-bold text-[#111827]">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#111827]">Recent Applications</h3>
          <Link to="/partner/applications" className="text-sm font-medium flex items-center gap-1" style={{ color: '#4F46E5' }}>
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="space-y-3">
          {displayApps.map((app: any) => {
            const sc = statusConfig[app.status] ?? statusConfig.applied
            return (
              <div key={app.id} className="flex items-center gap-4 p-3 rounded-xl border border-[#E6E8F5] hover:border-indigo-200 transition-colors">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: '#4F46E5' }}>
                  {app.student?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827]">{app.student}</p>
                  <p className="text-xs text-[#9CA3AF] truncate">{app.role}</p>
                </div>
                {app.match != null && (
                  <div className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                    {app.match}%
                  </div>
                )}
                <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0" style={{ background: sc.bg, color: sc.color }}>
                  {sc.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
