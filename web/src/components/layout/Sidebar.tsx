import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { GraduationCap, LogOut } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'

export interface NavItem {
  label: string
  path: string
  icon: ReactNode
}

interface SidebarProps {
  items: NavItem[]
}

export function Sidebar({ items }: SidebarProps) {
  const { signOut } = useAuth()

  return (
    <aside className="w-48 min-h-screen bg-white border-r border-border flex flex-col flex-shrink-0">
      <div className="px-4 py-5 flex items-center gap-2.5 border-b border-border">
        <GraduationCap size={22} className="text-primary flex-shrink-0" />
        <span className="text-sm font-bold text-heading">PlacementPro</span>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={false}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors mx-2 rounded-lg mb-0.5',
                isActive
                  ? 'bg-sidebar-active text-primary font-medium'
                  : 'text-body hover:bg-gray-50'
              )
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-body hover:bg-red-50 hover:text-danger w-full rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
