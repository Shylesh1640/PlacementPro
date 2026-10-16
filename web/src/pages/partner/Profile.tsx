import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'
import { useAuth } from '../../contexts/AuthContext'
import { Upload, CheckCircle, Clock } from 'lucide-react'
import { getCompanyByProfileId, upsertCompany } from '../../lib/queries'

export function PartnerProfile() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name: '', industry: '', website: '', description: '' })
  const [synced, setSynced] = useState(false)

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', user?.id],
    queryFn: () => getCompanyByProfileId(user!.id),
    enabled: !!user?.id,
  })

  useEffect(() => {
    if (company && !synced) {
      setForm({
        name: (company as any).name ?? '',
        industry: (company as any).industry ?? '',
        website: (company as any).website ?? '',
        description: (company as any).description ?? '',
      })
      setSynced(true)
    }
  }, [company, synced])

  const saveMutation = useMutation({
    mutationFn: () => upsertCompany(user!.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', user?.id] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const isVerified = !!(company as any)?.verified

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate()
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
    </div>
  )

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
              {form.name?.[0]?.toUpperCase() ?? user?.full_name?.[0] ?? 'C'}
            </div>
            <button type="button" className="flex items-center gap-1.5 text-xs text-[#4B5563] border border-[#E6E8F5] px-3 py-2 rounded-lg hover:bg-gray-50">
              <Upload size={13} /> Upload Logo
            </button>
          </div>

          <Input
            label="Company Name"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Google"
            required
          />
          <Input
            label="Industry"
            value={form.industry}
            onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
            placeholder="e.g. Technology"
          />
          <Input
            label="Website"
            type="url"
            value={form.website}
            onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
            placeholder="https://yourcompany.com"
          />
          <Textarea
            label="Company Description"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Describe your company, culture and what you're looking for…"
            rows={3}
          />
        </div>

        {saved && (
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#DCFCE7' }}>
            <CheckCircle size={15} style={{ color: '#16A34A' }} />
            <span className="text-sm font-medium" style={{ color: '#16A34A' }}>Company profile saved!</span>
          </div>
        )}
        {saveMutation.error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {(saveMutation.error as Error).message}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" loading={saveMutation.isPending} disabled={!form.name.trim()}>
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  )
}
