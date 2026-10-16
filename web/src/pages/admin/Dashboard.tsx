import { Link } from 'react-router-dom'
import { Users, Building2, Calendar, ClipboardList, ArrowRight } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'


const chartData = [
  { month: 'Aug', placements: 180 },
  { month: 'Sep', placements: 290 },
  { month: 'Oct', placements: 350 },
  { month: 'Nov', placements: 480 },
  { month: 'Dec', placements: 620 },
]

const recentActivities = [
  { id: '1', text: 'New job posted by Google', time: '2m ago', type: 'job' },
  { id: '2', text: 'Interview scheduled: Rahul S', time: '5m ago', type: 'interview' },
  { id: '3', text: 'Assessment completed: 45 students', time: '10m ago', type: 'assessment' },
  { id: '4', text: 'Company registered: Infosys', time: '30m ago', type: 'company' },
  { id: '5', text: 'Profile updated: Priya M', time: '1h ago', type: 'profile' },
]

const activityColors: Record<string, { bg: string; dot: string }> = {
  job: { bg: '#EEF0FF', dot: '#4F46E5' },
  interview: { bg: '#DCFCE7', dot: '#16A34A' },
  assessment: { bg: '#FFF7ED', dot: '#F59E0B' },
  company: { bg: '#EFF6FF', dot: '#3B82F6' },
  profile: { bg: '#F3E8FF', dot: '#7C3AED' },
}

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Admin Dashboard</h1>
        <p className="text-sm text-[#4B5563] mt-0.5">Monitor and manage the placement ecosystem</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#EEF0FF' }}>
            <Users size={22} style={{ color: '#4F46E5' }} />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Total Students</p>
            <p className="text-2xl font-bold text-[#111827]">1,250</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#DCFCE7' }}>
            <Building2 size={22} style={{ color: '#16A34A' }} />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Total Companies</p>
            <p className="text-2xl font-bold text-[#111827]">120</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FFF7ED' }}>
            <Calendar size={22} style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Upcoming Interviews</p>
            <p className="text-2xl font-bold text-[#111827]">85</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F3E8FF' }}>
            <ClipboardList size={22} style={{ color: '#7C3AED' }} />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Active Assessments</p>
            <p className="text-2xl font-bold text-[#111827]">3</p>
          </div>
        </div>
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-5">Placement Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 750]} tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E6E8F5', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                labelStyle={{ fontWeight: 600, color: '#111827' }}
              />
              <Line
                type="monotone"
                dataKey="placements"
                stroke="#4F46E5"
                strokeWidth={2.5}
                dot={{ fill: '#4F46E5', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#4F46E5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#111827]">Recent Activities</h3>
            <Link to="/admin/reports" className="text-sm font-medium flex items-center gap-1" style={{ color: '#4F46E5' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivities.map(act => {
              const ac = activityColors[act.type]
              return (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: ac.bg }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: ac.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#111827] leading-snug">{act.text}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{act.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
