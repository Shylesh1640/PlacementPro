import { useState } from 'react'
import { CheckCircle, Plus, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'

const SKILL_SUGGESTIONS = ['Python', 'Java', 'JavaScript', 'React', 'Machine Learning', 'Data Analysis', 'SQL', 'Node.js', 'TypeScript', 'DSA', 'System Design', 'C++']

export function PostJob() {
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [description, setDescription] = useState('')
  const [minCgpa, setMinCgpa] = useState('7.0')
  const [experienceLevel, setExperienceLevel] = useState('fresher')
  const [location, setLocation] = useState('')
  const [workMode, setWorkMode] = useState('on-site')
  const [skills, setSkills] = useState<string[]>(['Python', 'ML'])
  const [newSkill, setNewSkill] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const addSkill = (s?: string) => {
    const skill = s ?? newSkill.trim()
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill])
      setNewSkill('')
    }
  }

  const removeSkill = (s: string) => setSkills(skills.filter(sk => sk !== s))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Post a New Job</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Job Details */}
          <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#111827]">Post a New Job</h3>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Software Development Engineer"
                required
                className="w-full border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                Company <span className="text-red-500">*</span>
              </label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g., Google"
                required
                className="w-full border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the role, required skills and responsibilities…"
                required
                rows={5}
                className="w-full border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] resize-none"
              />
            </div>
            {saved && (
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#DCFCE7' }}>
                <CheckCircle size={16} style={{ color: '#16A34A' }} />
                <span className="text-sm font-medium" style={{ color: '#16A34A' }}>Job posted successfully!</span>
              </div>
            )}
            <Button type="submit" className="w-full" loading={saving} size="lg">Post Job</Button>
          </div>

          {/* Right: Key Requirements */}
          <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 space-y-5">
            <h3 className="text-base font-semibold text-[#111827]">Key Requirements</h3>

            {/* Technical Skills */}
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-2">Technical Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map(s => (
                  <span
                    key={s}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer"
                    style={{ background: '#EEF0FF', color: '#4F46E5' }}
                  >
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-500 transition-colors">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill…"
                  className="flex-1 text-sm border border-[#E6E8F5] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
                <button type="button" onClick={() => addSkill()} className="text-sm px-3 py-1.5 rounded-lg text-white" style={{ background: '#4F46E5' }}>
                  <Plus size={15} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 5).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSkill(s)}
                    className="text-xs px-2 py-1 rounded-full border border-[#E6E8F5] text-[#9CA3AF] hover:border-indigo-300 hover:text-[#4F46E5] transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum CGPA */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#4B5563] mb-2">
                <div className="w-4 h-4 rounded border-2 flex items-center justify-center" style={{ borderColor: '#4F46E5', background: '#4F46E5' }}>
                  <CheckCircle size={10} className="text-white" />
                </div>
                Minimum CGPA
              </label>
              <input
                type="number"
                value={minCgpa}
                onChange={e => setMinCgpa(e.target.value)}
                step="0.1"
                min="0"
                max="10"
                className="w-32 border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
            </div>

            {/* Experience Level */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#4B5563] mb-2">
                <div className="w-4 h-4 rounded border-2 flex items-center justify-center" style={{ borderColor: '#4F46E5', background: '#4F46E5' }}>
                  <CheckCircle size={10} className="text-white" />
                </div>
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={e => setExperienceLevel(e.target.value)}
                className="border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              >
                <option value="fresher">Fresher (0 years)</option>
                <option value="junior">Junior (0-2 years)</option>
                <option value="mid">Mid-level (2-5 years)</option>
              </select>
            </div>

            {/* Location / Work Mode */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#4B5563] mb-2">
                <div className="w-4 h-4 rounded border-2 flex items-center justify-center" style={{ borderColor: '#4F46E5', background: '#4F46E5' }}>
                  <CheckCircle size={10} className="text-white" />
                </div>
                Location / Work Mode
              </label>
              <div className="flex gap-2">
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Bangalore"
                  className="flex-1 border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
                <select
                  value={workMode}
                  onChange={e => setWorkMode(e.target.value)}
                  className="border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                >
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
