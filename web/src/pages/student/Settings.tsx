import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { supabase } from '../../lib/supabase'
import { CheckCircle, AlertCircle } from 'lucide-react'

export function StudentSettings() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.')
      return
    }
    setPwLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPwSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 4000)
    } catch (err: any) {
      setPwError(err.message ?? 'Failed to update password.')
    } finally {
      setPwLoading(false)
    }
  }

  const prefs = [
    { key: 'email', label: 'Email notifications' },
    { key: 'jobs', label: 'Job match alerts' },
    { key: 'interviews', label: 'Interview reminders' },
    { key: 'results', label: 'Assessment results' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Settings</h1>
      <div className="max-w-xl space-y-4">
        {/* Password */}
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#111827]">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              required
            />
            {pwError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{pwError}</p>
              </div>
            )}
            {pwSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#DCFCE7' }}>
                <CheckCircle size={15} style={{ color: '#16A34A' }} />
                <p className="text-sm font-medium" style={{ color: '#16A34A' }}>Password updated successfully!</p>
              </div>
            )}
            <Button type="submit" loading={pwLoading}>Update Password</Button>
          </form>
        </div>

        {/* Notification prefs (local only — extend with DB if needed) */}
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#111827]">Notification Preferences</h3>
          {prefs.map(p => (
            <label key={p.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded"
                style={{ accentColor: '#4F46E5' }}
              />
              <span className="text-sm text-[#4B5563]">{p.label}</span>
            </label>
          ))}
          <Button variant="secondary">Save Preferences</Button>
        </div>
      </div>
    </div>
  )
}
