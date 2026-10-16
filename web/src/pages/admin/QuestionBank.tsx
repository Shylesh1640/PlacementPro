import { useState } from 'react'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'

const QUESTIONS = [
  { id: '1', question: 'If a train travels 120 km in 2 hours, what is its average speed?', topic: 'Speed & Distance', difficulty: 'easy', category: 'aptitude' },
  { id: '2', question: 'What is the time complexity of binary search?', topic: 'Algorithms', difficulty: 'easy', category: 'programming' },
  { id: '3', question: 'Which sentence is grammatically correct?', topic: 'Grammar', difficulty: 'easy', category: 'communication' },
  { id: '4', question: 'If 8 workers can complete a job in 12 days, how many days will 6 workers take?', topic: 'Work & Time', difficulty: 'medium', category: 'aptitude' },
]

const difficultyConfig: Record<string, { bg: string; color: string }> = {
  easy: { bg: '#DCFCE7', color: '#16A34A' },
  medium: { bg: '#FFF7ED', color: '#F59E0B' },
  hard: { bg: '#FEE2E2', color: '#EF4444' },
}

const categoryConfig: Record<string, { bg: string; color: string }> = {
  aptitude: { bg: '#EEF0FF', color: '#4F46E5' },
  programming: { bg: '#F3E8FF', color: '#7C3AED' },
  communication: { bg: '#DCFCE7', color: '#16A34A' },
}

export function QuestionBank() {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('all')

  const filtered = QUESTIONS.filter(q =>
    (filter === 'all' || q.category === filter) &&
    q.question.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#111827]">Question Bank</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white" style={{ background: '#4F46E5' }}>
          <Plus size={16} /> Add Question
        </button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions…" className="w-full pl-9 pr-4 py-2 text-sm border border-[#E6E8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="text-sm border border-[#E6E8F5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]">
          <option value="all">All Categories</option>
          <option value="aptitude">Aptitude</option>
          <option value="programming">Programming</option>
          <option value="communication">Communication</option>
        </select>
      </div>
      <div className="space-y-3">
        {filtered.map(q => {
          const dc = difficultyConfig[q.difficulty]
          const cc = categoryConfig[q.category]
          return (
            <div key={q.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111827] leading-snug">{q.question}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: cc.bg, color: cc.color }}>{q.category}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: dc.bg, color: dc.color }}>{q.difficulty}</span>
                  <span className="text-xs text-[#9CA3AF]">{q.topic}</span>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button className="p-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50"><Edit size={14} /></button>
                <button className="p-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-red-50 hover:text-red-500 hover:border-red-200"><Trash2 size={14} /></button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Question" size="xl">
        <div className="space-y-4">
          <Textarea label="Question" placeholder="Enter the question text…" required rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Option A" placeholder="Option A" required />
            <Input label="Option B" placeholder="Option B" required />
            <Input label="Option C" placeholder="Option C" required />
            <Input label="Option D" placeholder="Option D" required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Correct Answer" options={[{value:'A',label:'A'},{value:'B',label:'B'},{value:'C',label:'C'},{value:'D',label:'D'}]} required />
            <Select label="Category" options={[{value:'aptitude',label:'Aptitude'},{value:'programming',label:'Programming'},{value:'communication',label:'Communication'}]} required />
            <Select label="Difficulty" options={[{value:'easy',label:'Easy'},{value:'medium',label:'Medium'},{value:'hard',label:'Hard'}]} required />
          </div>
          <Input label="Topic" placeholder="e.g. Speed & Distance" required />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button>Save Question</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
