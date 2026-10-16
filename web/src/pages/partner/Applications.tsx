import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Users } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getCompanyByProfileId, getApplicationsForCompany, updateApplicationStatus } from '../../lib/queries'

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  applied: { bg: '#EEF0FF', color: '#4F46E5', label: 'Applied' },
  under_review: { bg: '#FFF7ED', color: '#F59E0B', label: 'Under Review' },
  shortlisted: { bg: '#DCFCE7', color: '#16A34A', label: 'Shortlisted' },
  rejected: { bg: '#FEE2E2', color: '#EF4444', label: 'Rejected' },
  offered: { bg: '#F3E8FF', color: '#7C3AED', label: 'Offered' },
}
const procConfig: Record<string, { bg: string; color: string; label: string }> = {
  normal: { bg: '#DCFCE7', color: '#16A34A', label: 'Normal' },
  review_required: { bg: '#FFF7ED', color: '#F59E0B', label: 'Review' },
  flagged: { bg: '#FEE2E2', color: '#EF4444', label: 'Flagged' },
}

const DEMO_APPLICATIONS = [
  { id: 'd1', status: 'under_review', applied_at: new Date().toISOString(), jobs: { title: 'Software Development Engineer' },
    students: { cgpa: 8.5, backlogs: 0, readiness_score: 92.5, proctoring_status: 'normal', profiles: { full_name: 'Rahul Sharma', email: 'rahul.sharma@student.placementpro.dev' } } },
  { id: 'd2', status: 'applied', applied_at: new Date().toISOString(), jobs: { title: 'Software Development Engineer' },
    students: { cgpa: 7.8, backlogs: 1, readiness_score: 75.0, proctoring_status: 'review_required', profiles: { full_name: 'Priya Mehta', email: 'priya.mehta@student.placementpro.dev' } } },
  { id: 'd3', status: 'shortlisted', applied_at: new Date().toISOString(), jobs: { title: 'Software Development Engineer' },
    students: { cgpa: 9.1, backlogs: 0, readiness_score: 88.0, proctoring_status: 'normal', profiles: { full_name: 'Arjun Nair', email: 'arjun.nair@student.placementpro.dev' } } },
]

export function Applications() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: company } = useQuery({
    queryKey: ['company', user?.id],
    queryFn: () => getCompanyByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['companyApplications', company?.id],
    queryFn: () => getApplicationsForCompany(company!.id),
    enabled: !!company?.id,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateApplicationStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companyApplications', company?.id] }),
  })

  const displayApps = applications.length > 0 ? applications : DEMO_APPLICATIONS
  const filtered = statusFilter === 'all' ? displayApps : displayApps.filter((a: any) => a.status === statusFilter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Applications</h1>
          <p className="text-sm text-[#4B5563] mt-0.5">{filtered.length} applications</p>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-[#E6E8F5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]">
          <option value="all">All Status</option>
          {Object.entries(statusConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-12 text-center">
          <Users size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-[#9CA3AF]">No applications yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6E8F5] bg-gray-50/50">
                {['Student', 'Role', 'CGPA', 'Readiness', 'Proctoring', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filtered.map((app: any) => {
                const sc = statusConfig[app.status] ?? statusConfig.applied
                const pc = procConfig[app.students?.proctoring_status ?? 'normal'] ?? procConfig.normal
                const canAct = app.status === 'applied' || app.status === 'under_review'
                return (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#4F46E5' }}>
                          {(app.students?.profiles?.full_name ?? 'S')[0]}
                        </div>
                        <div>
                          <div className="font-medium text-[#111827]">{app.students?.profiles?.full_name ?? '—'}</div>
                          <div className="text-xs text-[#9CA3AF]">{app.students?.profiles?.email ?? ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#4B5563]">{app.jobs?.title ?? '—'}</td>
                    <td className="px-4 py-3.5 font-semibold text-[#111827]">{app.students?.cgpa ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      {app.students?.readiness_score ? (
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${app.students.readiness_score}%`, background: '#4F46E5' }} />
                          </div>
                          <span className="text-xs">{app.students.readiness_score}</span>
                        </div>
                      ) : <span className="text-xs text-[#9CA3AF]">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {canAct && !app.id.startsWith('d') ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => updateMutation.mutate({ id: app.id, status: 'shortlisted' })}
                            disabled={updateMutation.isPending}
                            className="p-1.5 rounded-lg text-white disabled:opacity-60" style={{ background: '#16A34A' }}>
                            <CheckCircle size={14} />
                          </button>
                          <button onClick={() => updateMutation.mutate({ id: app.id, status: 'rejected' })}
                            disabled={updateMutation.isPending}
                            className="p-1.5 rounded-lg text-white disabled:opacity-60" style={{ background: '#EF4444' }}>
                            <XCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#9CA3AF]">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
