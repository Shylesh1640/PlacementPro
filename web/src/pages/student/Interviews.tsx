import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, MapPin, Video, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getStudentByProfileId, getStudentInterviews } from '../../lib/queries'
import { DEMO_INTERVIEWS as DEMO_INTERVIEWS_DATA } from '../../lib/demo-data'

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  scheduled: { bg: '#EEF0FF', color: '#4F46E5', label: 'Scheduled' },
  completed: { bg: '#DCFCE7', color: '#16A34A', label: 'Completed' },
  rescheduled: { bg: '#FFF7ED', color: '#F59E0B', label: 'Rescheduled' },
  withdrawn: { bg: '#FEE2E2', color: '#EF4444', label: 'Withdrawn' },
}

const outcomeIcons: Record<string, React.ReactNode> = {
  selected: <CheckCircle size={13} />,
  rejected: <XCircle size={13} />,
  pending: <AlertCircle size={13} />,
}

const outcomeColors: Record<string, string> = {
  selected: '#16A34A',
  rejected: '#EF4444',
  pending: '#F59E0B',
}

const DEMO_INTERVIEWS = DEMO_INTERVIEWS_DATA

interface InterviewSectionProps {
  title: string
  items: any[]
}

function InterviewSection({ title, items }: InterviewSectionProps) {
  if (items.length === 0) return null
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wide">{title}</h3>
      {items.map((intv: any) => {
        const sc = statusConfig[intv.status] ?? statusConfig.scheduled
        const companyName = intv.companies?.name ?? 'Company'
        const scheduledDate = new Date(intv.scheduled_at)
        return (
          <div key={intv.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                style={{ background: '#E8F0FE', color: '#4285F4' }}
              >
                {companyName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-[#111827]">{companyName}</h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: '#EEF0FF', color: '#4F46E5' }}
                  >
                    Round {intv.round}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: sc.bg, color: sc.color }}
                  >
                    {sc.label}
                  </span>
                  {intv.outcome && outcomeColors[intv.outcome] && (
                    <span
                      className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: '#F3F4F6', color: outcomeColors[intv.outcome] }}
                    >
                      {outcomeIcons[intv.outcome]}
                      {intv.outcome.charAt(0).toUpperCase() + intv.outcome.slice(1)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#4B5563] mt-0.5">{intv.jobs?.title}</p>
                <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-[#9CA3AF]">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {scheduledDate.toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1">
                    {intv.mode === 'online' ? <Video size={12} /> : <MapPin size={12} />}
                    {intv.mode === 'online' ? 'Online' : intv.mode === 'on_campus' ? 'On-Campus' : 'Hybrid'}
                  </span>
                </div>
                {intv.meeting_link && intv.status === 'scheduled' && (
                  <a
                    href={intv.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                    style={{ background: '#4F46E5' }}
                  >
                    <Video size={12} /> Join Meeting
                  </a>
                )}
                {intv.location && (
                  <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1">
                    <MapPin size={11} /> {intv.location}
                  </p>
                )}
                {intv.feedback && (
                  <p className="text-xs text-[#4B5563] mt-2 p-2 rounded-lg bg-gray-50 border border-[#E6E8F5]">
                    Feedback: {intv.feedback}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function StudentInterviews() {
  const { user } = useAuth()

  const { data: student } = useQuery({
    queryKey: ['student', user?.id],
    queryFn: () => getStudentByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ['interviews', student?.id],
    queryFn: () => getStudentInterviews(student!.id),
    enabled: !!student?.id,
  })

  const displayInterviews = interviews.length > 0 ? interviews : DEMO_INTERVIEWS
  const upcoming = displayInterviews.filter((i: any) => i.status === 'scheduled' || i.status === 'rescheduled')
  const past = displayInterviews.filter((i: any) => i.status === 'completed' || i.status === 'withdrawn')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827]">My Interviews</h1>
        {upcoming.length > 0 && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: '#EEF0FF', color: '#4F46E5' }}
          >
            {upcoming.length} upcoming
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <InterviewSection title="Upcoming" items={upcoming} />
          <InterviewSection title="Past" items={past} />
          {displayInterviews.length === 0 && (
            <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-12 text-center">
              <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-[#9CA3AF]">No interviews scheduled yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
