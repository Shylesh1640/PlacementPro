import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Plus, X, AlertCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { useAuth } from '../../contexts/AuthContext'
import { getCompanyByProfileId, createJob } from '../../lib/queries'
import { Link } from 'react-router-dom'

const SKILL_SUGGESTIONS = ['Python', 'Java', 'JavaScript', 'React', 'Machine Learning', 'Data Analysis', 'SQL', 'Node.js', 'TypeScript', 'DSA', 'System Design', 'C++', 'Go', 'Docker']

export function PostJob() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [minCgpa, setMinCgpa] = useState('7.0')
  const [maxBacklogs, setMaxBacklogs] = useState('0')
  const [location, setLocation] = useState('')
  const [workMode, setWorkMode] = useState('on-site')
  const [experienceLevel, setExperienceLevel] = useState('fresher')
  const [skills, setSkills] = useState<string[]>(['Python', 'ML'])
  const [newSkill, setNewSkill] = useState('')
  const [saved, setSaved] = useState(false)
  const [parsingJD, setParsingJD] = useState(false)
  const [jdParsed, setJdParsed] = useState(false)

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', user?.id],
    queryFn: () => getCompanyByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const handleParseJD = async () => {
    if (!description.trim()) return
    setParsingJD(true)
    setJdParsed(false)
    try {
      const aiUrl = (import.meta.env.VITE_AI_SERVICE_URL as string) ?? 'http://localhost:8000'
      const res = await fetch(`${aiUrl}/api/parse-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: description }),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error('Parse failed')
      const parsed = await res.json()
      if (parsed.title)                    setTitle(parsed.title)
      if (parsed.required_skills?.length)  setSkills((parsed.required_skills as string[]).slice(0, 10))
      if (parsed.min_cgpa)                 setMinCgpa(String(parsed.min_cgpa))
      if (parsed.location)                 setLocation(parsed.location)
      if (parsed.work_mode)                setWorkMode(parsed.work_mode)
      if (parsed.experience_level)         setExperienceLevel(parsed.experience_level)
      setJdParsed(true)
    } catch {
      // AI offline — silent fail
    } finally {
      setParsingJD(false)
    }
  }

  const addSkill = (s?: string) => {
    const skill = s ?? newSkill.trim()
    if (skill && !skills.includes(skill)) {
      setSkills(prev => [...prev, skill])
      setNewSkill('')
    }
  }
  const removeSkill = (s: string) => setSkills(prev => prev.filter(sk => sk !== s))

  const createMutation = useMutation({
    mutationFn: () => createJob(company!.id, {
      title,
      description,
      required_skills: skills,
      min_cgpa: parseFloat(minCgpa) || 0,
      max_backlogs: parseInt(maxBacklogs) || 0,
      location,
      work_mode: workMode,
      experience_level: experienceLevel,
      employment_type: 'full-time',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companyJobs', company?.id] })
      setTitle(''); setDescription(''); setSkills(['Python', 'ML'])
      setLocation(''); setMinCgpa('7.0'); setMaxBacklogs('0')
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    },
  })

  if (companyLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
    </div>
  )

  if (!company) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Post a New Job</h1>
      <div className="bg-white rounded-[12px] border border-[#FED7AA] shadow-sm p-8 text-center">
        <AlertCircle size={40} className="mx-auto mb-3" style={{ color: '#F59E0B' }} />
        <h3 className="font-semibold text-[#111827] mb-2">Company Profile Required</h3>
        <p className="text-sm text-[#4B5563] mb-4">Please set up your company profile before posting jobs. Your company will be verified by the admin.</p>
        <Link to="/partner/profile" className="text-sm font-medium px-4 py-2 rounded-lg text-white inline-block" style={{ background: '#4F46E5' }}>
          Set Up Company Profile
        </Link>
      </div>
    </div>
  )

  if (!company.verified) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Post a New Job</h1>
      <div className="bg-white rounded-[12px] border border-[#FED7AA] shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#FFF7ED' }}>
          <AlertCircle size={28} style={{ color: '#F59E0B' }} />
        </div>
        <h3 className="font-semibold text-[#111827] mb-2">Verification Pending</h3>
        <p className="text-sm text-[#4B5563]">Your company "{company.name}" is awaiting admin verification. You'll be able to post jobs once verified.</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#111827]">Post a New Job</h1>
        <span className="text-sm font-medium px-3 py-1.5 rounded-full" style={{ background: '#DCFCE7', color: '#16A34A' }}>
          <CheckCircle size={12} className="inline mr-1" />{company.name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Job Details */}
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 space-y-4">
          <h3 className="text-base font-semibold text-[#111827]">Job Details</h3>
          <Input label="Job Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Software Development Engineer" required />
          <Textarea label="Job Description" value={description} onChange={e => { setDescription(e.target.value); setJdParsed(false) }}
            placeholder="Paste the full job description here, then click ✨ to auto-fill requirements…" rows={5} required />
          <div className="space-y-1">
            <button
              type="button"
              onClick={handleParseJD}
              disabled={parsingJD || !description.trim()}
              className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border border-[#C7D2FE] disabled:opacity-50 transition-colors w-full justify-center"
              style={{ background: '#EEF0FF', color: '#4F46E5' }}
            >
              {parsingJD ? (
                <><div className="animate-spin w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full" /> Analyzing JD with AI…</>
              ) : (
                <>✨ Parse JD with AI — auto-fill requirements</>
              )}
            </button>
            {jdParsed && (
              <p className="text-xs font-medium text-center" style={{ color: '#16A34A' }}>
                ✓ Requirements auto-filled — review and adjust as needed
              </p>
            )}
          </div>
          {saved && (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#DCFCE7' }}>
              <CheckCircle size={16} style={{ color: '#16A34A' }} />
              <span className="text-sm font-medium" style={{ color: '#16A34A' }}>Job posted successfully!</span>
            </div>
          )}
          {createMutation.error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{(createMutation.error as Error).message}</p>
          )}
          <Button onClick={() => createMutation.mutate()} className="w-full" loading={createMutation.isPending}
            disabled={!title.trim() || !description.trim()} size="lg">
            Post Job
          </Button>
        </div>

        {/* Right: Requirements */}
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 space-y-5">
          <h3 className="text-base font-semibold text-[#111827]">Key Requirements</h3>

          {/* Skills */}
          <div>
            <label className="block text-xs font-medium text-[#4B5563] mb-2">Required Technical Skills</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map(s => (
                <span key={s} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: '#EEF0FF', color: '#4F46E5' }}>
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-500 transition-colors"><X size={11} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mb-2">
              <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill…" className="flex-1 text-sm border border-[#E6E8F5] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]" />
              <button type="button" onClick={() => addSkill()} className="text-sm px-3 py-1.5 rounded-lg text-white" style={{ background: '#4F46E5' }}>
                <Plus size={15} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 6).map(s => (
                <button key={s} type="button" onClick={() => addSkill(s)}
                  className="text-xs px-2 py-1 rounded-full border border-[#E6E8F5] text-[#9CA3AF] hover:border-indigo-300 hover:text-[#4F46E5] transition-colors">
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Minimum CGPA</label>
              <input type="number" value={minCgpa} onChange={e => setMinCgpa(e.target.value)} step="0.1" min="0" max="10"
                className="w-full border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Max Backlogs</label>
              <input type="number" value={maxBacklogs} onChange={e => setMaxBacklogs(e.target.value)} min="0"
                className="w-full border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Experience Level</label>
            <select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}
              className="w-full border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]">
              <option value="fresher">Fresher (0 years)</option>
              <option value="junior">Junior (0-2 years)</option>
              <option value="mid">Mid-level (2-5 years)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Location / Work Mode</label>
            <div className="flex gap-2">
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bangalore"
                className="flex-1 border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]" />
              <select value={workMode} onChange={e => setWorkMode(e.target.value)}
                className="border border-[#E6E8F5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]">
                <option value="on-site">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
