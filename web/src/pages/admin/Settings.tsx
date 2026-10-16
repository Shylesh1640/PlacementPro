import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { getReadinessWeights, updateReadinessWeights } from '../../lib/queries'

const WEIGHT_KEYS = [
  { key: 'academic_weight', label: 'Academic Performance', desc: '10th %, 12th %, CGPA' },
  { key: 'aptitude_weight', label: 'Aptitude Score', desc: 'Quantitative assessment result' },
  { key: 'programming_weight', label: 'Programming Score', desc: 'Programming skills assessment' },
  { key: 'communication_weight', label: 'Communication Score', desc: 'Communication assessment' },
  { key: 'internship_weight', label: 'Internship', desc: 'Completed vs not completed' },
  { key: 'projects_weight', label: 'Projects', desc: 'Number of projects' },
]

export function AdminSettings() {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)

  const { data: weights, isLoading } = useQuery({
    queryKey: ['readinessWeights'],
    queryFn: getReadinessWeights,
  })

  const [localWeights, setLocalWeights] = useState<Record<string, number> | null>(null)
  if (weights && !localWeights) {
    setLocalWeights({ ...weights })
  }

  const currentWeights = localWeights ?? weights ?? {}
  const weightTotal = WEIGHT_KEYS.reduce((sum, w) => sum + (Number((currentWeights as any)[w.key]) || 0), 0)

  const saveMutation = useMutation({
    mutationFn: () => updateReadinessWeights(currentWeights as Record<string, number>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['readinessWeights'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Admin Settings</h1>

      <div className="max-w-2xl space-y-4">
        {/* Readiness Weights */}
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-[#111827]">Readiness Score Weights</h3>
            <p className="text-xs text-[#9CA3AF] mt-1">Configure how each component contributes to the overall readiness score. Must sum to 100%.</p>
          </div>
          <div className="space-y-4">
            {WEIGHT_KEYS.map(w => (
              <div key={w.key} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111827]">{w.label}</p>
                  <p className="text-xs text-[#9CA3AF]">{w.desc}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    value={(currentWeights as any)[w.key] ?? 0}
                    min={0}
                    max={100}
                    onChange={e => setLocalWeights(prev => ({ ...(prev ?? {}), [w.key]: Number(e.target.value) }))}
                    className="w-20 border border-[#E6E8F5] rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                  <span className="text-sm text-[#9CA3AF]">%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total indicator */}
          <div className={`mt-5 p-3 rounded-xl flex items-center gap-2 ${weightTotal === 100 ? 'bg-[#DCFCE7] border border-[#A7F3D0]' : 'bg-[#FEE2E2] border border-[#FECACA]'}`}>
            {weightTotal === 100
              ? <CheckCircle size={16} style={{ color: '#16A34A' }} />
              : <AlertCircle size={16} style={{ color: '#EF4444' }} />}
            <span className={`text-sm font-semibold ${weightTotal === 100 ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
              Total: {weightTotal}% {weightTotal !== 100 && `(needs to be 100%)`}
            </span>
          </div>

          {saved && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl" style={{ background: '#DCFCE7' }}>
              <CheckCircle size={15} style={{ color: '#16A34A' }} />
              <span className="text-sm font-medium" style={{ color: '#16A34A' }}>Weights saved successfully!</span>
            </div>
          )}
          {saveMutation.error && (
            <p className="mt-3 text-sm text-red-600">{(saveMutation.error as Error).message}</p>
          )}

          <div className="mt-5">
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={weightTotal !== 100}
              icon={<Save size={15} />}
            >
              Save Weights
            </Button>
          </div>
        </div>

        {/* Readiness Categories */}
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-sm font-semibold text-[#111827] mb-4">Score Categories (Read-only)</h3>
          <div className="space-y-3">
            {[
              { range: '80 – 100', label: 'Placement Ready', bg: '#DCFCE7', color: '#16A34A' },
              { range: '60 – 79', label: 'Needs Improvement', bg: '#FFF7ED', color: '#F59E0B' },
              { range: 'Below 60', label: 'At Risk', bg: '#FEE2E2', color: '#EF4444' },
            ].map(cat => (
              <div key={cat.range} className="flex items-center justify-between p-3 rounded-xl border border-[#E6E8F5]">
                <span className="text-sm text-[#4B5563] font-medium">{cat.range}</span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: cat.bg, color: cat.color }}>
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
