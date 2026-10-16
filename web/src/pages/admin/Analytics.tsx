import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const deptData = [
  { dept: 'CS', placed: 180, total: 200 },
  { dept: 'IT', placed: 120, total: 150 },
  { dept: 'ECE', placed: 90, total: 130 },
  { dept: 'ME', placed: 45, total: 100 },
  { dept: 'Civil', placed: 30, total: 80 },
]

const placementPie = [
  { name: 'Placed', value: 465 },
  { name: 'In Progress', value: 520 },
  { name: 'Not Started', value: 265 },
]

const PIE_COLORS = ['#16A34A', '#4F46E5', '#9CA3AF']

export function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Analytics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-5">Department-wise Placements</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="dept" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E6E8F5' }} />
              <Bar dataKey="placed" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total" fill="#E0E3FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
      </div>
    </div>
  )
}
