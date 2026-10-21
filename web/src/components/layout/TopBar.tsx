import { useState, useRef, useEffect } from 'react'
import { Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getNotifications } from '../../lib/queries'
import { cn } from '../../lib/utils'

export function TopBar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const { data: notifs = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
    retry: false,
  })
  const unreadCount = (notifs as any[]).filter((n: any) => !n.is_read).length

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const roleLabel   = user?.role === 'student' ? 'Student' : user?.role === 'admin' ? 'Admin' : 'Partner'
  const profilePath = user?.role === 'student' ? '/student/profile' : user?.role === 'admin' ? '/admin/dashboard' : '/partner/profile'
  const settingsPath = user?.role === 'student' ? '/student/settings' : user?.role === 'admin' ? '/admin/settings' : '/partner/settings'

  const handleBell = () => {
    const p = user?.role === 'student' ? '/student/notifications' : user?.role === 'admin' ? '/admin/dashboard' : '/partner/dashboard'
    navigate(p)
  }

  const handleLogout = async () => {
    setOpen(false)
    await signOut()
    navigate('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-[#E6E8F5] flex items-center justify-end px-6 gap-4 flex-shrink-0 relative z-30">
      {/* Bell */}
      <button onClick={handleBell} className="relative text-[#9CA3AF] hover:text-[#4B5563] transition-colors p-1">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Profile pill + dropdown */}
      <div ref={dropRef} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E6E8F5] hover:bg-gray-50 transition-colors"
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#4F46E5' }}>
            {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className="text-sm text-[#4B5563] font-medium">{user?.full_name?.split(' ')[0] ?? roleLabel}</span>
          <ChevronDown size={14} className={cn('text-[#9CA3AF] transition-transform duration-200', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[12px] border border-[#E6E8F5] shadow-lg overflow-hidden z-50">
            {/* User info header */}
            <div className="px-4 py-3 border-b border-[#E6E8F5]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: '#4F46E5' }}>
                  {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{user?.full_name}</p>
                  <p className="text-xs text-[#9CA3AF] truncate">{user?.email}</p>
                </div>
              </div>
              <span className="mt-2 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#EEF0FF', color: '#4F46E5' }}>
                {roleLabel}
              </span>
            </div>

            {/* Nav items */}
            <div className="py-1">
              <button
                onClick={() => { setOpen(false); navigate(profilePath) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B5563] hover:bg-gray-50 transition-colors text-left"
              >
                <User size={15} className="text-[#9CA3AF] flex-shrink-0" /> My Profile
              </button>
              <button
                onClick={() => { setOpen(false); navigate(settingsPath) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B5563] hover:bg-gray-50 transition-colors text-left"
              >
                <Settings size={15} className="text-[#9CA3AF] flex-shrink-0" /> Settings
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-[#E6E8F5] py-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={15} className="flex-shrink-0" /> Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
