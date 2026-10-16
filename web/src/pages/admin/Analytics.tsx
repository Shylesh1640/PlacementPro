import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'
import { getDepartmentStats, getPlacementChartData, getAdminStats } from '../../lib/queries'
import { DEMO_DEPT_STATS, DEMO_CHART_DATA, DEMO_ADMIN_STATS } from '../../lib/demo-data'

const DEMO_DEPT  = DEMO_DEPT_STATS
const DEMO_CHART = DEMO_CHART_DATA

const PIE_COLORS = ['#16A34A', '#4F46E5', '#9CA3AF']

export function AdminAnalytics() {
  const { data: deptRaw = [] } = useQuery({
    queryKey: ['deptStats'],
    queryFn: getDepartmentStats,
  })

  const { data: chartRaw = [] } = useQuery({
    queryKey: ['placementChart'],
    queryFn: getPlacementChartData,
  })

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminStats,
  })

  const deptData = deptRaw.length > 0 ? deptRaw : DEMO_DEPT
  const chartData = chartRaw.length > 0 ? chartRaw : DEMO_CHART

  const placed = deptData.reduce((a: number, d: any) => a + (d.placed ?? 0), 0)
  const total = deptData.reduce((a: number, d: any) => a + (d.total ?? d.placed ?? 0), 0)
  const totalStudents = stats?.students ?? DEMO_ADMIN_STATS.students
  const inProgress = Math.max(0, totalStudents - placed - Math.round(totalStudents * 0.2))
  const notStarted = Math.max(0, totalStudents - placed - inProgress)

  const placementPie = [
    { name: 'Placed',      value: placed     || DEMO_ADMIN_STATS.placements },
    { name: 'In Progress', value: inProgress || 520 },
    { name: 'Not Started', value: notStarted || 265 },
  ]

  const placementRate = total > 0 ? Math.round((placed / total) * 100) : DEMO_ADMIN_STATS.placementRate

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Analytics</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Students',  value: stats?.students  ?? DEMO_ADMIN_STATS.students,  color: '#4F46E5', bg: '#EEF0FF' },
          { label: 'Placed',          value: placed || DEMO_ADMIN_STATS.placements,             color: '#16A34A', bg: '#DCFCE7' },
          { label: 'Placement Rate',  value: `${placementRate}%`,                              color: '#F59E0B', bg: '#FFF7ED' },
          { label: 'Companies',       value: stats?.companies ?? DEMO_ADMIN_STATS.companies,    color: '#3B82F6', bg: '#EFF6FF' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-4">
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placement trend */}
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-5">Placement Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E6E8F5' }} />
              <Line type="monotone" dataKey="placements" stroke="#4F46E5" strokeWidth={2.5}
                dot={{ fill: '#4F46E5', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Placement status donut */}
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-5">Placement Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={placementPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {placementPie.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx]} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E6E8F5' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Department-wise bar chart */}
        <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-5">Department-wise Placements</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="dept" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E6E8F5' }} />
              <Bar dataKey="placed" name="Placed" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total" name="Total" fill="#E0E3FF" radius={[4, 4, 0, 0]} />
              <Legend iconType="rect" wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
