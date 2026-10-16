import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle, XCircle, Shield } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'
import { getProctoringEvents, reviewProctoringEvent } from '../../lib/queries'

const eventLabels: Record<string, string> = {
  multiple_persons: 'Multiple Persons Detected',
  tab_switch: 'Tab Switch Detected',
  no_face: 'No Face Detected',
  window_blur: 'Window Lost Focus',
  prolonged_absence: 'Prolonged Absence',
  face_visibility: 'Face Visibility Change',
}
const severityConfig: Record<string, { bg: string; color: string; border: string }> = {
  high: { bg: '#FEF2F2', color: '#EF4444', border: '#FECACA' },
  medium: { bg: '#FFFBEB', color: '#F59E0B', border: '#FED7AA' },
  low: { bg: '#F0FFF4', color: '#16A34A', border: '#A7F3D0' },
}

const DEMO_EVENTS = [
  { id: 'd1', event_type: 'multiple_persons', severity: 'high', timestamp: new Date(Date.now() - 600000).toISOString(), reviewed: false, assessment_attempts: { students: { profiles: { full_name: 'Priya Mehta' } }, assessments: { title: 'Aptitude Test' } } },
  { id: 'd2', event_type: 'tab_switch', severity: 'medium', timestamp: new Date(Date.now() - 3600000).toISOString(), reviewed: false, assessment_attempts: { students: { profiles: { full_name: 'Rohan Gupta' } }, assessments: { title: 'Programming Assessment' } } },
  { id: 'd3', event_type: 'no_face', severity: 'medium', timestamp: new Date(Date.now() - 7200000).toISOString(), reviewed: true, review_note: 'Student briefly left seat. Cleared.', assessment_attempts: { students: { profiles: { full_name: 'Sneha Patel' } }, assessments: { title: 'Aptitude Test' } } },
]

export function ProctoringReview() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<any | null>(null)
  const [note, setNote] = useState('')
  const [decision, setDecision] = useState<'clear' | 'flag' | null>(null)
  const [showReviewed, setShowReviewed] = useState(false)

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['proctoringEvents', showReviewed],
    queryFn: () => getProctoringEvents({ reviewed: showReviewed ? undefined : false }),
    refetchInterval: 15000,
  })

  const reviewMutation = useMutation({
    mutationFn: () => reviewProctoringEvent(selected!.id, decision!, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proctoringEvents'] })
      setSelected(null); setNote(''); setDecision(null)
    },
  })

  const displayEvents = events.length > 0 ? events : DEMO_EVENTS.filter(e => showReviewed || !e.reviewed)
  const pendingCount = displayEvents.filter((e: any) => !e.reviewed).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Proctoring Alert Review</h1>
          <p className="text-sm text-[#4B5563] mt-0.5">These are indicators for review, not proof of malpractice</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: '#EF4444' }}>
              {pendingCount} pending
            </span>
          )}
          <label className="flex items-center gap-2 text-sm text-[#4B5563] cursor-pointer">
            <input type="checkbox" checked={showReviewed} onChange={e => setShowReviewed(e.target.checked)} className="accent-[#4F46E5]" />
            Show reviewed
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-12 text-center">
          <Shield size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-[#9CA3AF]">No pending proctoring alerts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayEvents.map((evt: any) => {
            const sc = severityConfig[evt.severity] ?? severityConfig.low
            const studentName = evt.assessment_attempts?.students?.profiles?.full_name ?? 'Student'
            const assessmentTitle = evt.assessment_attempts?.assessments?.title ?? 'Assessment'
            return (
              <div key={evt.id} className="bg-white rounded-[12px] border shadow-sm p-5 flex items-center gap-4" style={{ borderColor: evt.reviewed ? '#E6E8F5' : sc.border }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: sc.bg }}>
                  <AlertTriangle size={18} style={{ color: sc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-[#111827]">{studentName}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium uppercase" style={{ background: sc.bg, color: sc.color }}>{evt.severity}</span>
                    {evt.reviewed && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#DCFCE7', color: '#16A34A' }}>Reviewed</span>
                    )}
                  </div>
                  <p className="text-xs text-[#4B5563] mt-0.5">{eventLabels[evt.event_type] ?? evt.event_type} · {assessmentTitle}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{new Date(evt.timestamp).toLocaleString()}</p>
                  {evt.review_note && (
                    <p className="text-xs text-[#4B5563] mt-1 italic">"{evt.review_note}"</p>
                  )}
                </div>
                {!evt.reviewed && !evt.id.startsWith('d') && (
                  <button onClick={() => { setSelected(evt); setNote(''); setDecision(null) }}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 flex-shrink-0">
                    Review
                  </button>
                )}
                {!evt.reviewed && evt.id.startsWith('d') && (
                  <span className="text-xs text-[#9CA3AF] flex-shrink-0">Demo</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!selected} onClose={() => { setSelected(null); setNote(''); setDecision(null) }} title="Review Proctoring Alert">
        {selected && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border" style={{ background: severityConfig[selected.severity]?.bg, borderColor: severityConfig[selected.severity]?.border }}>
              <p className="text-sm font-semibold text-[#111827]">{eventLabels[selected.event_type] ?? selected.event_type}</p>
              <p className="text-xs text-[#4B5563] mt-1">
                Student: {selected.assessment_attempts?.students?.profiles?.full_name} ·{' '}
                {selected.assessment_attempts?.assessments?.title}
              </p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{new Date(selected.timestamp).toLocaleString()}</p>
            </div>
            <Textarea label="Reviewer Note" value={note} onChange={e => setNote(e.target.value)} placeholder="Add your review decision notes…" rows={3} />
            <div className="flex gap-3">
              <button onClick={() => setDecision('clear')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${decision === 'clear' ? 'border-[#16A34A] bg-[#DCFCE7] text-[#16A34A]' : 'border-[#E6E8F5] text-[#4B5563] hover:border-green-300'}`}>
                <CheckCircle size={15} /> Clear — No Issue
              </button>
              <button onClick={() => setDecision('flag')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${decision === 'flag' ? 'border-[#EF4444] bg-[#FEE2E2] text-[#EF4444]' : 'border-[#E6E8F5] text-[#4B5563] hover:border-red-300'}`}>
                <XCircle size={15} /> Flag Student
              </button>
            </div>
            {reviewMutation.error && <p className="text-sm text-red-600">{(reviewMutation.error as Error).message}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
              <Button onClick={() => reviewMutation.mutate()} loading={reviewMutation.isPending} disabled={!decision}>
                Save Decision
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
