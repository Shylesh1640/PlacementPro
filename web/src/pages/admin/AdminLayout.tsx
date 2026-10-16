import { AppLayout } from '../../components/layout/AppLayout'
import {
  LayoutDashboard, Users, ClipboardList, Briefcase,
  Calendar, BarChart2, FileText, Settings, Shield,
  Building2, BookOpen
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Students', path: '/admin/students', icon: <Users size={16} /> },
  { label: 'Assessments', path: '/admin/assessments', icon: <ClipboardList size={16} /> },
  { label: 'Question Bank', path: '/admin/question-bank', icon: <BookOpen size={16} /> },
  { label: 'Job Postings', path: '/admin/job-postings', icon: <Briefcase size={16} /> },
  { label: 'Interview Mgmt', path: '/admin/interviews', icon: <Calendar size={16} /> },
  { label: 'Proctoring', path: '/admin/proctoring-review', icon: <Shield size={16} /> },
  { label: 'Companies', path: '/admin/company-verification', icon: <Building2 size={16} /> },
  { label: 'Analytics', path: '/admin/analytics', icon: <BarChart2 size={16} /> },
  { label: 'Reports', path: '/admin/reports', icon: <FileText size={16} /> },
  { label: 'Settings', path: '/admin/settings', icon: <Settings size={16} /> },
]

export function AdminLayout() {
  return <AppLayout navItems={navItems} notificationCount={5} />
}
