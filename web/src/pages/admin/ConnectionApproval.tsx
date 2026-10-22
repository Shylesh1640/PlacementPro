import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Users, Link2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STAT_CFG: Record<string, { bg: string; color: string; label: string; next: string; nextLabel: string }> = {
  pending:   { bg: '#FFF7ED', color: '#F59E0B', label: 'Pending',   next: 'approved',  nextLabel: 'Approve'  },
  approved:  { bg: '#EEF0FF', color: '#4F46E5', label: 'Approved',  next: 'connected', nextLabel: 'Connect'  },
  connected: { bg: '#DCFCE7', color: '#16A34A', label: 'Connected', next: '',          nextLabel: ''         },
}

export function ConnectionApproval() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['connections', filter],
    queryFn: async () => {
      let q = (supabase as any)
        .from('applications')
        .select(`
          id, status, connection_status, applied_at,
          jobs (title, companies (name)),
          students (
            cgpa, readiness_score, proctoring_status,
            profiles (full_name, email)
          )
        `)
        .in('status', ['shortlisted', 'offered'])
        .order('applied_at', { ascending: false })
      if (filter !== 'all') q = q.eq('connection_status', filter)
      const { data } = await q
      return (data ?? []) as any[]
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await (supabase as any).from('applications').update({ connection_status: status }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connections'] }),
  })

  const pending   = connections.filter(c => (c as any).connection_status === 'pending' || !(c as any).connection_status).length
  const approved  = connections.filter(c => (c as any).connection_status === 'approved').length
  const connected = connections.filter(c => (c as any).connection_status === 'connected').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Company Connection Approval</h1>
          <p className="text-sm text-[#4B5563] mt-0.5">
            Approve shortlisted students to connect with companies (Pending → Approved → Connected)
          </p>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="text-sm border border-[#E6E8F5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        >
          <option value="all">All Connections</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="connected">Connected</option>
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Approval', value: pending,   bg: '#FFF7ED', color: '#F59E0B' },
          { label: 'Approved',         value: approved,  bg: '#EEF0FF', color: '#4F46E5' },
          { label: 'Connected',        value: connected, bg: '#DCFCE7', color: '#16A34A' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
        </div>
      ) : connections.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-12 text-center">
          <Users size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-[#9CA3AF]">No shortlisted or offered students to review.</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Shortlist students from Applications page first.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6E8F5] bg-gray-50/50">
                {['Student', 'Company / Role', 'CGPA', 'Readiness', 'App Status', 'Connection', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {(connections as any[]).map(c => {
                const cs = STAT_CFG[c.connection_status ?? 'pending'] ?? STAT_CFG.pending
                return (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Student */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: '#4F46E5' }}>
                          {(c.students?.profiles?.full_name ?? 'S')[0]}
                        </div>
                        <div>
                          <div className="font-medium text-[#111827] text-sm">{c.students?.profiles?.full_name}</div>
                          <div className="text-xs text-[#9CA3AF]">{c.students?.profiles?.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* Company */}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-[#111827] text-sm">{c.jobs?.companies?.name}</div>
                      <div className="text-xs text-[#9CA3AF]">{c.jobs?.title}</div>
                    </td>
                    {/* CGPA */}
                    <td className="px-4 py-3.5 font-semibold text-[#111827] text-sm">{c.students?.cgpa ?? '—'}</td>
                    {/* Readiness */}
                    <td className="px-4 py-3.5">
                      {c.students?.readiness_score ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${c.students.readiness_score}%`, background: '#4F46E5' }} />
                          </div>
                          <span className="text-xs font-medium text-[#111827]">{c.students.readiness_score}</span>
                        </div>
                      ) : <span className="text-xs text-[#9CA3AF]">—</span>}
                    </td>
                    {/* App status */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                        style={{
                          background: c.status === 'offered'     ? '#F3E8FF' : '#DCFCE7',
                          color:      c.status === 'offered'     ? '#7C3AED' : '#16A34A',
                        }}>
                        {c.status}
                      </span>
                    </td>
                    {/* Connection status */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cs.bg, color: cs.color }}>
                        {cs.label}
                      </span>
                    </td>
                    {/* Action */}
                    <td className="px-4 py-3.5">
                      {cs.next ? (
                        <button
                          onClick={() => updateMutation.mutate({ id: c.id, status: cs.next })}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-60 transition-opacity"
                          style={{ background: cs.next === 'connected' ? '#16A34A' : '#4F46E5' }}
                        >
                          {cs.next === 'connected' ? <Link2 size={12} /> : <CheckCircle size={12} />}
                          {cs.nextLabel}
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#16A34A' }}>
                          <CheckCircle size={12} /> Done
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
