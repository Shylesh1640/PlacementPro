import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Plus, Trash2, Save, CheckCircle } from 'lucide-react'
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
    student_id: '',
    department: '',
    cgpa: '',
    tenth_percent: '',
    twelfth_percent: '',
    backlogs: '0',
    contact_phone: '',
  })

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
      student_id: form.student_id,
      department: form.department,
      cgpa: parseFloat(form.cgpa) || 0,
      tenth_percent: parseFloat(form.tenth_percent) || 0,
      twelfth_percent: parseFloat(form.twelfth_percent) || 0,
      backlogs: parseInt(form.backlogs) || 0,
      contact_phone: form.contact_phone,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', user?.id] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const addSkillMutation = useMutation({
    mutationFn: (skillName: string) => upsertStudentSkill(student!.id, skillName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills', student?.id] })
      setNewSkill('')
    },
  })

  const removeSkillMutation = useMutation({
    mutationFn: (skillId: string) => deleteStudentSkill(student!.id, skillId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills', student?.id] }),
  })

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !student) return
    setUploading(true)
    try {
      const path = `${student.id}/${file.name}`
      const { error } = await supabase.storage.from('resumes').upload(path, file, { upsert: true })
      if (!error) {
        const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(path)
        await updateStudent(student.id, { resume_url: urlData.publicUrl })
        qc.invalidateQueries({ queryKey: ['student', user?.id] })
      }
    } finally {
      setUploading(false)
    }
  }

  const handleParseResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !student) return

    // Upload first
    setUploading(true)
    try {
      const path = `${student.id}/${file.name}`
      const { data: urlData } = await supabase.storage.from('resumes').upload(path, file, { upsert: true })
        .then(async () => {
          return { data: supabase.storage.from('resumes').getPublicUrl(path).data }
        })
      if (urlData?.publicUrl) {
        await updateStudent(student.id, { resume_url: urlData.publicUrl })
        qc.invalidateQueries({ queryKey: ['student', user?.id] })
      }
    } catch { /* upload failure is non-blocking */ }
    finally { setUploading(false) }

    // Parse with AI
    setParsing(true)
    setParsedFields([])
    try {
      const text = await file.text().catch(() => '')
      if (!text.trim()) { setParsing(false); return }

      const aiUrl = (import.meta.env.VITE_AI_SERVICE_URL as string) ?? 'http://localhost:8000'
      const res = await fetch(`${aiUrl}/api/parse-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: text, filename: file.name }),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error(`Parse failed: ${res.status}`)
      const parsed = await res.json()

      const filled: string[] = []
      setForm(prev => {
        const u = { ...prev }
        if (parsed.department && !prev.department) { u.department = parsed.department; filled.push('Department') }
        if (parsed.cgpa)            { u.cgpa = String(parsed.cgpa);                    filled.push('CGPA') }
        if (parsed.tenth_percent)   { u.tenth_percent = String(parsed.tenth_percent);  filled.push('10th %') }
        if (parsed.twelfth_percent) { u.twelfth_percent = String(parsed.twelfth_percent); filled.push('12th %') }
        if (parsed.phone && !prev.contact_phone) { u.contact_phone = parsed.phone;    filled.push('Phone') }
        return u
      })
      setSynced(false)

      if (parsed.skills?.length > 0) {
        for (const sk of (parsed.skills as string[]).slice(0, 15)) {
          await upsertStudentSkill(student.id, sk).catch(() => {})
        }
        qc.invalidateQueries({ queryKey: ['skills', student?.id] })
        filled.push('Skills')
      }
      setParsedFields(filled)
    } catch {
      // AI offline — upload already succeeded
    } finally {
      setParsing(false)
    }
  }

  const fields = [
    { label: 'Full Name', readonly: true, value: user?.full_name ?? '', placeholder: 'Your full name' },
    { label: 'Student ID', key: 'student_id', placeholder: 'e.g. CS2021001' },
    { label: 'Department', key: 'department', placeholder: 'e.g. Computer Science' },
    { label: 'CGPA', key: 'cgpa', placeholder: '0.00 – 10.00', type: 'number', step: '0.01', min: '0', max: '10' },
    { label: '10th %', key: 'tenth_percent', placeholder: 'e.g. 92.5', type: 'number', step: '0.1' },
    { label: '12th %', key: 'twelfth_percent', placeholder: 'e.g. 88.0', type: 'number', step: '0.1' },
    { label: 'Active Backlogs', key: 'backlogs', placeholder: '0', type: 'number', min: '0' },
    { label: 'Phone', key: 'contact_phone', placeholder: '+91 ...' },
  ] as any[]

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">My Profile</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-3" style={{ background: '#4F46E5' }}>
            {user?.full_name?.[0]?.toUpperCase() ?? 'S'}
          </div>
          <p className="text-base font-semibold text-[#111827]">{user?.full_name}</p>
          <p className="text-sm text-[#9CA3AF]">{user?.email}</p>
          <span className="mt-3 text-xs px-3 py-1 rounded-full font-medium" style={{ background: '#EEF0FF', color: '#4F46E5' }}>Student</span>
          {student?.resume_url && (
            <a href={student.resume_url} target="_blank" rel="noreferrer" className="mt-3 text-xs underline" style={{ color: '#4F46E5' }}>View Resume</a>
          )}
          <label className="mt-4 flex items-center gap-2 text-xs text-[#4B5563] border border-[#E6E8F5] px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <Upload size={13} /> {uploading ? 'Uploading…' : 'Upload Resume'}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUploadResume} />
          </label>

          {parsedFields.length > 0 && (
            <div className="mt-3 p-3 rounded-lg border border-[#A7F3D0] text-xs" style={{ background: '#F0FFF4' }}>
              <p className="font-medium" style={{ color: '#16A34A' }}>
                ✓ Auto-filled from resume: {parsedFields.join(', ')}
              </p>
              <p className="text-[#4B5563] mt-0.5">Review the values and click Save Profile.</p>
            </div>
          )}

          <label
            className="mt-3 flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-lg cursor-pointer transition-colors"
            style={{ background: parsing ? '#9CA3AF' : '#4F46E5', color: 'white', opacity: parsing ? 0.7 : 1 }}
          >
            {parsing ? (
              <><div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> Parsing with AI…</>
            ) : (
              <><Upload size={13} /> Upload &amp; Parse Resume with AI</>
            )}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={handleParseResume}
              disabled={parsing || !student}
            />
          </label>
          <p className="text-[10px] text-[#9CA3AF] text-center mt-1">
            Uses Groq AI (free) to auto-fill your profile fields
          </p>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">Academic Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(f => (
                <Input
                  key={f.label}
                  label={f.label}
                  type={f.type ?? 'text'}
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  placeholder={f.placeholder}
                  readOnly={f.readonly}
                  value={f.readonly ? f.value : (form as any)[f.key] ?? ''}
                  onChange={e => {
                    if (!f.readonly && f.key) setForm((p: any) => ({ ...p, [f.key]: e.target.value }))
                  }}
                />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">Technical Skills</h3>
            <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
              {(skills as any[]).length === 0 && <p className="text-xs text-[#9CA3AF]">No skills added yet.</p>}
              {(skills as any[]).map(ss => (
                <span key={ss.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: '#EEF0FF', color: '#4F46E5' }}>
                  {ss.skills?.name ?? 'Skill'}
                  <button onClick={() => removeSkillMutation.mutate(ss.skill_id)} className="hover:text-red-500 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && newSkill.trim() && addSkillMutation.mutate(newSkill.trim())}
                placeholder="Add a skill and press Enter…"
                className="flex-1 text-sm border border-[#E6E8F5] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
              <button
                onClick={() => newSkill.trim() && addSkillMutation.mutate(newSkill.trim())}
                disabled={addSkillMutation.isPending || !newSkill.trim()}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{ background: '#4F46E5' }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {saved && (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#DCFCE7' }}>
              <CheckCircle size={16} style={{ color: '#16A34A' }} />
              <span className="text-sm font-medium" style={{ color: '#16A34A' }}>Profile saved successfully!</span>
            </div>
          )}

          {saveMutation.isError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              Failed to save: {(saveMutation.error as any)?.message}
            </p>
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
