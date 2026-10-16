import { Outlet } from 'react-router-dom'
import { Sidebar, type NavItem } from './Sidebar'
import { TopBar } from './TopBar'

interface AppLayoutProps {
  navItems: NavItem[]
  notificationCount?: number
}

export function AppLayout({ navItems, notificationCount }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar items={navItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar notificationCount={notificationCount} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
