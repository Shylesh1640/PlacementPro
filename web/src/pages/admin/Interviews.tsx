import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, MapPin, Monitor, CheckCircle, Video, Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { createInterview, getAllInterviews } from '../../lib/queries'
import { supabase } from '../../lib/supabase'

const statusConfig: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: '#EEF0FF', color: '#4F46E5' },
  completed: { bg: '#DCFCE7', color: '#16A34A' },
  rescheduled: { bg: '#FFF7ED', color: '#F59E0B' },
  withdrawn: { bg: '#FEE2E2', color: '#EF4444' },
}

const DEMO_INTERVIEWS = [
  {
    id: 'd1',
    students: { profiles: { full_name: 'Rahul Sharma' } },
    jobs: { title: 'Software Development Engineer' },
    companies: { name: 'Google' },
    scheduled_at: new Date(Date.now() + 3 * 86400000).toISOString(),
    mode: 'online',
    status: 'scheduled',
    round: 1,
  },
  {
    id: 'd2',
    students: { profiles: { full_name: 'Priya Mehta' } },
    jobs: { title: 'Software Engineer' },
    companies: { name: 'Microsoft' },
    scheduled_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    mode: 'on_campus',
    status: 'scheduled',
    round: 1,
  },
]

export function AdminInterviews() {
  const qc = useQueryClient()
  const [studentId, setStudentId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [jobId, setJobId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [mode, setMode] = useState<'online' | 'on_campus' | 'hybrid'>('online')
  const [meetingLink, setMeetingLink] = useState('')
  const [location, setLocation] = useState('')
  const [round, setRound] = useState('1')
  const [saved, setSaved] = useState(false)

  const { data: students = [] } = useQuery({
    queryKey: ['studentsForSelect'],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('id, profiles(full_name)')
        .limit(100)
      return data ?? []
    },
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['companiesForSelect'],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select('id, name')
        .eq('verified', true)
        .limit(100)
      return data ?? []
    },
  })

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobsForSelect', companyId],
    queryFn: async () => {
      if (!companyId) return []
      const { data } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('company_id', companyId)
        .eq('is_open', true)
      return data ?? []
    },
    enabled: !!companyId,
  })

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ['allInterviews'],
    queryFn: getAllInterviews,
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const scheduledAt = new Date(`${date}T${time}`).toISOString()
      return createInterview({
        studentId,
        jobId,
        companyId,
        scheduledAt,
        mode,
        round: parseInt(round),
        meetingLink: mode === 'online' ? meetingLink : undefined,
        location: mode !== 'online' ? location : undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allInterviews'] })
      setStudentId('')
      setCompanyId('')
      setJobId('')
      setDate('')
      setTime('')
      setMeetingLink('')
      setLocation('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate()
  }

  const displayInterviews = interviews.length > 0 ? interviews : DEMO_INTERVIEWS

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Interview Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Schedule form */}
        <div className="lg:col-span-3 bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-5 flex items-center gap-2">
            <Plus size={16} style={{ color: '#4F46E5' }} /> Schedule Interview
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                Student <span className="text-red-500">*</span>
              </label>
              <select
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                required
                className="w-full border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              >
                <option value="">Select Student…</option>
                {students.length === 0 && <option disabled>No students in DB (run migrations)</option>}
                {students.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.profiles?.full_name ?? s.id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                Company <span className="text-red-500">*</span>
              </label>
              <select
                value={companyId}
                onChange={e => { setCompanyId(e.target.value); setJobId('') }}
                required
                className="w-full border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              >
                <option value="">Select Company…</option>
                {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {companyId && (
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                  Job Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={jobId}
                  onChange={e => setJobId(e.target.value)}
                  required
                  className="w-full border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                >
                  <option value="">Select Job…</option>
                  {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E6E8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                  Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E6E8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Round</label>
              <select
                value={round}
                onChange={e => setRound(e.target.value)}
                className="w-full border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              >
                {[1, 2, 3, 4].map(r => <option key={r} value={r}>Round {r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-2">Mode</label>
              <div className="flex gap-4">
                {(['online', 'on_campus', 'hybrid'] as const).map(m => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${mode === m ? 'border-[#4F46E5]' : 'border-[#D1D5DB]'}`}>
                      {mode === m && <div className="w-2 h-2 rounded-full" style={{ background: '#4F46E5' }} />}
                    </div>
                    <input type="radio" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
                    <span className="text-sm text-[#4B5563] capitalize">{m.replace('_', '-')}</span>
                  </label>
                ))}
              </div>
            </div>

            {mode === 'online' && (
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Meeting Link</label>
                <div className="relative">
                  <Video size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={e => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E6E8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>
            )}

            {mode !== 'online' && (
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Location</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Room 101, Block A"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E6E8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>
            )}

            {createMutation.error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {(createMutation.error as Error).message}
              </p>
            )}

            {saved && (
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#DCFCE7' }}>
                <CheckCircle size={16} style={{ color: '#16A34A' }} />
                <span className="text-sm font-medium" style={{ color: '#16A34A' }}>Interview scheduled successfully!</span>
              </div>
            )}

            <Button type="submit" className="w-full" loading={createMutation.isPending} size="lg">
              Schedule Interview
            </Button>
          </form>
        </div>

        {/* Illustration panel */}
        <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 flex flex-col items-center justify-center gap-4">
          <div className="w-32 h-32 rounded-2xl flex items-center justify-center" style={{ background: '#EEF0FF' }}>
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ background: '#4F46E5' }}
              >
                <Calendar size={28} className="text-white" />
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
                style={{ background: '#E0E3FF' }}
              >
                <Monitor size={20} style={{ color: '#4F46E5' }} />
              </div>
            </div>
          </div>
          <h4 className="text-sm font-semibold text-[#111827] text-center">Seamless Coordination</h4>
          <p className="text-xs text-[#9CA3AF] text-center leading-relaxed">
            Schedule interviews across online, on-campus, and hybrid modes. Students receive automatic notifications.
          </p>
          <div className="p-3 rounded-xl border border-[#E6E8F5] w-full text-center">
            <p className="text-2xl font-bold text-[#111827]">
              {displayInterviews.filter((i: any) => i.status === 'scheduled').length}
            </p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">interviews scheduled</p>
          </div>
        </div>
      </div>

      {/* All interviews table */}
      <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#E6E8F5]">
          <h3 className="text-base font-semibold text-[#111827]">All Interviews</h3>
          <span className="text-xs text-[#9CA3AF]">{displayInterviews.length} total</span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6E8F5] bg-gray-50/50">
                {['Student', 'Company / Role', 'Date & Time', 'Mode', 'Round', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {displayInterviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#9CA3AF]">No interviews yet.</td>
                </tr>
              ) : displayInterviews.map((i: any) => {
                const sc = statusConfig[i.status] ?? statusConfig.scheduled
                const d = new Date(i.scheduled_at)
                return (
                  <tr key={i.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[#111827]">
                      {i.students?.profiles?.full_name ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#111827]">{i.companies?.name ?? '—'}</div>
                      <div className="text-xs text-[#9CA3AF]">{i.jobs?.title ?? '—'}</div>
                    </td>
                    <td className="px-5 py-3.5 text-[#4B5563]">
                      <div>{d.toLocaleDateString()}</div>
                      <div className="text-xs text-[#9CA3AF]">
                        {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                        style={{ background: '#EEF0FF', color: '#4F46E5' }}
                      >
                        {(i.mode ?? 'online').replace('_', '-')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#4B5563]">Round {i.round}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                        style={{ background: sc.bg, color: sc.color }}
                      >
                        {i.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
