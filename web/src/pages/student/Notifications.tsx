import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/queries'

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info size={15} style={{ color: '#3B82F6' }} />,
  success: <CheckCircle size={15} style={{ color: '#16A34A' }} />,
  warning: <AlertTriangle size={15} style={{ color: '#F59E0B' }} />,
  error: <XCircle size={15} style={{ color: '#EF4444' }} />,
}

const typeBg: Record<string, string> = {
  info: '#EFF6FF',
  success: '#DCFCE7',
  warning: '#FFF7ED',
  error: '#FEE2E2',
}

const DEMO_NOTIFS = [
  { id: 'd1', title: 'New Job Match Found!', message: 'You have a 95% match with Google – Software Development Engineer', type: 'success', is_read: false, created_at: new Date(Date.now() - 2 * 60000).toISOString() },
  { id: 'd2', title: 'Assessment Results Ready', message: 'Your Aptitude Test results are available. Score: 94%', type: 'info', is_read: false, created_at: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: 'd3', title: 'Interview Scheduled', message: 'Interview with Google on Nov 15, 2026 at 10:00 AM', type: 'info', is_read: true, created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 'd4', title: 'Profile Incomplete', message: 'Please upload your resume to improve your placement chances', type: 'warning', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
]

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return `${Math.round(diff)}s ago`
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  return `${Math.round(diff / 86400)}d ago`
}

export function StudentNotifications() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  })

  const displayNotifs: any[] = (notifs as any[]).length > 0 ? (notifs as any[]) : DEMO_NOTIFS
  const unread = displayNotifs.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#111827]">Notifications</h1>
          {unread > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: '#EF4444' }}>
              {unread} new
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-1.5 text-sm font-medium hover:underline disabled:opacity-50"
            style={{ color: '#4F46E5' }}
          >
            <CheckCheck size={15} /> Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
        </div>
      ) : displayNotifs.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-12 text-center">
          <Bell size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-[#9CA3AF]">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayNotifs.map(n => (
            <div
              key={n.id}
              onClick={() => !n.is_read && !n.id.startsWith('d') && markReadMutation.mutate(n.id)}
              className={`bg-white rounded-[12px] shadow-sm p-4 flex gap-3 cursor-pointer transition-colors border ${!n.is_read ? 'border-[#C7D2FE] hover:border-[#A5B4FC]' : 'border-[#E6E8F5]'}`}
              style={{ background: !n.is_read ? (typeBg[n.type] ?? '#EFF6FF') : 'white' }}
            >
              <div className="flex-shrink-0 mt-0.5">{typeIcons[n.type] ?? typeIcons.info}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${!n.is_read ? 'text-[#111827]' : 'text-[#4B5563]'}`}>{n.title}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">{n.message}</p>
              </div>
              <span className="text-xs text-[#9CA3AF] flex-shrink-0 mt-0.5 whitespace-nowrap">{timeAgo(n.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
