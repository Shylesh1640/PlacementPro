import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Plus, Trash2, Save, CheckCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  getOrCreateStudent, getStudentSkills,
  updateStudent, upsertStudentSkill, deleteStudentSkill
} from '../../lib/queries'

export function StudentProfile() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [newSkill, setNewSkill] = useState('')
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parsedFields, setParsedFields] = useState<string[]>([])
  const [synced, setSynced] = useState(false)
  const [form, setForm] = useState({
    student_id: '', department: '', cgpa: '', tenth_percent: '',
    twelfth_percent: '', backlogs: '0', contact_phone: '',
  })

  // Internship form
  const [showInternForm, setShowInternForm] = useState(false)
  const [newIntern, setNewIntern] = useState({ company: '', role: '', duration_months: '', completed: false, start_date: '', end_date: '' })

  // Project form
  const [showProjForm, setShowProjForm] = useState(false)
  const [newProj, setNewProj] = useState({ title: '', description: '', technologies: '', url: '' })

  // Cert form
  const [showCertForm, setShowCertForm] = useState(false)
  const [newCert, setNewCert] = useState({ name: '', issuer: '', issue_date: '' })
  const [certUploading, setCertUploading] = useState(false)

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', user?.id],
    queryFn: () => getOrCreateStudent(user!.id, user as any),
    enabled: !!user?.id,
  })

  const { data: skills = [] } = useQuery({
    queryKey: ['skills', student?.id],
    queryFn: () => getStudentSkills(student!.id),
    enabled: !!student?.id,
  })

  const { data: internships = [] } = useQuery({
    queryKey: ['internships', student?.id],
    queryFn: async () => {
      const { data } = await supabase.from('internships').select('*').eq('student_id', student!.id).order('start_date', { ascending: false })
      return data ?? []
    },
    enabled: !!student?.id,
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', student?.id],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('*').eq('student_id', student!.id).order('created_at', { ascending: false })
      return data ?? []
    },
    enabled: !!student?.id,
  })

  const { data: certs = [] } = useQuery({
    queryKey: ['certifications', student?.id],
    queryFn: async () => {
      const { data } = await supabase.from('certifications').select('*').eq('student_id', student!.id).order('issue_date', { ascending: false })
      return data ?? []
    },
    enabled: !!student?.id,
  })

  useEffect(() => {
    if (student && !synced) {
      setForm({
        student_id: student.student_id ?? '',
        department: student.department ?? '',
        cgpa: student.cgpa?.toString() ?? '',
        tenth_percent: student.tenth_percent?.toString() ?? '',
        twelfth_percent: student.twelfth_percent?.toString() ?? '',
        backlogs: student.backlogs?.toString() ?? '0',
        contact_phone: student.contact_phone ?? '',
      })
      setSynced(true)
    }
  }, [student, synced])

  const saveMutation = useMutation({
    mutationFn: () => updateStudent(student!.id, {
      student_id: form.student_id, department: form.department,
      cgpa: parseFloat(form.cgpa) || 0, tenth_percent: parseFloat(form.tenth_percent) || 0,
      twelfth_percent: parseFloat(form.twelfth_percent) || 0, backlogs: parseInt(form.backlogs) || 0,
      contact_phone: form.contact_phone,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['student', user?.id] }); setSaved(true); setTimeout(() => setSaved(false), 3000) },
  })

  const addSkillMutation = useMutation({
    mutationFn: (s: string) => upsertStudentSkill(student!.id, s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['skills', student?.id] }); setNewSkill('') },
  })
  const removeSkillMutation = useMutation({
    mutationFn: (id: string) => deleteStudentSkill(student!.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills', student?.id] }),
  })

  // Internship mutations
  const addInternMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('internships').insert({
        student_id: student!.id, company: newIntern.company, role: newIntern.role,
        duration_months: parseInt(newIntern.duration_months) || null,
        completed: newIntern.completed,
        start_date: newIntern.start_date || null,
        end_date: newIntern.end_date || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['internships', student?.id] })
      setNewIntern({ company: '', role: '', duration_months: '', completed: false, start_date: '', end_date: '' })
      setShowInternForm(false)
    },
  })
  const deleteInternMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('internships').delete().eq('id', id); if (error) throw error },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['internships', student?.id] }),
  })

  // Project mutations
  const addProjMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('projects').insert({
        student_id: student!.id, title: newProj.title, description: newProj.description,
        technologies: newProj.technologies.split(',').map(t => t.trim()).filter(Boolean),
        url: newProj.url || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', student?.id] })
      setNewProj({ title: '', description: '', technologies: '', url: '' })
      setShowProjForm(false)
    },
  })
  const deleteProjMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('projects').delete().eq('id', id); if (error) throw error },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', student?.id] }),
  })

  // Certification mutations
  const addCertMutation = useMutation({
    mutationFn: async (certUrl?: string) => {
      const { error } = await supabase.from('certifications').insert({
        student_id: student!.id, name: newCert.name, issuer: newCert.issuer,
        issue_date: newCert.issue_date || null, certificate_url: certUrl ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certifications', student?.id] })
      setNewCert({ name: '', issuer: '', issue_date: '' })
      setShowCertForm(false)
    },
  })
  const deleteCertMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('certifications').delete().eq('id', id); if (error) throw error },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certifications', student?.id] }),
  })

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !student) return
    setUploading(true)
    try {
      const path = `${student.id}/${file.name}`
      const { error } = await supabase.storage.from('resumes').upload(path, file, { upsert: true })
      if (!error) { const { data: u } = supabase.storage.from('resumes').getPublicUrl(path); await updateStudent(student.id, { resume_url: u.publicUrl }); qc.invalidateQueries({ queryKey: ['student', user?.id] }) }
    } finally { setUploading(false) }
  }

  const handleUploadCert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !student) return
    setCertUploading(true)
    try {
      const path = `${student.id}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('certificates').upload(path, file, { upsert: true })
      if (!error) { const { data: u } = supabase.storage.from('certificates').getPublicUrl(path); addCertMutation.mutate(u.publicUrl) }
      else addCertMutation.mutate()
    } catch { addCertMutation.mutate() }
    finally { setCertUploading(false) }
  }

  const handleParseResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !student) return
    setUploading(true)
    try {
      const path = `${student.id}/${file.name}`
      await supabase.storage.from('resumes').upload(path, file, { upsert: true }).then(async () => {
        const { data: u } = supabase.storage.from('resumes').getPublicUrl(path)
        await updateStudent(student.id, { resume_url: u.publicUrl }); qc.invalidateQueries({ queryKey: ['student', user?.id] })
      })
    } catch { /* upload failure non-blocking */ } finally { setUploading(false) }
    setParsing(true); setParsedFields([])
    try {
      const text = await file.text().catch(() => ''); if (!text.trim()) return
      const aiUrl = (import.meta.env.VITE_AI_SERVICE_URL as string) ?? 'http://localhost:8000'
      const res = await fetch(`${aiUrl}/api/parse-resume`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume_text: text, filename: file.name }), signal: AbortSignal.timeout(15000) })
      if (!res.ok) throw new Error('parse failed')
      const parsed = await res.json()
      const filled: string[] = []
      setForm(prev => {
        const u = { ...prev }
        if (parsed.department && !prev.department) { u.department = parsed.department; filled.push('Department') }
        if (parsed.cgpa) { u.cgpa = String(parsed.cgpa); filled.push('CGPA') }
        if (parsed.tenth_percent) { u.tenth_percent = String(parsed.tenth_percent); filled.push('10th %') }
        if (parsed.twelfth_percent) { u.twelfth_percent = String(parsed.twelfth_percent); filled.push('12th %') }
        if (parsed.phone && !prev.contact_phone) { u.contact_phone = parsed.phone; filled.push('Phone') }
        return u
      })
      setSynced(false)
      if (parsed.skills?.length) { for (const sk of (parsed.skills as string[]).slice(0, 15)) await upsertStudentSkill(student.id, sk).catch(() => {}); qc.invalidateQueries({ queryKey: ['skills', student?.id] }); filled.push('Skills') }
      setParsedFields(filled)
    } catch { /* AI offline */ } finally { setParsing(false) }
  }

  const fields = [
    { label: 'Full Name', readonly: true, value: user?.full_name ?? '', placeholder: 'Your full name' },
    { label: 'Student ID', key: 'student_id', placeholder: 'e.g. CS2021001' },
    { label: 'Department', key: 'department', placeholder: 'e.g. Computer Science' },
    { label: 'CGPA', key: 'cgpa', placeholder: '0.00–10.00', type: 'number', step: '0.01', min: '0', max: '10' },
    { label: '10th %', key: 'tenth_percent', placeholder: 'e.g. 92.5', type: 'number', step: '0.1' },
    { label: '12th %', key: 'twelfth_percent', placeholder: 'e.g. 88.0', type: 'number', step: '0.1' },
    { label: 'Active Backlogs', key: 'backlogs', placeholder: '0', type: 'number', min: '0' },
    { label: 'Phone', key: 'contact_phone', placeholder: '+91 ...' },
  ] as any[]

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" /></div>

  const SectionHeader = ({ title, count, open, onToggle }: any) => (
    <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
      <h3 className="text-sm font-semibold text-[#111827]">{title} {count > 0 && <span className="ml-1.5 text-xs font-normal text-[#9CA3AF]">({count})</span>}</h3>
      {open ? <ChevronUp size={16} className="text-[#9CA3AF]" /> : <ChevronDown size={16} className="text-[#9CA3AF]" />}
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">My Profile</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar + upload */}
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 flex flex-col items-center text-center h-fit">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-3" style={{ background: '#4F46E5' }}>
            {user?.full_name?.[0]?.toUpperCase() ?? 'S'}
          </div>
          <p className="text-base font-semibold text-[#111827]">{user?.full_name}</p>
          <p className="text-sm text-[#9CA3AF]">{user?.email}</p>
          <span className="mt-3 text-xs px-3 py-1 rounded-full font-medium" style={{ background: '#EEF0FF', color: '#4F46E5' }}>Student</span>
          {student?.resume_url && <a href={student.resume_url} target="_blank" rel="noreferrer" className="mt-3 text-xs underline" style={{ color: '#4F46E5' }}>View Resume</a>}
          <label className="mt-4 flex items-center gap-2 text-xs text-[#4B5563] border border-[#E6E8F5] px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <Upload size={13} /> {uploading ? 'Uploading…' : 'Upload Resume'}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUploadResume} />
          </label>
          {parsedFields.length > 0 && (
            <div className="mt-3 p-3 rounded-lg border border-[#A7F3D0] text-xs w-full" style={{ background: '#F0FFF4' }}>
              <p className="font-medium" style={{ color: '#16A34A' }}>✓ Auto-filled: {parsedFields.join(', ')}</p>
              <p className="text-[#4B5563] mt-0.5">Review and click Save Profile.</p>
            </div>
          )}
          <label className="mt-3 flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-lg cursor-pointer w-full transition-colors" style={{ background: parsing ? '#9CA3AF' : '#4F46E5', color: 'white' }}>
            {parsing ? <><div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> Parsing…</> : <><Upload size={13} /> Upload &amp; Parse with AI</>}
            <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleParseResume} disabled={parsing || !student} />
          </label>
          <p className="text-[10px] text-[#9CA3AF] mt-1">Uses Groq AI to auto-fill profile fields</p>
        </div>

        {/* Right: All sections */}
        <div className="lg:col-span-2 space-y-4">
          {/* Academic Details */}
          <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">Academic Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(f => (
                <Input key={f.label} label={f.label} type={f.type ?? 'text'} step={f.step} min={f.min} max={f.max} placeholder={f.placeholder} readOnly={f.readonly}
                  value={f.readonly ? f.value : (form as any)[f.key] ?? ''}
                  onChange={e => { if (!f.readonly && f.key) setForm((p: any) => ({ ...p, [f.key]: e.target.value })) }} />
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">Technical Skills</h3>
            <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
              {(skills as any[]).length === 0 && <p className="text-xs text-[#9CA3AF]">No skills added yet.</p>}
              {(skills as any[]).map(ss => (
                <span key={ss.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: '#EEF0FF', color: '#4F46E5' }}>
                  {ss.skills?.name ?? 'Skill'}
                  <button onClick={() => removeSkillMutation.mutate(ss.skill_id)} className="hover:text-red-500 transition-colors"><Trash2 size={11} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && newSkill.trim() && addSkillMutation.mutate(newSkill.trim())}
                placeholder="Add a skill and press Enter…" className="flex-1 text-sm border border-[#E6E8F5] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]" />
              <button onClick={() => newSkill.trim() && addSkillMutation.mutate(newSkill.trim())} disabled={addSkillMutation.isPending || !newSkill.trim()}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white disabled:opacity-50" style={{ background: '#4F46E5' }}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Internships */}
          <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#111827]">Internships <span className="text-xs font-normal text-[#9CA3AF]">({(internships as any[]).length})</span></h3>
              <button onClick={() => setShowInternForm(f => !f)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
            {(internships as any[]).length === 0 && !showInternForm && <p className="text-xs text-[#9CA3AF]">No internships added yet.</p>}
            <div className="space-y-2">
              {(internships as any[]).map((i: any) => (
                <div key={i.id} className="flex items-start justify-between p-3 rounded-xl border border-[#E6E8F5] bg-gray-50/50">
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{i.company} — {i.role}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {i.duration_months && <span className="text-xs text-[#9CA3AF]">{i.duration_months} months</span>}
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: i.completed ? '#DCFCE7' : '#FFF7ED', color: i.completed ? '#16A34A' : '#F59E0B' }}>
                        {i.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteInternMutation.mutate(i.id)} className="text-[#9CA3AF] hover:text-red-500 transition-colors ml-2 flex-shrink-0"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            {showInternForm && (
              <div className="mt-3 p-4 rounded-xl border border-[#C7D2FE] space-y-3" style={{ background: '#F5F7FF' }}>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Company" value={newIntern.company} onChange={e => setNewIntern(p => ({ ...p, company: e.target.value }))} placeholder="e.g. Google" required />
                  <Input label="Role" value={newIntern.role} onChange={e => setNewIntern(p => ({ ...p, role: e.target.value }))} placeholder="e.g. SDE Intern" required />
                  <Input label="Duration (months)" type="number" value={newIntern.duration_months} onChange={e => setNewIntern(p => ({ ...p, duration_months: e.target.value }))} placeholder="e.g. 3" />
                  <Input label="Start Date" type="date" value={newIntern.start_date} onChange={e => setNewIntern(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <label className="flex items-center gap-2 text-sm text-[#4B5563] cursor-pointer">
                  <input type="checkbox" checked={newIntern.completed} onChange={e => setNewIntern(p => ({ ...p, completed: e.target.checked }))} className="accent-[#4F46E5]" />
                  Completed
                </label>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => addInternMutation.mutate()} loading={addInternMutation.isPending} disabled={!newIntern.company || !newIntern.role}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowInternForm(false)}>Cancel</Button>
                </div>
                {addInternMutation.error && <p className="text-xs text-red-600">{(addInternMutation.error as Error).message}</p>}
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#111827]">Projects <span className="text-xs font-normal text-[#9CA3AF]">({(projects as any[]).length})</span></h3>
              <button onClick={() => setShowProjForm(f => !f)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
            {(projects as any[]).length === 0 && !showProjForm && <p className="text-xs text-[#9CA3AF]">No projects added yet.</p>}
            <div className="space-y-2">
              {(projects as any[]).map((p: any) => (
                <div key={p.id} className="flex items-start justify-between p-3 rounded-xl border border-[#E6E8F5] bg-gray-50/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#111827]">{p.title}</p>
                      {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-[#4F46E5]"><ExternalLink size={12} /></a>}
                    </div>
                    {p.description && <p className="text-xs text-[#4B5563] mt-0.5 truncate">{p.description}</p>}
                    {(p.technologies ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(p.technologies as string[]).slice(0, 5).map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#EEF0FF', color: '#4F46E5' }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => deleteProjMutation.mutate(p.id)} className="text-[#9CA3AF] hover:text-red-500 transition-colors ml-2 flex-shrink-0"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            {showProjForm && (
              <div className="mt-3 p-4 rounded-xl border border-[#C7D2FE] space-y-3" style={{ background: '#F5F7FF' }}>
                <Input label="Project Title" value={newProj.title} onChange={e => setNewProj(p => ({ ...p, title: e.target.value }))} placeholder="e.g. PlacementPro" required />
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Description</label>
                  <textarea value={newProj.description} onChange={e => setNewProj(p => ({ ...p, description: e.target.value }))} rows={2}
                    placeholder="Brief project description…" className="w-full text-sm border border-[#E6E8F5] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] resize-none" />
                </div>
                <Input label="Technologies (comma-separated)" value={newProj.technologies} onChange={e => setNewProj(p => ({ ...p, technologies: e.target.value }))} placeholder="React, Node.js, Python" />
                <Input label="Project URL (optional)" value={newProj.url} onChange={e => setNewProj(p => ({ ...p, url: e.target.value }))} placeholder="https://github.com/..." />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => addProjMutation.mutate()} loading={addProjMutation.isPending} disabled={!newProj.title}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowProjForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#111827]">Certifications <span className="text-xs font-normal text-[#9CA3AF]">({(certs as any[]).length})</span></h3>
              <button onClick={() => setShowCertForm(f => !f)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
            {(certs as any[]).length === 0 && !showCertForm && <p className="text-xs text-[#9CA3AF]">No certifications added yet.</p>}
            <div className="space-y-2">
              {(certs as any[]).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E6E8F5] bg-gray-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#111827]">{c.name}</p>
                      {c.certificate_url && <a href={c.certificate_url} target="_blank" rel="noreferrer" className="text-[#4F46E5]"><ExternalLink size={12} /></a>}
                    </div>
                    <p className="text-xs text-[#9CA3AF]">{c.issuer ?? ''}{c.issue_date ? ` · ${new Date(c.issue_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : ''}</p>
                  </div>
                  <button onClick={() => deleteCertMutation.mutate(c.id)} className="text-[#9CA3AF] hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            {showCertForm && (
              <div className="mt-3 p-4 rounded-xl border border-[#C7D2FE] space-y-3" style={{ background: '#F5F7FF' }}>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Certificate Name" value={newCert.name} onChange={e => setNewCert(p => ({ ...p, name: e.target.value }))} placeholder="e.g. AWS Cloud Practitioner" required />
                  <Input label="Issuer" value={newCert.issuer} onChange={e => setNewCert(p => ({ ...p, issuer: e.target.value }))} placeholder="e.g. Amazon" />
                  <Input label="Issue Date" type="date" value={newCert.issue_date} onChange={e => setNewCert(p => ({ ...p, issue_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Upload Certificate (optional)</label>
                  <label className="flex items-center gap-2 text-xs text-[#4B5563] border border-[#E6E8F5] px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer w-fit">
                    <Upload size={13} /> {certUploading ? 'Uploading…' : 'Choose file'}
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleUploadCert} disabled={certUploading || !newCert.name} />
                  </label>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Or save without file:</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => addCertMutation.mutate()} loading={addCertMutation.isPending} disabled={!newCert.name}>Save Without File</Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowCertForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>

          {saved && (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#DCFCE7' }}>
              <CheckCircle size={16} style={{ color: '#16A34A' }} />
              <span className="text-sm font-medium" style={{ color: '#16A34A' }}>Profile saved successfully!</span>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={!student}>
              <Save size={15} className="mr-1" /> Save Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
