import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Upload, Plus, Trash2 } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export function StudentProfile() {
  const { user } = useAuth()
  const [skills, setSkills] = useState(['Python', 'Java', 'React', 'DSA', 'Machine Learning'])
  const [newSkill, setNewSkill] = useState('')
  const [saving, setSaving] = useState(false)

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (s: string) => setSkills(skills.filter(sk => sk !== s))

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-3" style={{ background: '#4F46E5' }}>
            {user?.full_name?.[0] ?? 'S'}
          </div>
          <p className="text-base font-semibold text-[#111827]">{user?.full_name ?? 'Student'}</p>
          <p className="text-sm text-[#9CA3AF]">{user?.email}</p>
          <div className="mt-4 px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#EEF0FF', color: '#4F46E5' }}>
            Student
          </div>
          <button className="mt-5 flex items-center gap-2 text-xs text-[#4B5563] border border-[#E6E8F5] px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload size={13} /> Upload Resume
          </button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">Academic Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" defaultValue={user?.full_name ?? ''} placeholder="Your full name" />
              <Input label="Student ID" defaultValue="CS2021001" placeholder="e.g. CS2021001" />
              <Input label="Department" defaultValue="Computer Science" placeholder="Your department" />
              <Input label="CGPA" type="number" step="0.01" min="0" max="10" defaultValue="8.5" placeholder="0.00 – 10.00" />
              <Input label="10th %" type="number" step="0.01" defaultValue="92" placeholder="e.g. 92.5" />
              <Input label="12th %" type="number" step="0.01" defaultValue="88" placeholder="e.g. 88.0" />
              <Input label="Active Backlogs" type="number" defaultValue="0" placeholder="Number of backlogs" />
              <Input label="Phone" type="tel" defaultValue="+91 98765 43210" placeholder="+91 ..." />
            </div>
          </div>

          <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">Technical Skills</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map(s => (
                <span key={s} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: '#EEF0FF', color: '#4F46E5' }}>
                  {s}
                  <button onClick={() => removeSkill(s)} className="hover:text-red-500 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                placeholder="Add a skill…"
                className="flex-1 text-sm border border-[#E6E8F5] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
              <button
                onClick={addSkill}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg text-white"
                style={{ background: '#4F46E5' }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving}>Save Profile</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
