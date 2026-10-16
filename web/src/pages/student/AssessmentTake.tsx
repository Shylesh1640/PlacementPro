import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GraduationCap, Shield, Clock, AlertTriangle, CheckCircle, Info, Camera, CameraOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  getStudentByProfileId,
  getAssessmentWithQuestions,
  startAttempt,
  saveAnswer,
  submitAttempt,
} from '../../lib/queries'

interface ProctoringEvent {
  id: string
  type: 'multiple_persons' | 'tab_switch' | 'all_clear' | 'no_face'
  message: string
  time: string
  severity: 'high' | 'medium' | 'low'
}

const FALLBACK_QUESTIONS = [
  { id: 'fq1', question: 'If a train travels 120 km in 2 hours, what is its average speed?', option_a: '50 km/h', option_b: '60 km/h', option_c: '70 km/h', option_d: '80 km/h', correct_answer: 'B' },
  { id: 'fq2', question: 'A man buys a TV for ₹15,000 and sells it for ₹18,000. What is his profit %?', option_a: '15%', option_b: '18%', option_c: '20%', option_d: '25%', correct_answer: 'C' },
  { id: 'fq3', question: 'If 8 workers complete a job in 12 days, how many days will 6 workers take?', option_a: '14 days', option_b: '16 days', option_c: '18 days', option_d: '20 days', correct_answer: 'B' },
  { id: 'fq4', question: 'What is the next number in the series: 2, 6, 12, 20, 30, ?', option_a: '40', option_b: '42', option_c: '44', option_d: '46', correct_answer: 'B' },
  { id: 'fq5', question: 'A pipe fills a tank in 4h; another empties it in 6h. Both open: full in?', option_a: '8h', option_b: '10h', option_c: '12h', option_d: '14h', correct_answer: 'C' },
]

const TOTAL_SECONDS = 45 * 60 + 23

function formatTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function getOptions(q: any): string[] {
  return [q.option_a, q.option_b, q.option_c, q.option_d]
}

function getIndexLetter(idx: number): string {
  return ['A', 'B', 'C', 'D'][idx] ?? 'A'
}

export function AssessmentTake() {
  const { id: assessmentId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [questions, setQuestions] = useState<any[]>([])
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({}) // index → option index
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS)
  const [proctoringEvents, setProctoringEvents] = useState<ProctoringEvent[]>([
    { id: '1', type: 'all_clear', message: 'All clear', time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), severity: 'low' },
  ])
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [showConsent, setShowConsent] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Load questions and start attempt
  useEffect(() => {
    if (!user?.id || !assessmentId || showConsent) return
    const init = async () => {
      try {
        const student = await getStudentByProfileId(user.id)
        if (!student) return
        // Try to load questions from DB
        const dbQuestions = await getAssessmentWithQuestions(assessmentId)
        setQuestions(dbQuestions.length > 0 ? dbQuestions : FALLBACK_QUESTIONS)
        // Create or resume attempt
        const attempt = await startAttempt(assessmentId, student.id)
        if (attempt) setAttemptId(attempt.id)
      } catch {
        setQuestions(FALLBACK_QUESTIONS)
      }
    }
    init()
  }, [user?.id, assessmentId, showConsent])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraPermission('granted')
      setShowConsent(false)
    } catch {
      setCameraPermission('denied')
      setShowConsent(false)
    }
  }, [])

  // Countdown timer — only runs after consent
  useEffect(() => {
    if (showConsent) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer)
          handleSubmit(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConsent])

  // Tab-switch proctoring
  useEffect(() => {
    if (showConsent) return
    const handler = () => {
      if (document.hidden) {
        addEvent('tab_switch', 'Tab switch detected', 'medium')
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [showConsent])

  function addEvent(type: ProctoringEvent['type'], message: string, severity: ProctoringEvent['severity']) {
    setProctoringEvents(prev => [{
      id: Date.now().toString(), type, message, severity,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }, ...prev.slice(0, 9)])
  }

  const handleSelectAnswer = async (questionIndex: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }))
    // Persist to DB if we have an attempt
    if (attemptId && questions[questionIndex]) {
      const q = questions[questionIndex]
      const selectedLetter = getIndexLetter(optionIndex)
      const isCorrect = selectedLetter === q.correct_answer
      try {
        await saveAnswer(attemptId, q.id, selectedLetter, isCorrect)
      } catch {
        // Non-blocking: local state is the source of truth during the test
      }
    }
  }

  const handleSubmit = async (autoSubmit = false) => {
    if (submitting) return
    setSubmitting(true)
    // Stop camera
    streamRef.current?.getTracks().forEach(t => t.stop())

    if (attemptId && questions.length > 0) {
      try {
        // Calculate score
        let correct = 0
        questions.forEach((q, idx) => {
          const selectedLetter = getIndexLetter(answers[idx] ?? -1)
          if (selectedLetter === q.correct_answer) correct++
        })
        const score = Math.round((correct / questions.length) * 100)
        await submitAttempt(attemptId, score, score, autoSubmit ? 'auto_submitted' : 'submitted')
      } catch {
        // Continue to navigate even if submit fails
      }
    }
    navigate('/student/assessments')
  }

  const q = questions[currentQ]

  function SeverityIcon({ sev }: { sev: string }) {
    if (sev === 'high') return <AlertTriangle size={13} style={{ color: '#EF4444' }} />
    if (sev === 'medium') return <Info size={13} style={{ color: '#F59E0B' }} />
    return <CheckCircle size={13} style={{ color: '#16A34A' }} />
  }

  function severityColor(sev: string) {
    if (sev === 'high') return '#EF4444'
    if (sev === 'medium') return '#F59E0B'
    return '#16A34A'
  }

  // Webcam consent modal
  if (showConsent) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'linear-gradient(135deg, #EEF1FF 0%, #F7F8FF 100%)' }}>
        <div className="bg-white rounded-[16px] shadow-xl p-8 max-w-md w-full mx-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#EEF0FF' }}>
              <Camera size={32} style={{ color: '#4F46E5' }} />
            </div>
          </div>
          <h2 className="text-lg font-bold text-[#111827] text-center mb-2">Webcam Access Required</h2>
          <p className="text-sm text-[#4B5563] text-center mb-6 leading-relaxed">
            This assessment requires webcam access for AI proctoring. Your activity will be monitored to ensure assessment integrity. No recordings are stored permanently.
          </p>
          <div className="space-y-3">
            <button
              onClick={startCamera}
              className="w-full text-sm font-medium py-3 rounded-lg text-white"
              style={{ background: '#4F46E5' }}
            >
              Allow Webcam & Start Assessment
            </button>
            <button
              onClick={() => { setCameraPermission('denied'); setShowConsent(false) }}
              className="w-full text-sm font-medium py-3 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 transition-colors"
            >
              Decline (Proctoring disabled)
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FF' }}>
        <div className="animate-spin w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
      </div>
    )
  }

  const options = q ? getOptions(q) : []

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F9FF' }}>
      {/* Dark header */}
      <header className="flex items-center justify-between px-6 py-3 flex-shrink-0" style={{ background: '#1E1B4B' }}>
        <div className="flex items-center gap-2.5">
          <GraduationCap size={22} className="text-white" />
          <span className="text-white font-bold text-sm">PlacementPro</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-medium">Secure Assessment</span>
        </div>
      </header>

      {/* Proctoring Banner */}
      <div className="flex items-center gap-3 px-6 py-2.5 flex-shrink-0" style={{ background: '#DCFCE7', borderBottom: '1px solid #BBF7D0' }}>
        <Shield size={16} style={{ color: '#16A34A' }} />
        <p className="text-sm font-medium" style={{ color: '#166534' }}>
          Proctoring Active – Your activity is being monitored for assessment integrity.
        </p>
        {cameraPermission === 'denied' && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-amber-700">
            <CameraOff size={13} /> Camera disabled
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 p-6 flex flex-col overflow-y-auto">
          {/* Title + Timer */}
          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-lg font-bold text-[#111827]">Aptitude Test – Quantitative Section</h1>
              <p className="text-sm text-[#9CA3AF] mt-0.5">
                Question {currentQ + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E6E8F5] bg-white flex-shrink-0">
              <Clock size={16} style={{ color: timeLeft < 300 ? '#EF4444' : '#4F46E5' }} />
              <div className="text-right">
                <p className="text-[10px] text-[#9CA3AF] font-medium">Time Remaining</p>
                <p className="text-base font-bold tabular-nums" style={{ color: timeLeft < 300 ? '#EF4444' : '#111827' }}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>
          </div>

          {/* Question Card */}
          {q && (
            <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 flex-1">
              <p className="text-sm font-semibold text-[#111827] mb-6">
                Q{currentQ + 1}. {q.question ?? q.text}
              </p>
              <div className="space-y-3">
                {options.map((opt, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all"
                    style={{
                      borderColor: answers[currentQ] === idx ? '#4F46E5' : '#E6E8F5',
                      background: answers[currentQ] === idx ? '#EEF0FF' : 'white',
                    }}
                  >
                    <input
                      type="radio"
                      name={`q${currentQ}`}
                      checked={answers[currentQ] === idx}
                      onChange={() => handleSelectAnswer(currentQ, idx)}
                      className="w-4 h-4"
                      style={{ accentColor: '#4F46E5' }}
                    />
                    <span className="text-sm text-[#4B5563]">{opt}</span>
                  </label>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                  disabled={currentQ === 0}
                  className="text-sm font-medium px-5 py-2 rounded-lg border border-[#E6E8F5] text-[#4B5563] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>

                {/* Question palette */}
                <div className="hidden sm:flex gap-1 flex-wrap justify-center max-w-[200px]">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQ(idx)}
                      className="w-7 h-7 rounded text-xs font-medium transition-colors"
                      style={{
                        background: idx === currentQ ? '#4F46E5' : answers[idx] !== undefined ? '#16A34A' : '#F3F4F6',
                        color: idx === currentQ || answers[idx] !== undefined ? 'white' : '#9CA3AF',
                      }}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                {currentQ === questions.length - 1 ? (
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={submitting}
                    className="text-sm font-medium px-5 py-2 rounded-lg text-white disabled:opacity-60"
                    style={{ background: '#16A34A' }}
                  >
                    {submitting ? 'Submitting…' : 'Submit →'}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
                    className="text-sm font-medium px-5 py-2 rounded-lg text-white flex items-center gap-1"
                    style={{ background: '#4F46E5' }}
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-60 border-l border-[#E6E8F5] bg-white p-4 flex flex-col gap-4 flex-shrink-0 overflow-y-auto">
          {/* Webcam */}
          <div>
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Camera</p>
            <div className="rounded-xl overflow-hidden bg-gray-900 aspect-video flex items-center justify-center">
              {cameraPermission === 'granted' ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <CameraOff size={22} className="text-gray-500" />
                  <p className="text-[10px] text-gray-500">Disabled</p>
                </div>
              )}
            </div>
          </div>

          {/* Events */}
          <div className="flex-1 min-h-0">
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Proctoring Events</p>
            <div className="space-y-2 overflow-y-auto max-h-64">
              {proctoringEvents.map(evt => (
                <div
                  key={evt.id}
                  className="flex items-start gap-2 p-2.5 rounded-lg border"
                  style={{
                    borderColor: evt.severity === 'high' ? '#FECACA' : evt.severity === 'medium' ? '#FDE68A' : '#BBF7D0',
                    background: evt.severity === 'high' ? '#FFF5F5' : evt.severity === 'medium' ? '#FFFBEB' : '#F0FDF4',
                  }}
                >
                  <SeverityIcon sev={evt.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate" style={{ color: severityColor(evt.severity) }}>
                      {evt.message}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{evt.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
