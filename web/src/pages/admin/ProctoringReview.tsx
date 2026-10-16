import { useState } from 'react'
import { AlertTriangle, CheckCircle, Eye } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'

const ALERTS = [
  { id: '1', student: 'Priya Mehta', assessment: 'Aptitude Test', eventType: 'multiple_persons', severity: 'high', time: '2026-10-14 12:05 PM', status: 'pending' },
  { id: '2', student: 'Rahul Sharma', assessment: 'Programming Assessment', eventType: 'tab_switch', severity: 'medium', time: '2026-10-14 11:10 AM', status: 'cleared' },
  { id: '3', student: 'Sneha Patel', assessment: 'Aptitude Test', eventType: 'no_face', severity: 'medium', time: '2026-10-14 10:30 AM', status: 'flagged' },
]

const eventLabels: Record<string, string> = {
  multiple_persons: 'Multiple Persons Detected',
  tab_switch: 'Tab Switch Detected',
  no_face: 'No Face Detected',
  window_blur: 'Window Lost Focus',
}

const severityConfig: Record<string, { bg: string; color: string }> = {
  high: { bg: '#FEE2E2', color: '#EF4444' },
  medium: { bg: '#FFF7ED', color: '#F59E0B' },
  low: { bg: '#DCFCE7', color: '#16A34A' },
}

export function ProctoringReview() {
  const [selected, setSelected] = useState<typeof ALERTS[0] | null>(null)
  const [note, setNote] = useState('')
  const [decision, setDecision] = useState<'clear' | 'flag' | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Proctoring Alert Review</h1>
        <p className="text-sm text-[#4B5563] mt-0.5">Review flagged events — these are indicators, not proof of malpractice</p>
      </div>
      <div className="space-y-3">
        {ALERTS.map(alert => {
          const sc = severityConfig[alert.severity]
          return (
            <div key={alert.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: sc.bg }}>
                <AlertTriangle size={18} style={{ color: sc.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-[#111827]">{alert.student}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sc.bg, color: sc.color }}>{alert.severity.toUpperCase()}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                    style={{
                      background: alert.status === 'cleared' ? '#DCFCE7' : alert.status === 'flagged' ? '#FEE2E2' : '#FFF7ED',
                      color: alert.status === 'cleared' ? '#16A34A' : alert.status === 'flagged' ? '#EF4444' : '#F59E0B',
                    }}
                  >
                    {alert.status}
                  </span>
                </div>
                <p className="text-xs text-[#4B5563] mt-0.5">{eventLabels[alert.eventType]} · {alert.assessment}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{alert.time}</p>
              </div>
              <button
                onClick={() => setSelected(alert)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 flex-shrink-0"
              >
                <Eye size={13} /> Review
              </button>
            </div>
          )
        })}
      </div>

      <Modal open={!!selected} onClose={() => { setSelected(null); setNote(''); setDecision(null) }} title="Review Proctoring Alert">
        {selected && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
              <p className="text-sm font-semibold text-[#111827]">{eventLabels[selected.eventType]}</p>
              <p className="text-xs text-[#4B5563] mt-1">Student: {selected.student} · {selected.assessment}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{selected.time}</p>
            </div>
            <Textarea label="Reviewer Note" value={note} onChange={e => setNote(e.target.value)} placeholder="Add your review notes…" rows={3} />
            <div className="flex gap-3">
              <button
                onClick={() => setDecision('clear')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${decision === 'clear' ? 'border-[#16A34A] bg-[#DCFCE7] text-[#16A34A]' : 'border-[#E6E8F5] text-[#4B5563] hover:border-green-300'}`}
              >
                <CheckCircle size={15} /> Clear
              </button>
              <button
                onClick={() => setDecision('flag')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${decision === 'flag' ? 'border-[#EF4444] bg-[#FEE2E2] text-[#EF4444]' : 'border-[#E6E8F5] text-[#4B5563] hover:border-red-300'}`}
              >
                <AlertTriangle size={15} /> Flag
              </button>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
              <Button disabled={!decision}>Save Decision</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
