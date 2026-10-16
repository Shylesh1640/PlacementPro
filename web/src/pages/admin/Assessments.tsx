import { useState } from 'react'
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

const ASSESSMENTS = [
  { id: '1', title: 'Aptitude Test – Quantitative Section', category: 'aptitude', duration: 60, totalMarks: 100, isActive: true, attempts: 245 },
  { id: '2', title: 'Programming Skills Assessment', category: 'programming', duration: 90, totalMarks: 100, isActive: true, attempts: 238 },
  { id: '3', title: 'Communication Skills Assessment', category: 'communication', duration: 60, totalMarks: 100, isActive: true, attempts: 240 },
]

export function AdminAssessments() {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827]">Assessments</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white"
          style={{ background: '#4F46E5' }}
        >
          <Plus size={16} /> Create Assessment
        </button>
      </div>

      <div className="space-y-4">
        {ASSESSMENTS.map(a => (
          <div key={a.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-5 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-[#111827]">{a.title}</h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                  style={{
                    background: a.category === 'aptitude' ? '#EEF0FF' : a.category === 'programming' ? '#F3E8FF' : '#DCFCE7',
                    color: a.category === 'aptitude' ? '#4F46E5' : a.category === 'programming' ? '#7C3AED' : '#16A34A',
                  }}
                >
                  {a.category}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#9CA3AF]">
                <span>{a.duration} min</span>
                <span>{a.totalMarks} marks</span>
                <span>{a.attempts} attempts</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="p-2 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50">
                <Edit size={15} />
              </button>
              <button className="p-2 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-red-50 hover:text-red-500 hover:border-red-200">
                <Trash2 size={15} />
              </button>
              {a.isActive
                ? <ToggleRight size={24} style={{ color: '#16A34A' }} className="cursor-pointer" />
                : <ToggleLeft size={24} className="text-gray-300 cursor-pointer" />
              }
            </div>
          </div>
        ))}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Assessment">
        <div className="space-y-4">
          <Input label="Assessment Title" placeholder="e.g. Aptitude Test – Quantitative Section" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (minutes)" type="number" defaultValue="60" />
            <Input label="Total Marks" type="number" defaultValue="100" />
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
