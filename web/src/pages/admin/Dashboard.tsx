import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Building2, Calendar, ClipboardList, ArrowRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getAdminStats, getPlacementChartData } from '../../lib/queries'
import { supabase } from '../../lib/supabase'
import { DEMO_CHART_DATA, DEMO_RECENT_ACTIVITIES } from '../../lib/demo-data'

const DEMO_CHART = DEMO_CHART_DATA

const activityColors: Record<string, { bg: string; dot: string }> = {
  job: { bg: '#EEF0FF', dot: '#4F46E5' },
  interview: { bg: '#DCFCE7', dot: '#16A34A' },
  assessment: { bg: '#FFF7ED', dot: '#F59E0B' },
  company: { bg: '#EFF6FF', dot: '#3B82F6' },
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return `${Math.round(diff)}s ago`
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  return `${Math.round(diff / 86400)}d ago`
}

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminStats,
    refetchInterval: 30000,
  })

  const { data: chartRaw = [] } = useQuery({
    queryKey: ['placementChart'],
    queryFn: getPlacementChartData,
  })

  const { data: recentInterviews = [] } = useQuery({
    queryKey: ['recentInterviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interviews')
        .select('id, created_at, students(profiles(full_name)), companies(name)')
        .order('created_at', { ascending: false })
        .limit(3)
      if (error) return []
      return (data ?? []).map((i: any) => ({
        id: i.id,
        text: `Interview scheduled: ${i.students?.profiles?.full_name ?? 'Student'} @ ${i.companies?.name ?? 'Company'}`,
        time: timeAgo(i.created_at),
        type: 'interview',
      }))
    },
  })

  const { data: recentJobs = [] } = useQuery({
    queryKey: ['recentJobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, created_at, companies(name)')
        .order('created_at', { ascending: false })
        .limit(2)
      if (error) return []
      return (data ?? []).map((j: any) => ({
        id: j.id,
        text: `New job posted by ${j.companies?.name ?? 'Company'}: ${j.title}`,
        time: timeAgo(j.created_at),
        type: 'job',
      }))
    },
  })

  const chartData = chartRaw.length > 0 ? chartRaw : DEMO_CHART

  const liveActivities = [...recentJobs, ...recentInterviews]
  const recentActivities = liveActivities.length > 0
    ? liveActivities.slice(0, 5)
    : DEMO_RECENT_ACTIVITIES

  const kpiCards = [
    { title: 'Total Students',      value: stats?.students           ?? 1250, icon: <Users       size={22} style={{ color: '#4F46E5' }} />, iconBg: '#EEF0FF' },
    { title: 'Total Companies',     value: stats?.companies          ?? 120,  icon: <Building2   size={22} style={{ color: '#16A34A' }} />, iconBg: '#DCFCE7' },
    { title: 'Upcoming Interviews', value: stats?.upcomingInterviews ?? 85,   icon: <Calendar    size={22} style={{ color: '#F59E0B' }} />, iconBg: '#FFF7ED' },
    { title: 'Active Assessments',  value: stats?.activeAssessments  ?? 3,    icon: <ClipboardList size={22} style={{ color: '#7C3AED' }} />, iconBg: '#F3E8FF' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Admin Dashboard</h1>
        <p className="text-sm text-[#4B5563] mt-0.5">Monitor and manage the placement ecosystem</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <div key={card.title} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: card.iconBg }}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">{card.title}</p>
              <p className="text-2xl font-bold text-[#111827]">
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-5">Placement Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E6E8F5', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
              <Line
                type="monotone"
                dataKey="placements"
                stroke="#4F46E5"
                strokeWidth={2.5}
                dot={{ fill: '#4F46E5', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#111827]">Recent Activities</h3>
            <Link to="/admin/reports" className="text-sm font-medium flex items-center gap-1" style={{ color: '#4F46E5' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivities.map(act => {
              const ac = activityColors[act.type] ?? activityColors.job
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
