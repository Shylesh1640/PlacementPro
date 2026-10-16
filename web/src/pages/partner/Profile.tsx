import { useState } from 'react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'
import { useAuth } from '../../contexts/AuthContext'
import { Upload, CheckCircle, Clock } from 'lucide-react'

export function PartnerProfile() {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const isVerified = false

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#111827]">Company Profile</h1>
        {isVerified ? (
          <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <CheckCircle size={14} /> Verified
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full" style={{ background: '#FFF7ED', color: '#F59E0B' }}>
            <Clock size={14} /> Pending Verification
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-4">
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#111827]">Company Details</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: '#4F46E5' }}>
              {user?.full_name?.[0] ?? 'C'}
            </div>
            <button type="button" className="flex items-center gap-1.5 text-xs text-[#4B5563] border border-[#E6E8F5] px-3 py-2 rounded-lg hover:bg-gray-50">
              <Upload size={13} /> Upload Logo
            </button>
          </div>
          <Input label="Company Name" defaultValue="Google" required />
          <Input label="Industry" defaultValue="Technology" />
          <Input label="Website" type="url" defaultValue="https://google.com" />
          <Textarea label="Company Description" defaultValue="A global technology company specializing in internet-related services and products." rows={3} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>Save Profile</Button>
        </div>
      </form>
    </div>
  )
}
