import { CheckCheck } from 'lucide-react'

const NOTIFICATIONS = [
  { id: '1', title: 'New Job Match Found!', message: 'You have a 95% match with Google – Software Development Engineer', type: 'success', time: '2m ago', read: false },
  { id: '2', title: 'Assessment Results Ready', message: 'Your Aptitude Test results are now available. Score: 94%', type: 'info', time: '1h ago', read: false },
  { id: '3', title: 'Interview Scheduled', message: 'Interview with Google on Nov 15, 2026 at 10:00 AM', type: 'info', time: '3h ago', read: true },
  { id: '4', title: 'Profile Incomplete', message: 'Please upload your resume to improve your placement chances', type: 'warning', time: '1d ago', read: true },
]

const typeColors: Record<string, { dot: string }> = {
  success: { dot: '#16A34A' },
  info: { dot: '#3B82F6' },
  warning: { dot: '#F59E0B' },
  error: { dot: '#EF4444' },
}

export function StudentNotifications() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827]">Notifications</h1>
        <button className="flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: '#4F46E5' }}>
          <CheckCheck size={15} /> Mark all as read
        </button>
      </div>
      <div className="space-y-3">
        {NOTIFICATIONS.map(n => {
          const tc = typeColors[n.type]
          return (
            <div
              key={n.id}
              className={`bg-white rounded-[12px] border shadow-sm p-4 flex gap-3 ${!n.read ? 'border-[#C7D2FE]' : 'border-[#E6E8F5]'}`}
            >
              <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: !n.read ? tc.dot : '#D1D5DB' }} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${!n.read ? 'text-[#111827]' : 'text-[#4B5563]'}`}>{n.title}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">{n.message}</p>
              </div>
              <span className="text-xs text-[#9CA3AF] flex-shrink-0 mt-0.5">{n.time}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
