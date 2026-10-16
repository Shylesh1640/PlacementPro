import { AppLayout } from '../../components/layout/AppLayout'
import { LayoutDashboard, PlusCircle, Briefcase, Users, Calendar, User, Settings } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/partner/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Post Job', path: '/partner/post-job', icon: <PlusCircle size={16} /> },
  { label: 'My Jobs', path: '/partner/my-jobs', icon: <Briefcase size={16} /> },
  { label: 'Applications', path: '/partner/applications', icon: <Users size={16} /> },
  { label: 'Interviews', path: '/partner/interviews', icon: <Calendar size={16} /> },
  { label: 'Profile', path: '/partner/profile', icon: <User size={16} /> },
  { label: 'Settings', path: '/partner/settings', icon: <Settings size={16} /> },
]

export function PartnerLayout() {
  return <AppLayout navItems={navItems} />
}
