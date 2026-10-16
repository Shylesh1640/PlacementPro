import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Globe, Clock, CheckCircle, XCircle, Shield } from 'lucide-react'
import { getAllCompanies, verifyCompany } from '../../lib/queries'

const DEMO_COMPANIES = [
  { id: 'd1', name: 'StartupAI', industry: 'EdTech', website: 'startup-ai.com', created_at: new Date(Date.now() - 86400000).toISOString(), verified: false },
  { id: 'd2', name: 'Wipro Technologies', industry: 'IT Services', website: 'wipro.com', created_at: new Date(Date.now() - 2 * 86400000).toISOString(), verified: false },
  { id: 'd3', name: 'Amazon India', industry: 'E-Commerce', website: 'amazon.in', created_at: new Date(Date.now() - 5 * 86400000).toISOString(), verified: true },
]

export function CompanyVerification() {
  const qc = useQueryClient()

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: getAllCompanies,
    refetchInterval: 30000,
  })

  const verifyMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) => verifyCompany(id, verified),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['allCompanies'] }),
  })

  const displayCompanies = companies.length > 0 ? companies : DEMO_COMPANIES
  const pending = displayCompanies.filter((c: any) => !c.verified).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Company Verification</h1>
          <p className="text-sm text-[#4B5563] mt-0.5">Verify companies before they can post jobs</p>
        </div>
        {pending > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: '#F59E0B' }}>
            {pending} pending
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
        </div>
      ) : displayCompanies.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-12 text-center">
          <Shield size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-[#9CA3AF]">No company registrations yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayCompanies.map((c: any) => (
            <div key={c.id} className={`bg-white rounded-[12px] border shadow-sm p-5 flex items-center gap-4 ${!c.verified ? 'border-[#FED7AA]' : 'border-[#E6E8F5]'}`}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0" style={{ background: '#EEF0FF', color: '#4F46E5' }}>
                {(c.name ?? 'C')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-[#111827]">{c.name}</h3>
                  {c.verified ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#FFF7ED', color: '#F59E0B' }}>Pending</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-[#9CA3AF]">
                  {c.industry && <span>{c.industry}</span>}
                  {c.website && (
                    <span className="flex items-center gap-1"><Globe size={11} />{c.website}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                {c.verification_note && (
                  <p className="text-xs text-[#4B5563] mt-1 italic">"{c.verification_note}"</p>
                )}
              </div>
              {!c.verified && !c.id.startsWith('d') && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => verifyMutation.mutate({ id: c.id, verified: true })}
                    disabled={verifyMutation.isPending}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-60" style={{ background: '#16A34A' }}>
                    <CheckCircle size={13} /> Verify
                  </button>
                  <button onClick={() => verifyMutation.mutate({ id: c.id, verified: false })}
                    disabled={verifyMutation.isPending}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-60" style={{ background: '#EF4444' }}>
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
