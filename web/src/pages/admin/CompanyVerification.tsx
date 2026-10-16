import { CheckCircle, XCircle, Building2, Globe, Clock } from 'lucide-react'
import { useState } from 'react'

const COMPANIES = [
  { id: '1', name: 'Startup XYZ', industry: 'EdTech', website: 'startup-xyz.com', registeredBy: 'John Smith', registeredAt: '2026-10-14', verified: false },
  { id: '2', name: 'Wipro Technologies', industry: 'IT Services', website: 'wipro.com', registeredBy: 'HR Team', registeredAt: '2026-10-12', verified: false },
  { id: '3', name: 'Amazon India', industry: 'E-Commerce', website: 'amazon.in', registeredBy: 'Recruiter', registeredAt: '2026-10-10', verified: true },
]

export function CompanyVerification() {
  const [companies, setCompanies] = useState(COMPANIES)

  const verify = (id: string) => setCompanies(prev => prev.map(c => c.id === id ? { ...c, verified: true } : c))
  const reject = (id: string) => setCompanies(prev => prev.filter(c => c.id !== id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Company Verification</h1>
        <p className="text-sm text-[#4B5563] mt-0.5">Review and verify company registrations before they can post jobs</p>
      </div>
      <div className="space-y-3">
        {companies.map(c => (
          <div key={c.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#EEF0FF' }}>
              <Building2 size={22} style={{ color: '#4F46E5' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#111827]">{c.name}</h3>
                {c.verified && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#DCFCE7', color: '#16A34A' }}>Verified</span>}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-[#9CA3AF]">
                <span>{c.industry}</span>
                <span className="flex items-center gap-1"><Globe size={11} /> {c.website}</span>
                <span className="flex items-center gap-1"><Clock size={11} /> {c.registeredAt}</span>
              </div>
            </div>
            {!c.verified && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => verify(c.id)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                  style={{ background: '#16A34A' }}
                >
                  <CheckCircle size={13} /> Verify
                </button>
                <button
                  onClick={() => reject(c.id)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                  style={{ background: '#EF4444' }}
                >
                  <XCircle size={13} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
