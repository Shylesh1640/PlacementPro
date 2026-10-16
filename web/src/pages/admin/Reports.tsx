import { Download, FileText, BarChart2, Users, Shield } from 'lucide-react'

const REPORTS = [
  { id: '1', title: 'Student Readiness Report', description: 'Comprehensive readiness scores and skill gap analysis for all students', icon: Users, color: '#4F46E5' },
  { id: '2', title: 'Job Match Report', description: 'AI-generated job matching results and eligibility status', icon: BarChart2, color: '#7C3AED' },
  { id: '3', title: 'Proctoring Summary', description: 'Assessment integrity report with flagged events and review outcomes', icon: Shield, color: '#F59E0B' },
  { id: '4', title: 'Placement Report', description: 'End-to-end placement tracking from assessment to offer', icon: FileText, color: '#16A34A' },
]

export function AdminReports() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Reports</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORTS.map(r => (
          <div key={r.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}1A` }}>
              <r.icon size={22} style={{ color: r.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[#111827] mb-1">{r.title}</h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed mb-3">{r.description}</p>
              <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50">
                <Download size={13} /> Download PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
