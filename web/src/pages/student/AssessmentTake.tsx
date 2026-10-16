import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  GraduationCap, Shield, Clock, AlertTriangle, CheckCircle,
  Info, Camera, Eye, EyeOff,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  getStudentByProfileId,
  getAssessmentWithQuestions,
  startAttempt,
  saveAnswer,
  submitAttempt,
  saveProctoringEvent,
} from '../../lib/queries'
import { calculateAndSaveReadiness } from '../../lib/readiness'
import { supabase } from '../../lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────

interface ProcEvent {
  id: string
  type: string
  message: string
  time: string
  severity: 'high' | 'medium' | 'low'
}

// ── Fallback questions (used when DB has no questions yet) ─────────────────

const FALLBACK_QUESTIONS = [
  { id:'fq1',  question:'Q1.  If a train travels 120 km in 2 hours, what is its average speed?',              option_a:'50 km/h',   option_b:'60 km/h',   option_c:'70 km/h',   option_d:'80 km/h',    correct_answer:'B' },
  { id:'fq2',  question:'Q2.  A man buys a TV for ₹15,000 and sells it for ₹18,000. Profit %?',              option_a:'15%',       option_b:'18%',       option_c:'20%',       option_d:'25%',        correct_answer:'C' },
  { id:'fq3',  question:'Q3.  If 8 workers complete a job in 12 days, how many days will 6 workers take?',   option_a:'14 days',   option_b:'16 days',   option_c:'18 days',   option_d:'20 days',    correct_answer:'B' },
  { id:'fq4',  question:'Q4.  Next in series: 2, 6, 12, 20, 30, ?',                                          option_a:'40',        option_b:'42',        option_c:'44',        option_d:'46',         correct_answer:'B' },
  { id:'fq5',  question:'Q5.  A pipe fills a tank in 4 h; another empties it in 6 h. Both open — full in?',  option_a:'8 h',       option_b:'10 h',      option_c:'12 h',      option_d:'14 h',       correct_answer:'C' },
  { id:'fq6',  question:'Q6.  Simple interest on ₹5,000 at 8% p.a. for 3 years?',                           option_a:'₹1,000',   option_b:'₹1,200',   option_c:'₹1,400',   option_d:'₹1,600',    correct_answer:'B' },
  { id:'fq7',  question:'Q7.  Shopkeeper gives 20% discount on ₹500. Selling price?',                        option_a:'₹350',     option_b:'₹380',     option_c:'₹400',     option_d:'₹420',      correct_answer:'C' },
  { id:'fq8',  question:'Q8.  In a class of 60 students, 40% are girls. How many boys are there?',           option_a:'24',        option_b:'32',        option_c:'36',        option_d:'40',         correct_answer:'C' },
  { id:'fq9',  question:'Q9.  Time complexity of binary search?',                                             option_a:'O(n)',      option_b:'O(n²)',    option_c:'O(log n)',  option_d:'O(1)',       correct_answer:'C' },
  { id:'fq10', question:'Q10. Two numbers are in ratio 3:5 and their sum is 96. The larger number is?',      option_a:'36',        option_b:'48',        option_c:'60',        option_d:'72',         correct_answer:'C' },
]

const TOTAL_SECONDS = 45 * 60

function formatTime(s: number): string {
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0)
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function getIndexLetter(idx: number): string {
  return ['A','B','C','D'][idx] ?? 'A'
}

// ── Component ──────────────────────────────────────────────────────────────

export function AssessmentTake() {
  const { id: assessmentId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user }  = useAuth()

  // Core state
  const [questions,         setQuestions]         = useState<any[]>([])
  const [attemptId,         setAttemptId]         = useState<string | null>(null)
  const [studentId,         setStudentId]         = useState<string | null>(null)
  const [currentQ,          setCurrentQ]          = useState(0)
  const [answers,           setAnswers]           = useState<Record<number, number>>({})
  const [timeLeft,          setTimeLeft]          = useState(TOTAL_SECONDS)
  const [submitting,        setSubmitting]        = useState(false)

  // Proctoring state
  const [events,            setEvents]            = useState<ProcEvent[]>([])
  const [highSevCount,      setHighSevCount]      = useState(0)
  const [faceCount,         setFaceCount]         = useState<number | null>(null)
  const [cameraPermission,  setCameraPermission]  = useState<'pending'|'granted'|'denied'>('pending')
  const [showConsent,       setShowConsent]       = useState(true)

  // Refs
  const videoRef          = useRef<HTMLVideoElement>(null)
  const canvasRef         = useRef<HTMLCanvasElement>(null)
  const streamRef         = useRef<MediaStream | null>(null)
  const frameIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const clearIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptIdRef      = useRef<string | null>(null)

  // Keep ref in sync so interval callbacks always see the latest attemptId
  useEffect(() => { attemptIdRef.current = attemptId }, [attemptId])

  // ── Load questions & start attempt ────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !assessmentId || showConsent) return
    const init = async () => {
      try {
        const student = await getStudentByProfileId(user.id)
        if (student?.id) setStudentId(student.id)
        const dbQ     = await getAssessmentWithQuestions(assessmentId)
        setQuestions(dbQ.length > 0 ? dbQ : FALLBACK_QUESTIONS)
        const attempt = await startAttempt(assessmentId, student?.id ?? '')
        if (attempt) setAttemptId(attempt.id)
      } catch {
        setQuestions(FALLBACK_QUESTIONS)
      }
    }
    init()
  }, [user?.id, assessmentId, showConsent])

  // ── Copy-paste / right-click prevention ────────────────────────────────────
  useEffect(() => {
    if (showConsent) return
    const block = (e: Event) => e.preventDefault()
    document.addEventListener('copy',        block)
    document.addEventListener('paste',       block)
    document.addEventListener('cut',         block)
    document.addEventListener('contextmenu', block)
    return () => {
      document.removeEventListener('copy',        block)
      document.removeEventListener('paste',       block)
      document.removeEventListener('cut',         block)
      document.removeEventListener('contextmenu', block)
    }
  }, [showConsent])

  // ── Tab-switch detection ───────────────────────────────────────────────────
  useEffect(() => {
    if (showConsent) return
    const onVisibility = () => {
      if (document.hidden) addEvent('tab_switch', 'Tab switch detected', 'medium', true)
    }
    const onBlur = () => addEvent('window_blur', 'Window lost focus', 'low', false)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConsent])

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (showConsent) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); handleSubmit(true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConsent])

  // ── Webcam frame analysis (every 5 s) ─────────────────────────────────────
  useEffect(() => {
    if (showConsent || cameraPermission !== 'granted') return

    frameIntervalRef.current = setInterval(async () => {
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || !video.srcObject) return

      canvas.width  = video.videoWidth  || 320
      canvas.height = video.videoHeight || 240
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(video, 0, 0)
      const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1]

      try {
        const aiUrl = (import.meta as any).env?.VITE_AI_SERVICE_URL ?? 'http://localhost:8000'
        const res   = await fetch(`${aiUrl}/api/proctor/analyze`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            attempt_id:   attemptIdRef.current ?? 'demo',
            frame_base64: base64,
            timestamp:    new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(4000),
        })
        if (!res.ok) return
        const result = await res.json()
        setFaceCount(result.face_count ?? null)
        if (result.flagged && result.event_type !== 'all_clear') {
          addEvent(result.event_type, result.message, result.severity, true)
        }
      } catch {
        // AI service offline — silently continue; camera still displays
      }
    }, 5000)

    // Periodic "all clear" heartbeat every 30 s
    clearIntervalRef.current = setInterval(() => {
      addEvent('all_clear', 'Proctoring clear', 'low', false)
    }, 30000)

    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
      if (clearIntervalRef.current) clearInterval(clearIntervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConsent, cameraPermission])

  // ── Event helper ───────────────────────────────────────────────────────────
  const addEvent = useCallback((
    type:     string,
    message:  string,
    severity: 'high' | 'medium' | 'low',
    saveToDB: boolean,
  ) => {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    const id   = Date.now().toString()
    setEvents(prev => [{ id, type, message, time, severity }, ...prev.slice(0, 14)])
    if (severity === 'high') setHighSevCount(c => c + 1)

    // Non-blocking DB save (skip all_clear and window_blur to reduce noise)
    if (saveToDB && attemptIdRef.current && type !== 'all_clear' && type !== 'window_blur') {
      saveProctoringEvent(attemptIdRef.current, type, severity).catch(() => {})
    }
  }, [])

  // ── Camera start ───────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraPermission('granted')
      setShowConsent(false)
      addEvent('all_clear', 'Proctoring started — camera active', 'low', false)
    } catch {
      setCameraPermission('denied')
      setShowConsent(false)
      addEvent('camera_denied', 'Camera denied — limited proctoring mode', 'medium', false)
    }
  }, [addEvent])

  // ── Answer selection ───────────────────────────────────────────────────────
  const handleSelectAnswer = async (qIdx: number, optIdx: number) => {
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }))
    const q = questions[qIdx]
    if (attemptId && q) {
      const letter = getIndexLetter(optIdx)
      await saveAnswer(attemptId, q.id, letter, letter === q.correct_answer).catch(() => {})
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (auto = false) => {
    if (submitting) return
    setSubmitting(true)
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
    if (clearIntervalRef.current) clearInterval(clearIntervalRef.current)

    if (attemptId && questions.length > 0) {
      let correct = 0
      questions.forEach((q, i) => {
        if (getIndexLetter(answers[i] ?? -1) === q.correct_answer) correct++
      })
      const score = Math.round((correct / questions.length) * 100)
      await submitAttempt(
        attemptId, score, score,
        auto ? 'auto_submitted' : 'submitted',
      ).catch(() => {})

      // Auto-calculate readiness score after submission (non-blocking)
      if (studentId) {
        try {
          const { data: studentRow } = await (supabase as any)
            .from('students')
            .select('id, profile_id, cgpa, tenth_percent, twelfth_percent, backlogs')
            .eq('id', studentId)
            .single()
          if (studentRow) {
            calculateAndSaveReadiness({
              studentId:      (studentRow as any).id,
              profileId:      (studentRow as any).profile_id,
              cgpa:           (studentRow as any).cgpa ?? 0,
              tenthPercent:   (studentRow as any).tenth_percent ?? 0,
              twelfthPercent: (studentRow as any).twelfth_percent ?? 0,
              backlogs:       (studentRow as any).backlogs ?? 0,
            }).catch(() => {})
          }
        } catch { /* non-blocking */ }
      }
    }
    navigate('/student/assessments')
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const q = questions[currentQ]

  function sevColor(s: string) {
    return s === 'high' ? '#EF4444' : s === 'medium' ? '#F59E0B' : '#16A34A'
  }
  function sevBg(s: string) {
    return s === 'high' ? '#FEF2F2' : s === 'medium' ? '#FFFBEB' : '#F0FFF4'
  }
  function SevIcon({ s }: { s: string }) {
    if (s === 'high')   return <AlertTriangle size={12} style={{ color: sevColor(s), flexShrink: 0 }} />
    if (s === 'medium') return <Info          size={12} style={{ color: sevColor(s), flexShrink: 0 }} />
    return               <CheckCircle  size={12} style={{ color: sevColor(s), flexShrink: 0 }} />
  }

  // ── Consent screen ─────────────────────────────────────────────────────────
  if (showConsent) return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'linear-gradient(135deg,#EEF1FF,#F7F8FF)' }}>
      <div className="bg-white rounded-[16px] shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#EEF0FF' }}>
            <Camera size={32} style={{ color: '#4F46E5' }} />
          </div>
        </div>
        <h2 className="text-lg font-bold text-[#111827] text-center mb-2">AI Proctoring Required</h2>
        <p className="text-sm text-[#4B5563] text-center mb-5 leading-relaxed">
          This exam uses AI-powered proctoring via your webcam to ensure integrity.
        </p>
        <ul className="text-sm text-[#4B5563] space-y-2 mb-5 text-left">
          <li className="flex items-center gap-2"><CheckCircle size={14} style={{ color: '#16A34A' }} /> Verifies only one person is visible</li>
          <li className="flex items-center gap-2"><CheckCircle size={14} style={{ color: '#16A34A' }} /> Monitors for suspicious activity</li>
          <li className="flex items-center gap-2"><Shield      size={14} style={{ color: '#4F46E5' }} /> Flags multiple faces, tab switches</li>
        </ul>
        <div className="p-3 rounded-lg text-xs text-[#4B5563] mb-5"
          style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <strong>⚠ Important:</strong> Copy-paste and right-click are disabled. Tab switching is logged.
        </div>
        <div className="space-y-2">
          <button onClick={startCamera}
            className="w-full py-3 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
            style={{ background: '#4F46E5' }}>
            Allow Camera &amp; Start Exam
          </button>
          <button onClick={() => { setCameraPermission('denied'); setShowConsent(false) }}
            className="w-full py-3 rounded-lg border border-[#E6E8F5] text-sm font-medium text-[#4B5563] hover:bg-gray-50">
            Proceed Without Camera (Limited Proctoring)
          </button>
        </div>
      </div>
    </div>
  )

  // ── Main exam UI ───────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden select-none"
      style={{ background: '#F8F9FF' }}
      onCopy={e => e.preventDefault()}
      onPaste={e => e.preventDefault()}
      onCut={e => e.preventDefault()}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Hidden canvas used for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Dark header ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ background: '#1E1B4B' }}>
        <div className="flex items-center gap-2.5">
          <GraduationCap size={22} className="text-white" />
          <span className="text-white font-bold text-sm">PlacementPro</span>
        </div>
        <div className="flex items-center gap-4">
          {highSevCount >= 3 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: '#FEE2E2', color: '#EF4444' }}>
              <AlertTriangle size={12} /> {highSevCount} violations flagged
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-medium">Secure Assessment</span>
          </div>
        </div>
      </header>

      {/* ── Proctoring banner ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-2.5 border-b flex-shrink-0"
        style={{ background: '#F0FFF4', borderColor: '#A7F3D0' }}>
        <Shield size={15} style={{ color: '#16A34A' }} />
        <p className="text-sm font-medium" style={{ color: '#166534' }}>
          Proctoring Active — AI monitoring is running. Copy-paste and right-click are disabled.
        </p>
      </div>

      {/* ── Assessment info bar ───────────────────────────────────────── */}
      <div className="px-6 py-3 bg-white border-b border-[#E6E8F5] flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
        <div>
          <h1 className="text-base font-bold text-[#111827]">Aptitude Test – Quantitative Section</h1>
          <p className="text-xs text-[#9CA3AF]">Question {currentQ + 1} of {questions.length}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border"
          style={{ background: '#FFF7ED', borderColor: '#FED7AA' }}>
          <Clock size={15} style={{ color: '#F59E0B' }} />
          <div>
            <p className="text-[10px] text-[#9CA3AF] font-medium">Time Remaining</p>
            <p className="text-lg font-bold font-mono"
              style={{ color: timeLeft < 300 ? '#EF4444' : '#F59E0B' }}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Question + navigation */}
          <div className="lg:col-span-2 space-y-4">

            {/* Question card */}
            {q ? (
              <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
                <p className="text-base font-medium text-[#111827] leading-relaxed mb-6">{q.question}</p>
                <div className="space-y-3">
                  {[q.option_a, q.option_b, q.option_c, q.option_d].map((opt: string, idx: number) => (
                    <label key={idx}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        answers[currentQ] === idx
                          ? 'border-[#4F46E5] bg-[#EEF0FF]'
                          : 'border-[#E6E8F5] hover:border-[#C7D2FE] hover:bg-gray-50'
                      }`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        answers[currentQ] === idx ? 'border-[#4F46E5]' : 'border-[#D1D5DB]'
                      }`}>
                        {answers[currentQ] === idx && (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#4F46E5' }} />
                        )}
                      </div>
                      <input type="radio" className="sr-only"
                        checked={answers[currentQ] === idx}
                        onChange={() => handleSelectAnswer(currentQ, idx)} />
                      <span className={`text-sm font-medium ${
                        answers[currentQ] === idx ? 'text-[#4F46E5]' : 'text-[#4B5563]'
                      }`}>
                        {String.fromCharCode(65 + idx)}. {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-[#9CA3AF] mt-3">Loading questions…</p>
              </div>
            )}

            {/* Question palette + Prev / Next / Submit */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setCurrentQ(c => Math.max(0, c - 1))}
                disabled={currentQ === 0}
                className="text-sm font-medium px-5 py-2.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] disabled:opacity-40 hover:bg-gray-50"
              >
                ← Previous
              </button>

              <div className="flex gap-1 flex-wrap justify-center max-w-xs">
                {questions.map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentQ(idx)}
                    className="w-8 h-8 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: idx === currentQ
                        ? '#4F46E5'
                        : answers[idx] !== undefined ? '#16A34A' : '#F3F4F6',
                      color: idx === currentQ || answers[idx] !== undefined ? 'white' : '#4B5563',
                    }}>
                    {idx + 1}
                  </button>
                ))}
              </div>

              {currentQ < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ(c => Math.min(questions.length - 1, c + 1))}
                  className="text-sm font-medium px-5 py-2.5 rounded-lg text-white"
                  style={{ background: '#4F46E5' }}>
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="text-sm font-medium px-5 py-2.5 rounded-lg text-white disabled:opacity-60"
                  style={{ background: '#16A34A' }}>
                  {submitting ? 'Submitting…' : 'Submit Exam ✓'}
                </button>
              )}
            </div>
          </div>

          {/* Right panel: webcam + event feed */}
          <div className="space-y-4">

            {/* Webcam preview */}
            <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    cameraPermission === 'granted' ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
                  }`} />
                  <span className="text-xs font-medium text-[#4B5563]">
                    {cameraPermission === 'granted' ? 'Camera Active' : 'No Camera'}
                  </span>
                </div>
                {faceCount !== null && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: faceCount === 1 ? '#DCFCE7' : '#FEE2E2',
                      color:      faceCount === 1 ? '#16A34A' : '#EF4444',
                    }}>
                    {faceCount === 0 ? '⚠ No face' : faceCount === 1 ? '1 face ✓' : `${faceCount} faces ⚠`}
                  </span>
                )}
              </div>

              <div className="rounded-xl overflow-hidden bg-gray-900 relative"
                style={{ aspectRatio: '4/3' }}>
                <video ref={videoRef} autoPlay muted playsInline
                  className="w-full h-full object-cover" />
                {cameraPermission !== 'granted' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <EyeOff size={24} className="text-gray-500 mb-2" />
                    <p className="text-xs text-gray-500">Camera not active</p>
                  </div>
                )}
                {highSevCount >= 3 && (
                  <div className="absolute top-2 left-2 right-2 bg-red-600 text-white text-[10px] font-bold rounded px-2 py-1 text-center">
                    ⚠ Session flagged — {highSevCount} violations
                  </div>
                )}
              </div>
            </div>

            {/* Proctoring event feed */}
            <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye size={14} style={{ color: '#4F46E5' }} />
                <h3 className="text-xs font-semibold text-[#111827] uppercase tracking-wide">
                  Proctoring Events
                </h3>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
                {events.length === 0 ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg"
                    style={{ background: '#F0FFF4' }}>
                    <CheckCircle size={12} style={{ color: '#16A34A' }} />
                    <p className="text-xs font-medium" style={{ color: '#16A34A' }}>No events yet</p>
                  </div>
                ) : events.map(evt => (
                  <div key={evt.id}
                    className="flex items-center gap-2 p-2 rounded-lg"
                    style={{ background: sevBg(evt.severity) }}>
                    <SevIcon s={evt.severity} />
                    <p className="text-xs font-medium flex-1 truncate"
                      style={{ color: sevColor(evt.severity) }}>
                      {evt.message}
                    </p>
                    <span className="text-[10px] font-medium flex-shrink-0"
                      style={{ color: sevColor(evt.severity) }}>
                      {evt.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
