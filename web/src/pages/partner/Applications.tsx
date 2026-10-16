import { useState } from 'react'
import { CheckCircle, XCircle, Filter } from 'lucide-react'

const APPLICATIONS = [
  { id: '1', student: 'Rahul Sharma', job: 'Software Development Engineer', match: 95, readiness: 92.5, cgpa: 8.5, proctoring: 'normal', status: 'under_review' },
  { id: '2', student: 'Priya Mehta', job: 'Software Development Engineer', match: 78, readiness: 75.0, cgpa: 7.8, proctoring: 'review_required', status: 'applied' },
  { id: '3', student: 'Arjun Nair', job: 'Software Development Engineer', match: 88, readiness: 86.0, cgpa: 8.9, proctoring: 'normal', status: 'shortlisted' },
  { id: '4', student: 'Karthik R', job: 'Data Engineer', match: 82, readiness: 68.0, cgpa: 7.2, proctoring: 'normal', status: 'applied' },
]

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  applied: { bg: '#EEF0FF', color: '#4F46E5', label: 'Applied' },
  under_review: { bg: '#FFF7ED', color: '#F59E0B', label: 'Under Review' },
  shortlisted: { bg: '#DCFCE7', color: '#16A34A', label: 'Shortlisted' },
  rejected: { bg: '#FEE2E2', color: '#EF4444', label: 'Rejected' },
}

const proctoringConfig: Record<string, { bg: string; color: string; label: string }> = {
  normal: { bg: '#DCFCE7', color: '#16A34A', label: 'Normal' },
  review_required: { bg: '#FFF7ED', color: '#F59E0B', label: 'Review' },
  flagged: { bg: '#FEE2E2', color: '#EF4444', label: 'Flagged' },
}

export function Applications() {
  const [apps, setApps] = useState(APPLICATIONS)

  const shortlist = (id: string) => setApps(prev => prev.map(a => a.id === id ? { ...a, status: 'shortlisted' } : a))
  const reject = (id: string) => setApps(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#111827]">Applications</h1>
        <button className="flex items-center gap-1.5 text-sm font-medium text-[#4B5563] px-3 py-2 rounded-lg border border-[#E6E8F5] hover:bg-gray-50">
          <Filter size={15} /> Filter
        </button>
      </div>
      <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E6E8F5] bg-gray-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Student</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Match %</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Readiness</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Proctoring</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {[...apps].sort((a, b) => b.match - a.match).map(app => {
              const sc = statusConfig[app.status]
              const pc = proctoringConfig[app.proctoring]
              return (
                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#4F46E5' }}>
                        {app.student[0]}
                      </div>
                      <div>
                        <div className="font-medium text-[#111827]">{app.student}</div>
                        <div className="text-xs text-[#9CA3AF]">CGPA: {app.cgpa}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[#4B5563] text-xs">{app.job}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-bold" style={{ color: app.match >= 90 ? '#16A34A' : app.match >= 80 ? '#3B82F6' : '#F59E0B' }}>
                      {app.match}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${app.readiness}%`, background: '#4F46E5' }} />
                      </div>
                      <span className="text-xs font-medium text-[#111827]">{app.readiness}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {app.status !== 'shortlisted' && app.status !== 'rejected' ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => shortlist(app.id)} className="p-1.5 rounded-lg text-white" style={{ background: '#16A34A' }}>
                          <CheckCircle size={13} />
                        </button>
                        <button onClick={() => reject(app.id)} className="p-1.5 rounded-lg text-white" style={{ background: '#EF4444' }}>
                          <XCircle size={13} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#9CA3AF]">Decided</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
