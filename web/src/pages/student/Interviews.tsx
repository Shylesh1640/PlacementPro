import { Calendar, Clock, Monitor } from 'lucide-react'

const INTERVIEWS = [
  {
    id: '1',
    company: 'Google',
    role: 'Software Development Engineer',
    date: '2026-11-15',
    time: '10:00 AM',
    mode: 'online',
    round: 1,
    status: 'scheduled',
    meetingLink: 'https://meet.google.com/example',
  },
]

export function StudentInterviews() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">My Interviews</h1>
      {INTERVIEWS.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-12 text-center">
          <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-[#9CA3AF]">No interviews scheduled yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {INTERVIEWS.map(intv => (
            <div key={intv.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg" style={{ background: '#E8F0FE', color: '#4285F4' }}>
                  {intv.company[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-[#111827]">{intv.company}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                      Round {intv.round}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EEF0FF', color: '#4F46E5' }}>
                      {intv.status.charAt(0).toUpperCase() + intv.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-[#4B5563] mt-0.5">{intv.role}</p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                      <Calendar size={12} /> {intv.date}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                      <Clock size={12} /> {intv.time}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                      <Monitor size={12} /> {intv.mode === 'online' ? 'Online' : 'On-Campus'}
                    </span>
                  </div>
                  {intv.meetingLink && (
                    <a
                      href={intv.meetingLink}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline"
                      style={{ color: '#4F46E5' }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join Meeting
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
