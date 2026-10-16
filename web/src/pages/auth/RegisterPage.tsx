import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { signUp } from '../../lib/auth'
import type { UserRole } from '../../types/database'

export function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signUp(email, password, fullName, role)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message ?? 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #EEF1FF 0%, #F7F8FF 100%)' }}
    >
      <div className="w-full max-w-md bg-white rounded-[16px] shadow-xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap size={24} style={{ color: '#4F46E5' }} />
          <span className="font-bold text-lg text-gray-900">PlacementPro</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Create Account</h2>
        <p className="text-sm text-gray-500 mb-6">Join the placement ecosystem</p>

        {success ? (
          <div className="text-center py-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#DCFCE7' }}
            >
              <svg className="w-7 h-7" style={{ color: '#16A34A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Check your email!</h3>
            <p className="text-sm text-gray-500 mb-4">We sent a confirmation link to {email}</p>
            <Link to="/login" className="text-sm font-medium" style={{ color: '#4F46E5' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Rahul Sharma"
              required
            />
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
              placeholder="Min. 8 characters"
              required
              minLength={8}
            />
            <Select
              label="Role"
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              options={[
                { value: 'student', label: 'Student' },
                { value: 'admin', label: 'Admin / Placement Officer' },
                { value: 'partner', label: 'Industry Partner' },
              ]}
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <Button type="submit" className="w-full" loading={loading} size="lg">
              Create Account
            </Button>
          </form>
        )}

        {!success && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-medium" style={{ color: '#4F46E5' }}>
              Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
