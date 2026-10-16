import { useState } from 'react'
import { Button } from '../../components/ui/Button'

const defaultWeights = {
  academic: 25,
  aptitude: 20,
  programming: 20,
  communication: 15,
  internship: 10,
  projects: 10,
}

export function AdminSettings() {
  const [weights, setWeights] = useState(defaultWeights)
  const total = Object.values(weights).reduce((a, b) => a + b, 0)

  const update = (key: keyof typeof weights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Admin Settings</h1>
      <div className="max-w-2xl space-y-4">
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
          <h3 className="text-sm font-semibold text-[#111827] mb-1">Readiness Score Weights</h3>
          <p className="text-xs text-[#9CA3AF] mb-5">Configure how each component contributes to the overall readiness score (must sum to 100%)</p>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5 capitalize">{key} Weight (%)</label>
                <input
                  type="number"
                  value={value}
                  min={0}
                  max={100}
                  onChange={e => update(key as keyof typeof weights, Number(e.target.value))}
                  className="w-full border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>
            ))}
          </div>
          <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${total === 100 ? 'text-[#16A34A] bg-[#DCFCE7]' : 'text-[#EF4444] bg-[#FEE2E2]'}`}>
            Total: {total}% {total !== 100 && '(must equal 100%)'}
          </div>
          <Button className="mt-4" disabled={total !== 100}>Save Weights</Button>
        </div>
      </div>
    </div>
  )
}
