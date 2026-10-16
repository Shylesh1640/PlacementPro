import { Calendar, Clock, Monitor } from 'lucide-react'

const INTERVIEWS = [
  { id: '1', student: 'Rahul Sharma', role: 'Software Development Engineer', date: '2026-11-15', time: '10:00 AM', mode: 'online', status: 'scheduled', round: 1 },
  { id: '2', student: 'Arjun Nair', role: 'Software Development Engineer', date: '2026-11-18', time: '02:00 PM', mode: 'on_campus', status: 'scheduled', round: 1 },
]

export function PartnerInterviews() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Interviews</h1>
      <div className="space-y-3">
        {INTERVIEWS.map(intv => (
          <div key={intv.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: '#4F46E5' }}>
              {intv.student[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-[#111827]">{intv.student}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EEF0FF', color: '#4F46E5' }}>Round {intv.round}</span>
              </div>
              <p className="text-xs text-[#4B5563] mt-0.5">{intv.role}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-[#9CA3AF]">
                <span className="flex items-center gap-1"><Calendar size={11} /> {intv.date}</span>
                <span className="flex items-center gap-1"><Clock size={11} /> {intv.time}</span>
                <span className="flex items-center gap-1"><Monitor size={11} /> {intv.mode.replace('_', '-')}</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              Scheduled
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
