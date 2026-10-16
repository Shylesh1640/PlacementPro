import { useState } from 'react'
import { Bell, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

interface TopBarProps {
  notificationCount?: number
}

export function TopBar({ notificationCount = 0 }: TopBarProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const roleLabel = user?.role === 'student' ? 'Student' : user?.role === 'admin' ? 'Admin' : 'Partner'

  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-end px-6 gap-4 flex-shrink-0">
      <button className="relative text-muted hover:text-body transition-colors">
        <Bell size={20} />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:bg-gray-50 transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-primary-tint flex items-center justify-center text-primary text-xs font-bold">
          {user?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="text-sm text-body font-medium">{roleLabel}</span>
        <ChevronDown size={14} className={cn('text-muted transition-transform', open && 'rotate-180')} />
      </button>
    </header>
  )
}
