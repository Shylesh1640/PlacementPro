import { useState } from 'react'
import { Bell, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { getNotifications } from '../../lib/queries'
import { cn } from '../../lib/utils'

export function TopBar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const { data: notifs = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
    retry: false,
  })

  const unreadCount = (notifs as any[]).filter((n: any) => !n.is_read).length

  const roleLabel =
    user?.role === 'student' ? 'Student' :
    user?.role === 'admin'   ? 'Admin'   : 'Partner'

  return (
    <header className="h-14 bg-white border-b border-[#E6E8F5] flex items-center justify-end px-6 gap-4 flex-shrink-0">
      <button className="relative text-[#9CA3AF] hover:text-[#4B5563] transition-colors">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E6E8F5] hover:bg-gray-50 transition-colors"
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: '#4F46E5' }}
        >
          {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <span className="text-sm text-[#4B5563] font-medium">{roleLabel}</span>
        <ChevronDown size={14} className={cn('text-[#9CA3AF] transition-transform', open && 'rotate-180')} />
      </button>
    </header>
  )
}
