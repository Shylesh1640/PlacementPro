import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ToggleLeft, ToggleRight, Users, Edit, BookOpen, X } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import {
  getAllAssessmentsAdmin, createAssessment, toggleAssessmentActive,
  deleteAssessment, updateAssessment,
  getAssessmentQuestionIds, addQuestionToAssessment, removeQuestionFromAssessment,
  getAllQuestions,
} from '../../lib/queries'
import { supabase } from '../../lib/supabase'

const categoryConfig: Record<string, { bg: string; color: string }> = {
  aptitude:      { bg: '#EEF0FF', color: '#4F46E5' },
  programming:   { bg: '#F3E8FF', color: '#7C3AED' },
  communication: { bg: '#DCFCE7', color: '#16A34A' },
}

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics',
  'Electrical Engineering', 'Mechanical', 'Civil', 'Chemical',
]

const BLANK_FORM = { title: '', description: '', category: 'aptitude', duration_minutes: 60, total_marks: 100, pass_marks: 40 }

export function AdminAssessments() {
  const qc = useQueryClient()

  // Create state
  const [showCreate,    setShowCreate]    = useState(false)
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [form,          setForm]          = useState({ ...BLANK_FORM })

  // Edit state
  const [editItem,      setEditItem]      = useState<any | null>(null)
  const [editForm,      setEditForm]      = useState({ ...BLANK_FORM })
  const [editDepts,     setEditDepts]     = useState<string[]>([])
  // Question management
  const [qAssessment,   setQAssessment]   = useState<any | null>(null)
  const [qSearch,       setQSearch]       = useState('')

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['adminAssessments'],
    queryFn: getAllAssessmentsAdmin,
  })

  const { data: attemptCounts = {} } = useQuery({
    queryKey: ['attemptCounts'],
    queryFn: async () => {
      const { data } = await supabase.from('assessment_attempts').select('assessment_id')
      if (!data) return {}
      const counts: Record<string, number> = {}
      data.forEach((r: any) => { counts[r.assessment_id] = (counts[r.assessment_id] ?? 0) + 1 })
      return counts
    },
  })

  const createMutation = useMutation({
    mutationFn: () => createAssessment({ ...form, eligible_departments: selectedDepts }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminAssessments'] })
      setShowCreate(false); setSelectedDepts([]); setForm({ ...BLANK_FORM })
    },
  })

  const editMutation = useMutation({
    mutationFn: () => updateAssessment(editItem!.id, {
      title:               editForm.title,
      description:         editForm.description,
      duration_minutes:    editForm.duration_minutes,
      total_marks:         editForm.total_marks,
      pass_marks:          editForm.pass_marks,
      eligible_departments:editDepts,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminAssessments'] })
      setEditItem(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleAssessmentActive(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminAssessments'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAssessment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminAssessments'] }),
  })

  // Question management queries
  const { data: assignedQIds = [] } = useQuery({
    queryKey: ['assessmentQIds', qAssessment?.id],
    queryFn: () => getAssessmentQuestionIds(qAssessment!.id),
    enabled: !!qAssessment?.id,
  })
  const { data: allQuestions = [] } = useQuery({
    queryKey: ['allQForAssign'],
    queryFn: () => getAllQuestions(),
    enabled: !!qAssessment,
  })
  const addQMutation = useMutation({
    mutationFn: ({ qid }: { qid: string }) =>
      addQuestionToAssessment(qAssessment!.id, qid, (assignedQIds as any[]).length + 1),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessmentQIds', qAssessment?.id] }),
  })
  const removeQMutation = useMutation({
    mutationFn: ({ qid }: { qid: string }) => removeQuestionFromAssessment(qAssessment!.id, qid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessmentQIds', qAssessment?.id] }),
  })
  const assignedIdSet = new Set((assignedQIds as any[]).map((r: any) => r.question_id))
  const filteredQs = (allQuestions as any[]).filter((q: any) =>
    !qSearch || q.question.toLowerCase().includes(qSearch.toLowerCase()) || q.topic?.toLowerCase().includes(qSearch.toLowerCase())
  )

  const openEdit = (a: any) => {
    setEditItem(a)
    setEditForm({
      title:            a.title,
      description:      a.description ?? '',
      category:         a.category,
      duration_minutes: a.duration_minutes,
      total_marks:      a.total_marks,
      pass_marks:       a.pass_marks,
    })
    setEditDepts(a.eligible_departments ?? [])
  }

  const DeptGrid = ({
    selected, onChange,
  }: { selected: string[]; onChange: (v: string[]) => void }) => (
    <div>
      <label className="block text-xs font-medium text-[#4B5563] mb-2">
        Eligible Departments <span className="text-[#9CA3AF] font-normal">(leave empty for all)</span>
      </label>
      <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-[#E6E8F5] bg-gray-50/50">
        {DEPARTMENTS.map(dept => (
          <label key={dept} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(dept)}
              onChange={e => {
                if (e.target.checked) onChange([...selected, dept])
                else onChange(selected.filter(d => d !== dept))
              }}
              className="accent-[#4F46E5]"
            />
            <span className="text-sm text-[#4B5563]">{dept}</span>
          </label>
        ))}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-[#9CA3AF] mt-1.5">✓ All departments will see this assessment</p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827]">Assessments</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white" style={{ background: '#4F46E5' }}>
          <Plus size={16} /> Create Assessment
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-12 text-center">
          <p className="text-[#9CA3AF] mb-4">No assessments yet.</p>
          <button onClick={() => setShowCreate(true)} className="text-sm font-medium px-4 py-2 rounded-lg text-white" style={{ background: '#4F46E5' }}>
            <Plus size={14} className="inline mr-1" /> Create Assessment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((a: any) => {
            const cc = categoryConfig[a.category] ?? categoryConfig.aptitude
            return (
              <div key={a.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-[#111827]">{a.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: cc.bg, color: cc.color }}>{a.category}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#9CA3AF] flex-wrap">
                    <span>{a.duration_minutes} min</span>
                    <span>{a.total_marks} marks</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {(attemptCounts as Record<string,number>)[a.id] ?? 0} attempts</span>
                    <span>{a.is_active ? '🟢 Active' : '🔴 Inactive'}</span>
                    <span>{(a.eligible_departments ?? []).length === 0 ? '🏫 All departments' : `🏫 ${(a.eligible_departments as string[]).join(', ')}`}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setQAssessment(a); setQSearch('') }}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-[#EEF0FF] hover:text-[#4F46E5] hover:border-[#C7D2FE] transition-colors"
                    title="Manage Questions"
                  >
                    <BookOpen size={13} /> Questions
                  </button>
                  <button onClick={() => openEdit(a)} className="p-2 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-[#EEF0FF] hover:text-[#4F46E5] hover:border-[#C7D2FE] transition-colors" title="Edit">
                    <Edit size={15} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(a.id)} disabled={deleteMutation.isPending} className="p-2 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50" title="Delete">
                    <Trash2 size={15} />
                  </button>
                  <button onClick={() => toggleMutation.mutate({ id: a.id, isActive: !a.is_active })} disabled={toggleMutation.isPending} title={a.is_active ? 'Deactivate' : 'Activate'}>
                    {a.is_active
                      ? <ToggleRight size={26} style={{ color: '#16A34A' }} className="cursor-pointer" />
                      : <ToggleLeft  size={26} className="text-gray-300 cursor-pointer" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Assessment">
        <div className="space-y-4">
          <Input label="Assessment Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Aptitude Test – Quantitative Section" required />
          <Input label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
          <Select label="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            options={[{ value: 'aptitude', label: 'Aptitude' }, { value: 'programming', label: 'Programming' }, { value: 'communication', label: 'Communication' }]} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Duration (min)" type="number" value={String(form.duration_minutes)} onChange={e => setForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))} />
            <Input label="Total Marks"    type="number" value={String(form.total_marks)}       onChange={e => setForm(p => ({ ...p, total_marks: Number(e.target.value) }))} />
            <Input label="Pass Marks"     type="number" value={String(form.pass_marks)}        onChange={e => setForm(p => ({ ...p, pass_marks: Number(e.target.value) }))} />
          </div>
          <DeptGrid selected={selectedDepts} onChange={setSelectedDepts} />
          {createMutation.error && <p className="text-sm text-red-600">{(createMutation.error as Error).message}</p>}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!form.title}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Assessment">
        <div className="space-y-4">
          <Input label="Assessment Title" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} required />
          <Input label="Description" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Duration (min)" type="number" value={String(editForm.duration_minutes)} onChange={e => setEditForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))} />
            <Input label="Total Marks"    type="number" value={String(editForm.total_marks)}       onChange={e => setEditForm(p => ({ ...p, total_marks: Number(e.target.value) }))} />
            <Input label="Pass Marks"     type="number" value={String(editForm.pass_marks)}        onChange={e => setEditForm(p => ({ ...p, pass_marks: Number(e.target.value) }))} />
          </div>
          <DeptGrid selected={editDepts} onChange={setEditDepts} />
          {editMutation.error && <p className="text-sm text-red-600">{(editMutation.error as Error).message}</p>}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={() => editMutation.mutate()} loading={editMutation.isPending} disabled={!editForm.title}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
