import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { UserPlus, CheckCircle, ArrowLeft } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { supabase } from '../../lib/supabase'

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical Engineering',
  'Mechanical',
  'Civil',
  'Chemical',
]

const EMPTY_FORM = {
  fullName: '',
  email: '',
  studentId: '',
  department: 'Computer Science',
  cgpa: '',
  tenth: '',
  twelfth: '',
  backlogs: '0',
  phone: '',
}

export function CreateStudent() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [success, setSuccess] = useState(false)
  const [createdEmail, setCreatedEmail] = useState('')

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const createMutation = useMutation({
    mutationFn: async () => {
      // 1. Create auth user via admin API
      const { data: authData, error: authErr } = await (supabase as any).auth.admin.createUser({
        email: form.email,
        password: 'PlacementPro@2026',
        email_confirm: true,
        user_metadata: {
          full_name: form.fullName,
          role: 'student',
          department: form.department,
          cgpa: parseFloat(form.cgpa),
          backlogs: parseInt(form.backlogs),
        },
      })
      if (authErr) throw authErr

      // 2. Give DB trigger time to create profiles row
      await new Promise(r => setTimeout(r, 1200))

      // 3. Create student record
      const { error: stuErr } = await (supabase as any).from('students').upsert({
        profile_id: authData.user.id,
        student_id: form.studentId,
        department: form.department,
        cgpa: parseFloat(form.cgpa) || 0,
        tenth_percent: parseFloat(form.tenth) || 0,
        twelfth_percent: parseFloat(form.twelfth) || 0,
        backlogs: parseInt(form.backlogs) || 0,
        contact_phone: form.phone,
        placement_status: 'pending',
        proctoring_status: 'normal',
      })
      if (stuErr) throw stuErr

      return authData.user.email as string
    },
    onSuccess: email => {
      setCreatedEmail(email ?? form.email)
      setSuccess(true)
    },
  })

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-8 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#DCFCE7' }}
          >
            <CheckCircle size={32} style={{ color: '#16A34A' }} />
          </div>
          <h2 className="text-xl font-bold text-[#111827] mb-2">Student Account Created!</h2>
          <p className="text-sm text-[#4B5563] mb-6 leading-relaxed">
            Account created for <strong>{form.fullName}</strong>
            <br />
            Email:{' '}
            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{createdEmail}</code>
            <br />
            Default password:{' '}
            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">PlacementPro@2026</code>
            <br />
            <span className="text-[#9CA3AF]">Student should change password on first login.</span>
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => navigate('/admin/students')}>
              View All Students
            </Button>
            <Button
              onClick={() => {
                setSuccess(false)
                setCreatedEmail('')
                setForm(EMPTY_FORM)
              }}
            >
              Create Another
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/students')}
          className="p-2 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Create Student Account</h1>
          <p className="text-sm text-[#4B5563] mt-0.5">
            Admin-only — students cannot self-register
          </p>
        </div>
      </div>

      {/* Personal Details */}
      <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[#111827]">Personal Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={form.fullName}
            onChange={e => f('fullName', e.target.value)}
            placeholder="e.g. Rahul Sharma"
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={e => f('email', e.target.value)}
            placeholder="student@college.edu"
            required
          />
          <Input
            label="Student ID"
            value={form.studentId}
            onChange={e => f('studentId', e.target.value)}
            placeholder="e.g. CS2024001"
            required
          />
          <Input
            label="Phone Number"
            value={form.phone}
            onChange={e => f('phone', e.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>
      </div>

      {/* Academic Details */}
      <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[#111827]">Academic Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Department"
            value={form.department}
            onChange={e => f('department', e.target.value)}
            options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
          />
          <Input
            label="CGPA"
            type="number"
            step="0.01"
            min="0"
            max="10"
            value={form.cgpa}
            onChange={e => f('cgpa', e.target.value)}
            placeholder="0.00 – 10.00"
            required
          />
          <Input
            label="10th %"
            type="number"
            step="0.1"
            value={form.tenth}
            onChange={e => f('tenth', e.target.value)}
            placeholder="e.g. 92.5"
          />
          <Input
            label="12th %"
            type="number"
            step="0.1"
            value={form.twelfth}
            onChange={e => f('twelfth', e.target.value)}
            placeholder="e.g. 88.0"
          />
          <Input
            label="Active Backlogs"
            type="number"
            min="0"
            value={form.backlogs}
            onChange={e => f('backlogs', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      {/* Info Banner */}
      <div
        className="rounded-[12px] p-4 text-sm text-[#4B5563] border"
        style={{ background: '#EEF0FF', borderColor: '#C7D2FE' }}
      >
        <strong>Default password:</strong>{' '}
        <code className="bg-white px-2 py-0.5 rounded text-xs">PlacementPro@2026</code>
        <br />
        The student must change this on first login via Settings → Change Password.
      </div>

      {/* Error */}
      {createMutation.error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {(createMutation.error as Error).message}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate('/admin/students')}>
          Cancel
        </Button>
        <Button
          onClick={() => createMutation.mutate()}
          loading={createMutation.isPending}
          disabled={!form.fullName || !form.email || !form.studentId || !form.cgpa}
          icon={<UserPlus size={15} />}
        >
          Create Student Account
        </Button>
      </div>
    </div>
  )
}
