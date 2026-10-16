import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Download, Eye, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAllStudentsAdmin } from '../../lib/queries'
import { Modal } from '../../components/ui/Modal'
import { DEMO_STUDENTS as DS } from '../../lib/demo-data'

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

// Shaped to match the DB structure the component renders
const DEMO_STUDENTS = DS.map(s => ({
  id: s.id,
  profiles: { full_name: s.name, email: s.email },
  department: s.dept,
  cgpa: s.cgpa,
  tenth_percent: s.tenth,
  twelfth_percent: s.twelfth,
  backlogs: s.backlogs,
  readiness_scores: [{ total_score: s.readiness, status: s.placement_status === 'placed' || s.readiness >= 80 ? 'placement_ready' : s.readiness >= 60 ? 'needs_improvement' : 'at_risk' }],
  proctoring_status: s.proctoring,
  placement_status: s.placement_status,
}))

export function AdminStudents() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['allStudents'],
    queryFn: getAllStudentsAdmin,
    refetchInterval: 60000,
  })

  const displayStudents = students.length > 0 ? students : DEMO_STUDENTS

  const filtered = displayStudents.filter((s: any) => {
    const name = s.profiles?.full_name ?? ''
    const dept = s.department ?? ''
    const matchSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      dept.toLowerCase().includes(search.toLowerCase())
    const statusMatch =
      statusFilter === 'all' ||
      s.readiness_scores?.[0]?.status === statusFilter ||
      s.proctoring_status === statusFilter
    return matchSearch && statusMatch
  })

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Department', 'CGPA', 'Readiness Score', 'Readiness Status', 'Proctoring'],
      ...displayStudents.map((s: any) => [
        s.profiles?.full_name ?? '',
        s.profiles?.email ?? '',
        s.department ?? '',
        s.cgpa ?? '',
        s.readiness_scores?.[0]?.total_score ?? '',
        s.readiness_scores?.[0]?.status ?? '',
        s.proctoring_status ?? '',
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Students</h1>
          <p className="text-sm text-[#4B5563] mt-0.5">{filtered.length} students total</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-[#E6E8F5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="all">All Statuses</option>
            <option value="placement_ready">Placement Ready</option>
            <option value="needs_improvement">Needs Improvement</option>
            <option value="at_risk">At Risk</option>
            <option value="flagged">Flagged</option>
          </select>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 text-sm font-medium text-[#4B5563] px-3 py-2 rounded-lg border border-[#E6E8F5] hover:bg-gray-50 transition-colors"
          >
            <Download size={15} /> Export CSV
          </button>
          <Link
            to="/admin/create-student"
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white"
            style={{ background: '#4F46E5' }}
          >
            <UserPlus size={16} /> Create Student
          </Link>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or department…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-[#E6E8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6E8F5] bg-gray-50/50">
                {['Student', 'Department', 'CGPA', 'Readiness', 'Status', 'Proctoring', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#9CA3AF]">No students found.</td>
                </tr>
              ) : filtered.map((s: any) => {
                const rscore = s.readiness_scores?.[0]
                const sc = statusConfig[rscore?.status ?? ''] ?? { label: 'Unknown', bg: '#F3F4F6', color: '#9CA3AF' }
                const pc = proctoringConfig[s.proctoring_status ?? 'normal'] ?? proctoringConfig.normal
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: '#4F46E5' }}
                        >
                          {(s.profiles?.full_name ?? 'S')[0]}
                        </div>
                        <div>
                          <div className="font-medium text-[#111827]">{s.profiles?.full_name ?? 'Student'}</div>
                          <div className="text-xs text-[#9CA3AF]">{s.profiles?.email ?? ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#4B5563]">{s.department || '—'}</td>
                    <td className="px-5 py-3.5 font-semibold text-[#111827]">{s.cgpa || '—'}</td>
                    <td className="px-5 py-3.5">
                      {rscore ? (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, rscore.total_score)}%`, background: '#4F46E5' }}
                            />
                          </div>
                          <span className="text-xs font-medium text-[#111827]">{Math.round(rscore.total_score)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#9CA3AF]">Not assessed</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setSelected(s)}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 transition-colors"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Student Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ background: '#4F46E5' }}
              >
                {(selected.profiles?.full_name ?? 'S')[0]}
              </div>
              <div>
                <h3 className="font-semibold text-[#111827]">{selected.profiles?.full_name}</h3>
                <p className="text-sm text-[#9CA3AF]">{selected.profiles?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Department', value: selected.department || '—' },
                { label: 'CGPA', value: selected.cgpa || '—' },
                { label: 'Backlogs', value: selected.backlogs ?? 0 },
                { label: 'Placement Status', value: selected.placement_status?.replace(/_/g, ' ') || '—' },
                { label: '10th %', value: selected.tenth_percent || '—' },
                { label: '12th %', value: selected.twelfth_percent || '—' },
              ].map(f => (
                <div key={f.label} className="p-3 rounded-xl bg-gray-50 border border-[#E6E8F5]">
                  <p className="text-xs text-[#9CA3AF] font-medium">{f.label}</p>
                  <p className="text-sm font-semibold text-[#111827] mt-0.5 capitalize">{String(f.value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
