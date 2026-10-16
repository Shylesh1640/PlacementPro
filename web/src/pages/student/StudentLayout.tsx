import { AppLayout } from '../../components/layout/AppLayout'
import {
  LayoutDashboard, User, ClipboardList, BarChart2,
  Briefcase, Calendar, Bell, Settings, Trophy
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Profile', path: '/student/profile', icon: <User size={16} /> },
  { label: 'Assessments', path: '/student/assessments', icon: <ClipboardList size={16} /> },
  { label: 'My Results', path: '/student/results', icon: <BarChart2 size={16} /> },
  { label: 'Job Matches', path: '/student/job-matches', icon: <Briefcase size={16} /> },
  { label: 'Interviews', path: '/student/interviews', icon: <Calendar size={16} /> },
  { label: 'Placement Tracking', path: '/student/tracking', icon: <Trophy size={16} /> },
  { label: 'Notifications', path: '/student/notifications', icon: <Bell size={16} /> },
  { label: 'Settings', path: '/student/settings', icon: <Settings size={16} /> },
]

export function StudentLayout() {
  return <AppLayout navItems={navItems} />
}
