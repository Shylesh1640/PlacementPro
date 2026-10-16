import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Search, BookOpen } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'
import { getAllQuestions, createQuestion, deleteQuestion } from '../../lib/queries'

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

const DEMO_QUESTIONS = [
  { id: 'd1', question: 'If a train travels 120 km in 2 hours, what is its average speed?', topic: 'Speed & Distance', difficulty: 'easy', category: 'aptitude', correct_answer: 'B' },
  { id: 'd2', question: 'What is the time complexity of binary search?', topic: 'Algorithms', difficulty: 'easy', category: 'programming', correct_answer: 'C' },
  { id: 'd3', question: 'Which sentence is grammatically correct?', topic: 'Grammar', difficulty: 'easy', category: 'communication', correct_answer: 'B' },
  { id: 'd4', question: 'If 8 workers complete a job in 12 days, how many days will 6 workers take?', topic: 'Work & Time', difficulty: 'medium', category: 'aptitude', correct_answer: 'B' },
]

export function QuestionBank() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    question: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: 'A', category: 'aptitude', difficulty: 'easy', topic: '',
  })

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', categoryFilter, difficultyFilter],
    queryFn: () => getAllQuestions({
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
    }),
  })

  const createMutation = useMutation({
    mutationFn: () => createQuestion(form as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] })
      setShowCreate(false)
      setForm({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', category: 'aptitude', difficulty: 'easy', topic: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questions'] }),
  })

  const displayQuestions = questions.length > 0 ? questions : DEMO_QUESTIONS

  const filtered = displayQuestions.filter((q: any) =>
    q.question.toLowerCase().includes(search.toLowerCase()) ||
    q.topic?.toLowerCase().includes(search.toLowerCase())
  )

  const f = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Question Bank</h1>
          <p className="text-sm text-[#4B5563] mt-0.5">{filtered.length} questions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white" style={{ background: '#4F46E5' }}>
          <Plus size={16} /> Add Question
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E6E8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]" />
        </div>
        {[
          { value: categoryFilter, onChange: setCategoryFilter, options: [{ value: 'all', label: 'All Categories' }, { value: 'aptitude', label: 'Aptitude' }, { value: 'programming', label: 'Programming' }, { value: 'communication', label: 'Communication' }] },
          { value: difficultyFilter, onChange: setDifficultyFilter, options: [{ value: 'all', label: 'All Difficulties' }, { value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }] },
        ].map((sel, i) => (
          <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)}
            className="text-sm border border-[#E6E8F5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]">
            {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-12 text-center">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-[#9CA3AF]">No questions match your filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q: any) => {
            const dc = difficultyConfig[q.difficulty] ?? difficultyConfig.easy
            const cc = categoryConfig[q.category] ?? categoryConfig.aptitude
            return (
              <div key={q.id} className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111827] leading-snug">{q.question}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: cc.bg, color: cc.color }}>{q.category}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: dc.bg, color: dc.color }}>{q.difficulty}</span>
                    {q.topic && <span className="text-xs text-[#9CA3AF]">{q.topic}</span>}
                    <span className="text-xs text-[#9CA3AF]">Ans: {q.correct_answer}</span>
                  </div>
                </div>
                {!q.id.startsWith('d') && (
                  <button onClick={() => deleteMutation.mutate(q.id)}
                    className="p-1.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-red-50 hover:text-red-500 hover:border-red-200 flex-shrink-0 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Question" size="xl">
        <div className="space-y-4">
          <Textarea label="Question Text" value={form.question} onChange={e => f('question', e.target.value)} placeholder="Enter the full question…" required rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Option A" value={form.option_a} onChange={e => f('option_a', e.target.value)} placeholder="Option A" required />
            <Input label="Option B" value={form.option_b} onChange={e => f('option_b', e.target.value)} placeholder="Option B" required />
            <Input label="Option C" value={form.option_c} onChange={e => f('option_c', e.target.value)} placeholder="Option C" required />
            <Input label="Option D" value={form.option_d} onChange={e => f('option_d', e.target.value)} placeholder="Option D" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Correct Answer" value={form.correct_answer} onChange={e => f('correct_answer', e.target.value)}
              options={['A','B','C','D'].map(v => ({ value: v, label: `Option ${v}` }))} />
            <Select label="Category" value={form.category} onChange={e => f('category', e.target.value)}
              options={[{ value: 'aptitude', label: 'Aptitude' }, { value: 'programming', label: 'Programming' }, { value: 'communication', label: 'Communication' }]} />
            <Select label="Difficulty" value={form.difficulty} onChange={e => f('difficulty', e.target.value)}
              options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} />
            <Input label="Topic" value={form.topic} onChange={e => f('topic', e.target.value)} placeholder="e.g. Speed & Distance" required />
          </div>
          {createMutation.error && <p className="text-sm text-red-600">{(createMutation.error as Error).message}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending}
              disabled={!form.question || !form.option_a || !form.option_b || !form.option_c || !form.option_d || !form.topic}>
              Save Question
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
