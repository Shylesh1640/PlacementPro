import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, Video, MapPin, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getCompanyByProfileId } from '../../lib/queries'
import { supabase } from '../../lib/supabase'

const statusConfig: Record<string, { bg: string; color: string }> = {
  scheduled:   { bg: '#EEF0FF', color: '#4F46E5' },
  completed:   { bg: '#DCFCE7', color: '#16A34A' },
  rescheduled: { bg: '#FFF7ED', color: '#F59E0B' },
  withdrawn:   { bg: '#FEE2E2', color: '#EF4444' },
}

const DEMO = [
  { id: 'd1', scheduled_at: new Date(Date.now() + 3 * 86400000).toISOString(), mode: 'online',    status: 'scheduled', round: 1, meeting_link: null, location: null, students: { profiles: { full_name: 'Rahul Sharma' } }, jobs: { title: 'Software Development Engineer' } },
  { id: 'd2', scheduled_at: new Date(Date.now() + 5 * 86400000).toISOString(), mode: 'on_campus', status: 'scheduled', round: 1, meeting_link: null, location: 'Room 101, Block A', students: { profiles: { full_name: 'Arjun Nair' } }, jobs: { title: 'Software Development Engineer' } },
]

export function PartnerInterviews() {
  const { user } = useAuth()

  const { data: company } = useQuery({
    queryKey: ['company', user?.id],
    queryFn: () => getCompanyByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ['partnerInterviews', (company as any)?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          students(profiles(full_name)),
          jobs(title)
        `)
        .eq('company_id', (company as any).id)
        .order('scheduled_at')
      if (error) return []
      return data ?? []
    },
    enabled: !!(company as any)?.id,
  })

  const display = (interviews as any[]).length > 0 ? (interviews as any[]) : DEMO
  const upcoming = display.filter((i: any) => i.status === 'scheduled')
  const past     = display.filter((i: any) => i.status !== 'scheduled')

  function Section({ title, items }: { title: string; items: any[] }) {
    if (!items.length) return null
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wide">{title}</h3>
        {items.map((intv: any) => {
          const sc = statusConfig[intv.status] ?? statusConfig.scheduled
          const d  = new Date(intv.scheduled_at)
          const studentName = intv.students?.profiles?.full_name ?? '—'
          return (
            <div key={intv.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: '#4F46E5' }}>
                {studentName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-[#111827]">{studentName}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EEF0FF', color: '#4F46E5' }}>
                    Round {intv.round}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: sc.bg, color: sc.color }}>
                    {intv.status}
                  </span>
                </div>
                <p className="text-xs text-[#4B5563] mt-0.5">{intv.jobs?.title}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-[#9CA3AF]">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {d.toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1 capitalize">
                    {intv.mode === 'online' ? <Video size={11} /> : <MapPin size={11} />}
                    {intv.mode?.replace('_', '-')}
                  </span>
                </div>
                {intv.meeting_link && intv.status === 'scheduled' && (
                  <a href={intv.meeting_link} target="_blank" rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium" style={{ color: '#4F46E5' }}>
                    <Video size={11} /> Join Meeting
                  </a>
                )}
                {intv.location && (
                  <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1">
                    <MapPin size={11} /> {intv.location}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (!company && !isLoading) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Interviews</h1>
      <div className="bg-white rounded-[12px] border border-[#FED7AA] shadow-sm p-8 text-center">
        <AlertCircle size={36} className="mx-auto mb-3" style={{ color: '#F59E0B' }} />
        <p className="text-sm text-[#4B5563]">Set up your company profile first to see interviews.</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827]">Interviews</h1>
        {upcoming.length > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#EEF0FF', color: '#4F46E5' }}>
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
          <Section title="Upcoming" items={upcoming} />
          <Section title="Past"     items={past} />
          {!display.length && (
            <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-12 text-center">
              <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-[#9CA3AF]">No interviews yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
