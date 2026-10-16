import { useState } from 'react'
import { Search, Filter, Download, Eye } from 'lucide-react'

const STUDENTS = [
  { id: '1', name: 'Rahul Sharma', department: 'Computer Science', cgpa: 8.5, readiness: 92.5, status: 'placement_ready', proctoring: 'normal', applied: 3 },
  { id: '2', name: 'Priya Mehta', department: 'Information Technology', cgpa: 7.8, readiness: 75.0, status: 'needs_improvement', proctoring: 'review_required', applied: 1 },
  { id: '3', name: 'Arjun Nair', department: 'Electronics', cgpa: 9.1, readiness: 88.0, status: 'placement_ready', proctoring: 'normal', applied: 4 },
  { id: '4', name: 'Sneha Patel', department: 'Computer Science', cgpa: 6.5, readiness: 55.0, status: 'at_risk', proctoring: 'flagged', applied: 0 },
  { id: '5', name: 'Karthik R', department: 'Mechanical', cgpa: 7.2, readiness: 68.0, status: 'needs_improvement', proctoring: 'normal', applied: 2 },
]

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  placement_ready: { label: 'Ready', bg: '#DCFCE7', color: '#16A34A' },
  needs_improvement: { label: 'Needs Work', bg: '#FFF7ED', color: '#F59E0B' },
  at_risk: { label: 'At Risk', bg: '#FEE2E2', color: '#EF4444' },
}

const proctoringConfig: Record<string, { label: string; bg: string; color: string }> = {
  normal: { label: 'Normal', bg: '#DCFCE7', color: '#16A34A' },
  review_required: { label: 'Review', bg: '#FFF7ED', color: '#F59E0B' },
  flagged: { label: 'Flagged', bg: '#FEE2E2', color: '#EF4444' },
}

export function AdminStudents() {
  const [search, setSearch] = useState('')

  const filtered = STUDENTS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#111827]">Students</h1>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-sm font-medium text-[#4B5563] px-3 py-2 rounded-lg border border-[#E6E8F5] hover:bg-gray-50">
            <Filter size={15} /> Filter
          </button>
          <button className="flex items-center gap-2 text-sm font-medium text-[#4B5563] px-3 py-2 rounded-lg border border-[#E6E8F5] hover:bg-gray-50">
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search students…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-[#E6E8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        />
      </div>

      <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E6E8F5] bg-gray-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Student</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Department</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">CGPA</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Readiness</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Proctoring</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {filtered.map(s => {
              const sc = statusConfig[s.status]
              const pc = proctoringConfig[s.proctoring]
              return (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#4F46E5' }}>
                        {s.name[0]}
                      </div>
                      <span className="font-medium text-[#111827]">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[#4B5563]">{s.department}</td>
                  <td className="px-5 py-3.5 font-semibold text-[#111827]">{s.cgpa}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${s.readiness}%`, background: '#4F46E5' }} />
                      </div>
                      <span className="text-xs font-medium text-[#111827]">{s.readiness}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50">
                      <Eye size={13} /> View
                    </button>
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
