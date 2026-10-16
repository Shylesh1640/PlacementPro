import { useState } from 'react'
import { Calendar, Clock, Monitor, MapPin, CheckCircle } from 'lucide-react'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'

const SCHEDULED = [
  { id: '1', student: 'Rahul Sharma', company: 'Google', role: 'SDE', date: '2026-11-15', time: '10:00', mode: 'online', status: 'scheduled', round: 1 },
  { id: '2', student: 'Priya Mehta', company: 'Microsoft', role: 'Software Engineer', date: '2026-11-18', time: '14:00', mode: 'on_campus', status: 'scheduled', round: 1 },
  { id: '3', student: 'Arjun Nair', company: 'TCS', role: 'Systems Engineer', date: '2026-11-20', time: '11:00', mode: 'online', status: 'completed', round: 2 },
]

export function AdminInterviews() {
  const [student, setStudent] = useState('')
  const [company, setCompany] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [mode, setMode] = useState<'online' | 'on_campus' | 'hybrid'>('online')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Interview Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-5">Schedule Interview</h3>
          <form onSubmit={handleSchedule} className="space-y-4">
            <Select
              label="Student"
              value={student}
              onChange={e => setStudent(e.target.value)}
              options={[
                { value: '', label: 'Select Student…' },
                { value: 'rahul', label: 'Rahul Sharma' },
                { value: 'priya', label: 'Priya Mehta' },
                { value: 'arjun', label: 'Arjun Nair' },
              ]}
              required
            />
            <Select
              label="Company"
              value={company}
              onChange={e => setCompany(e.target.value)}
              options={[
                { value: '', label: 'Select Company…' },
                { value: 'google', label: 'Google' },
                { value: 'microsoft', label: 'Microsoft' },
                { value: 'tcs', label: 'TCS' },
              ]}
              required
            />
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
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E6E8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    required
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
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E6E8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    required
                  />
                </div>
              </div>
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
                <input
                  type="url"
                  placeholder="https://meet.google.com/…"
                  className="w-full px-3 py-2 text-sm border border-[#E6E8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>
            )}
            {(mode === 'on_campus' || mode === 'hybrid') && (
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Location</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Room 101, Block A"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E6E8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>
            )}
            {saved && (
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#DCFCE7' }}>
                <CheckCircle size={16} style={{ color: '#16A34A' }} />
                <span className="text-sm font-medium" style={{ color: '#16A34A' }}>Interview scheduled successfully!</span>
              </div>
            )}
            <Button type="submit" className="w-full" loading={saving} size="lg">Schedule Interview</Button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 flex flex-col items-center justify-center">
          <div className="w-36 h-36 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#EEF0FF' }}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: '#4F46E5' }}>
                <Calendar size={32} className="text-white" />
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto" style={{ background: '#E0E3FF' }}>
                <Monitor size={24} style={{ color: '#4F46E5' }} />
              </div>
            </div>
          </div>
          <h4 className="text-sm font-semibold text-[#111827] text-center mb-2">Seamless Coordination</h4>
          <p className="text-xs text-[#9CA3AF] text-center leading-relaxed">
            Schedule interviews across online, on-campus, and hybrid modes with automatic student notifications.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#E6E8F5]">
          <h3 className="text-base font-semibold text-[#111827]">Scheduled Interviews</h3>
          <span className="text-xs text-[#9CA3AF]">{SCHEDULED.length} interviews</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E6E8F5] bg-gray-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Student</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Company / Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Date & Time</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Mode</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {SCHEDULED.map(intv => (
              <tr key={intv.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-[#111827]">{intv.student}</td>
                <td className="px-5 py-3.5">
                  <div className="font-medium text-[#111827]">{intv.company}</div>
                  <div className="text-xs text-[#9CA3AF]">{intv.role} · Round {intv.round}</div>
                </td>
                <td className="px-5 py-3.5 text-[#4B5563]">
                  <div>{intv.date}</div>
                  <div className="text-xs text-[#9CA3AF]">{intv.time}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize" style={{ background: '#EEF0FF', color: '#4F46E5' }}>
                    {intv.mode.replace('_', '-')}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                    style={{
                      background: intv.status === 'completed' ? '#DCFCE7' : '#FFF7ED',
                      color: intv.status === 'completed' ? '#16A34A' : '#F59E0B',
                    }}
                  >
                    {intv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
