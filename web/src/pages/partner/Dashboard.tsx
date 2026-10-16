import { Link } from 'react-router-dom'
import { Briefcase, Users, Calendar, TrendingUp, ChevronRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const recentApplications = [
  { id: '1', student: 'Rahul Sharma', role: 'Software Development Engineer', match: 95, status: 'under_review' },
  { id: '2', student: 'Priya Mehta', role: 'Software Development Engineer', match: 78, status: 'applied' },
  { id: '3', student: 'Arjun Nair', role: 'Software Development Engineer', match: 82, status: 'shortlisted' },
]

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  applied: { bg: '#EEF0FF', color: '#4F46E5', label: 'Applied' },
  under_review: { bg: '#FFF7ED', color: '#F59E0B', label: 'Under Review' },
  shortlisted: { bg: '#DCFCE7', color: '#16A34A', label: 'Shortlisted' },
  rejected: { bg: '#FEE2E2', color: '#EF4444', label: 'Rejected' },
}

export function PartnerDashboard() {
  const { user } = useAuth()
  const companyName = user?.full_name ?? 'Your Company'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Welcome, {companyName}</h1>
        <p className="text-sm text-[#4B5563] mt-0.5">Manage your job postings and applications</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#EEF0FF' }}>
            <Briefcase size={22} style={{ color: '#4F46E5' }} />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Active Jobs</p>
            <p className="text-2xl font-bold text-[#111827]">3</p>
          </div>
        </div>
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#DCFCE7' }}>
            <Users size={22} style={{ color: '#16A34A' }} />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Total Applications</p>
            <p className="text-2xl font-bold text-[#111827]">45</p>
          </div>
        </div>
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FFF7ED' }}>
            <Calendar size={22} style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Interviews Scheduled</p>
            <p className="text-2xl font-bold text-[#111827]">8</p>
          </div>
        </div>
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#EFF6FF' }}>
            <TrendingUp size={22} style={{ color: '#3B82F6' }} />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Shortlisted</p>
            <p className="text-2xl font-bold text-[#111827]">12</p>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#111827]">Recent Applications</h3>
          <Link to="/partner/applications" className="text-sm font-medium flex items-center gap-1" style={{ color: '#4F46E5' }}>
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="space-y-3">
          {recentApplications.map(app => {
            const sc = statusConfig[app.status]
            return (
              <div key={app.id} className="flex items-center gap-4 p-3 rounded-xl border border-[#E6E8F5] hover:border-indigo-200 transition-colors">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: '#4F46E5' }}>
                  {app.student[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827]">{app.student}</p>
                  <p className="text-xs text-[#9CA3AF]">{app.role}</p>
                </div>
                <div className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                  {app.match}%
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: sc.bg, color: sc.color }}>
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
