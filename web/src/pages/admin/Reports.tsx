import { useState } from 'react'
import { Download, FileText, BarChart2, Users, Shield, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ReportDef {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  fetchData: () => Promise<any[]>
  csvHeaders: string[]
  rowMapper: (row: any) => string[]
}

const REPORTS: ReportDef[] = [
  {
    id: 'readiness',
    title: 'Student Readiness Report',
    description: 'Readiness scores, skill gaps and placement status for all students',
    icon: Users,
    color: '#4F46E5',
    fetchData: async () => {
      const { data } = await supabase
        .from('students')
        .select('student_id, department, cgpa, backlogs, readiness_score, readiness_status, placement_status, profiles(full_name, email)')
        .order('readiness_score', { ascending: false })
      return data ?? []
    },
    csvHeaders: ['Name', 'Email', 'Student ID', 'Department', 'CGPA', 'Backlogs', 'Readiness Score', 'Status', 'Placement Status'],
    rowMapper: (r: any) => [
      r.profiles?.full_name ?? '',
      r.profiles?.email ?? '',
      r.student_id ?? '',
      r.department ?? '',
      r.cgpa ?? '',
      r.backlogs ?? '',
      r.readiness_score ?? '',
      r.readiness_status ?? '',
      r.placement_status ?? '',
    ],
  },
  {
    id: 'jobmatches',
    title: 'Job Match Report',
    description: 'AI-generated job matching results and eligibility status for all students',
    icon: BarChart2,
    color: '#7C3AED',
    fetchData: async () => {
      const { data } = await supabase
        .from('job_matches')
        .select('match_percentage, eligibility_status, matched_skills, missing_skills, students(profiles(full_name)), jobs(title, companies(name))')
        .order('match_percentage', { ascending: false })
      return data ?? []
    },
    csvHeaders: ['Student', 'Company', 'Job Title', 'Match %', 'Eligibility', 'Matched Skills', 'Missing Skills'],
    rowMapper: (r: any) => [
      r.students?.profiles?.full_name ?? '',
      r.jobs?.companies?.name ?? '',
      r.jobs?.title ?? '',
      r.match_percentage ?? '',
      r.eligibility_status ?? '',
      (r.matched_skills ?? []).join('; '),
      (r.missing_skills ?? []).join('; '),
    ],
  },
  {
    id: 'proctoring',
    title: 'Proctoring Summary',
    description: 'Assessment integrity report with flagged events and review outcomes',
    icon: Shield,
    color: '#F59E0B',
    fetchData: async () => {
      const { data } = await supabase
        .from('proctoring_events')
        .select('event_type, severity, timestamp, reviewed, review_note, assessment_attempts(students(profiles(full_name)), assessments(title))')
        .order('timestamp', { ascending: false })
      return data ?? []
    },
    csvHeaders: ['Student', 'Assessment', 'Event Type', 'Severity', 'Timestamp', 'Reviewed', 'Review Note'],
    rowMapper: (r: any) => [
      r.assessment_attempts?.students?.profiles?.full_name ?? '',
      r.assessment_attempts?.assessments?.title ?? '',
      r.event_type ?? '',
      r.severity ?? '',
      r.timestamp ? new Date(r.timestamp).toLocaleString() : '',
      r.reviewed ? 'Yes' : 'No',
      r.review_note ?? '',
    ],
  },
  {
    id: 'placement',
    title: 'Placement Report',
    description: 'End-to-end placement tracking: interviews, outcomes and offers',
    icon: FileText,
    color: '#16A34A',
    fetchData: async () => {
      const { data } = await supabase
        .from('placements')
        .select('status, offer_date, joining_date, package_lpa, students(profiles(full_name), department), jobs(title), companies(name)')
        .order('offer_date', { ascending: false })
      return data ?? []
    },
    csvHeaders: ['Student', 'Department', 'Company', 'Role', 'Status', 'Offer Date', 'Joining Date', 'Package (LPA)'],
    rowMapper: (r: any) => [
      r.students?.profiles?.full_name ?? '',
      r.students?.department ?? '',
      r.companies?.name ?? '',
      r.jobs?.title ?? '',
      r.status ?? '',
      r.offer_date ?? '',
      r.joining_date ?? '',
      r.package_lpa ?? '',
    ],
  },
]

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const lines = [headers, ...rows].map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  )
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function AdminReports() {
  const [downloading, setDownloading] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const handleDownload = async (report: ReportDef) => {
    setDownloading(report.id)
    try {
      const rows = await report.fetchData()
      const csvRows = rows.map(report.rowMapper)
      downloadCSV(`${report.id}-report-${new Date().toISOString().slice(0, 10)}.csv`, report.csvHeaders, csvRows)
      setDone(report.id)
      setTimeout(() => setDone(null), 3000)
    } catch (err) {
      console.error('Report download failed:', err)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Reports</h1>
        <p className="text-sm text-[#4B5563] mt-0.5">Download CSV reports for each area of the placement process</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORTS.map(r => (
          <div key={r.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 flex items-start gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${r.color}1A` }}
            >
              <r.icon size={22} style={{ color: r.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[#111827] mb-1">{r.title}</h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed mb-4">{r.description}</p>
              <button
                onClick={() => handleDownload(r)}
                disabled={downloading === r.id}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 disabled:opacity-60 transition-colors"
              >
                {downloading === r.id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : done === r.id ? (
                  <CheckCircle size={13} style={{ color: '#16A34A' }} />
                ) : (
                  <Download size={13} />
                )}
                {downloading === r.id ? 'Generating…' : done === r.id ? 'Downloaded!' : 'Download CSV'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
