import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, Users, Building2, ChevronRight, ArrowLeft, Briefcase } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { signIn } from '../../lib/auth'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types/database'

const ROLES = [
  {
    key: 'student' as UserRole,
    label: 'Login as Student',
    icon: <GraduationCap size={20} />,
    description: 'Access assessments, job matches and interviews',
    redirect: '/student/dashboard',
  },
  {
    key: 'admin' as UserRole,
    label: 'Login as Admin',
    icon: <Users size={20} />,
    description: 'Manage students, companies and the placement process',
    redirect: '/admin/dashboard',
  },
  {
    key: 'partner' as UserRole,
    label: 'Login as Industry Partner',
    icon: <Building2 size={20} />,
    description: 'Post jobs and connect with qualified students',
    redirect: '/partner/dashboard',
  },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Set after a successful signIn call — tells the effect below where to go
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null)

  const selectedRoleData = ROLES.find(r => r.key === selectedRole)

  /**
   * Navigate only once the AuthContext has finished loading the user.
   * This avoids the race condition where navigate() fires before
   * onAuthStateChange updates user, causing RoleGuard to bounce back to /login.
   */
  useEffect(() => {
    if (pendingRedirect && !authLoading && user) {
      navigate(pendingRedirect, { replace: true })
    }
  }, [pendingRedirect, authLoading, user, navigate])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return
    setLoading(true)
    setError('')
    try {
      await signIn(email, password, selectedRole)
      // Store destination — the effect above will navigate once user is ready
      setPendingRedirect(selectedRoleData?.redirect ?? '/student/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Sign in failed. Please try again.')
      setLoading(false)
    }
    // Don't call setLoading(false) on success — keep spinner until navigation fires
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #EEF1FF 0%, #F7F8FF 100%)' }}
    >
      <div
        className="w-full max-w-5xl flex rounded-[20px] overflow-hidden shadow-xl"
        style={{ minHeight: 520 }}
      >
        {/* Left Panel */}
        <div
          className="hidden lg:flex flex-col w-[52%] p-12"
          style={{ background: 'linear-gradient(135deg, #EEF1FF 0%, #E0E3FF 100%)' }}
        >
          <div className="flex items-center gap-2 mb-8">
            <GraduationCap size={28} style={{ color: '#4F46E5' }} />
            <span className="font-bold text-lg text-gray-900">PlacementPro</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
            AI-Powered Placement{' '}
            <span style={{ color: '#4F46E5' }}>Ecosystem</span>
          </h1>
          <p className="text-base font-semibold mb-2" style={{ color: '#4F46E5' }}>
            Assess • Match • Connect
          </p>
          <p className="text-sm text-gray-600 mb-10 max-w-xs">
            Building a smarter bridge between students, opportunities and companies.
          </p>

          {/* Illustration */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-xs">
              <div className="flex items-end justify-center gap-6">
                {/* Student figure */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: '#4F46E5' }}
                  >
                    <GraduationCap size={32} color="white" />
                  </div>
                  <div
                    className="w-20 h-12 rounded-lg flex items-center justify-center text-xs font-semibold"
                    style={{ background: '#E0E3FF', border: '1px solid #C7D2FE', color: '#4F46E5' }}
                  >
                    Laptop
                  </div>
                </div>

                {/* Bar chart */}
                <div className="flex items-end gap-1.5 pb-2">
                  {[40, 65, 50, 80, 60].map((h, i) => (
                    <div
                      key={i}
                      className="w-5 rounded-t"
                      style={{ height: h, background: i === 3 ? '#4F46E5' : '#C7D2FE' }}
                    />
                  ))}
                </div>

                {/* Briefcase */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: '#EEF1FF', border: '2px solid #C7D2FE' }}
                >
                  <Briefcase size={28} style={{ color: '#4F46E5' }} />
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <div
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white"
                  style={{ background: '#4F46E5' }}
                >
                  92.5 / 100 Readiness
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-white flex flex-col justify-center p-8 lg:p-10">
          {selectedRole ? (
            <>
              <button
                onClick={() => { setSelectedRole(null); setError('') }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors w-fit"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: '#4F46E5' }}>{selectedRoleData?.icon}</span>
                  <h2 className="text-xl font-bold text-gray-900">{selectedRoleData?.label}</h2>
                </div>
                <p className="text-sm text-gray-500">{selectedRoleData?.description}</p>
              </div>
              <form onSubmit={handleSignIn} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}
                <Button type="submit" className="w-full" loading={loading} size="lg">
                  Sign In
                </Button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-6">
                New here?{' '}
                <Link to="/register" className="font-medium hover:underline" style={{ color: '#4F46E5' }}>
                  Register Now
                </Link>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back!</h2>
              <p className="text-sm text-gray-500 mb-8">Choose your role to continue</p>
              <div className="space-y-3">
                {ROLES.map(role => (
                  <button
                    key={role.key}
                    onClick={() => setSelectedRole(role.key)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all group"
                    style={{ borderColor: '#E6E8F5' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#A5B4FC'
                      ;(e.currentTarget as HTMLButtonElement).style.background = '#EEF0FF'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#E6E8F5'
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'white'
                    }}
                  >
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#EEF0FF', color: '#4F46E5' }}
                    >
                      {role.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900">{role.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{role.description}</div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mt-6">
                New here?{' '}
                <Link to="/register" className="font-medium hover:underline" style={{ color: '#4F46E5' }}>
                  Register Now
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
