import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GraduationCap, Shield, Clock, AlertTriangle, CheckCircle, Info, Camera, CameraOff } from 'lucide-react'

interface ProctoringEvent {
  id: string
  type: 'multiple_persons' | 'tab_switch' | 'all_clear' | 'no_face'
  message: string
  time: string
  severity: 'high' | 'medium' | 'low'
}

const QUESTIONS = [
  {
    id: 1,
    text: 'If a train travels 120 km in 2 hours, what is its average speed?',
    options: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'],
    correct: 1,
  },
  {
    id: 2,
    text: 'A man buys a TV for ₹15,000 and sells it for ₹18,000. What is his profit percentage?',
    options: ['15%', '18%', '20%', '25%'],
    correct: 2,
  },
  {
    id: 3,
    text: 'If 8 workers can complete a job in 12 days, how many days will 6 workers take?',
    options: ['14 days', '16 days', '18 days', '20 days'],
    correct: 1,
  },
  {
    id: 4,
    text: 'What is the next number in the series: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '44', '46'],
    correct: 1,
  },
]

const TOTAL_SECONDS = 45 * 60 + 23

function formatTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function AssessmentTake() {
  useParams()
  const navigate = useNavigate()
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS)
  const [proctoringEvents, setProctoringEvents] = useState<ProctoringEvent[]>([
    { id: '1', type: 'multiple_persons', message: 'Multiple person detected', time: '12:05 PM', severity: 'high' },
    { id: '2', type: 'tab_switch', message: 'Tab switch detected', time: '12:10 PM', severity: 'medium' },
    { id: '3', type: 'all_clear', message: 'All clear', time: '12:12 PM', severity: 'low' },
  ])
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [showConsent, setShowConsent] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraPermission('granted')
      setShowConsent(false)
    } catch {
      setCameraPermission('denied')
      setShowConsent(false)
    }
  }, [])

  useEffect(() => {
    if (cameraPermission !== 'granted') return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer)
          navigate(`/student/assessments`)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cameraPermission, navigate])

  useEffect(() => {
    if (cameraPermission !== 'granted') return
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newEvent: ProctoringEvent = {
          id: Date.now().toString(),
          type: 'tab_switch',
          message: 'Tab switch detected',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          severity: 'medium',
        }
        setProctoringEvents(prev => [newEvent, ...prev])
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [cameraPermission])

  const q = QUESTIONS[currentQ]

  const severityIcon = (sev: string) => {
    if (sev === 'high') return <AlertTriangle size={13} style={{ color: '#EF4444' }} />
    if (sev === 'medium') return <Info size={13} style={{ color: '#F59E0B' }} />
    return <CheckCircle size={13} style={{ color: '#16A34A' }} />
  }

  const severityColor = (sev: string) => {
    if (sev === 'high') return '#EF4444'
    if (sev === 'medium') return '#F59E0B'
    return '#16A34A'
  }

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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F9FF' }}>
      {/* Dark header */}
      <header className="flex items-center justify-between px-6 py-3" style={{ background: '#1E1B4B' }}>
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
      <div className="flex items-center gap-3 px-6 py-2.5" style={{ background: '#DCFCE7', borderBottom: '1px solid #BBF7D0' }}>
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

      <div className="flex-1 flex gap-0">
        {/* Main Content */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Title + Timer */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-lg font-bold text-[#111827]">Aptitude Test – Quantitative Section</h1>
              <p className="text-sm text-[#9CA3AF] mt-0.5">Question {currentQ + 1} of {QUESTIONS.length}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E6E8F5] bg-white">
              <Clock size={16} style={{ color: timeLeft < 300 ? '#EF4444' : '#4F46E5' }} />
              <div className="text-right">
                <p className="text-[10px] text-[#9CA3AF] font-medium">Time Remaining</p>
                <p className="text-base font-bold" style={{ color: timeLeft < 300 ? '#EF4444' : '#111827', fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 flex-1">
            <p className="text-sm font-semibold text-[#111827] mb-6">
              Q{currentQ + 1}. {q.text}
            </p>
            <div className="space-y-3">
              {q.options.map((opt, idx) => (
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
                    onChange={() => setAnswers({ ...answers, [currentQ]: idx })}
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
              {currentQ === QUESTIONS.length - 1 ? (
                <button
                  onClick={() => navigate('/student/assessments')}
                  className="text-sm font-medium px-5 py-2 rounded-lg text-white"
                  style={{ background: '#16A34A' }}
                >
                  Submit →
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQ(Math.min(QUESTIONS.length - 1, currentQ + 1))}
                  className="text-sm font-medium px-5 py-2 rounded-lg text-white flex items-center gap-1"
                  style={{ background: '#4F46E5' }}
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Proctoring Events + Webcam */}
        <div className="w-64 border-l border-[#E6E8F5] bg-white p-4 flex flex-col gap-4">
          {/* Webcam Preview */}
          <div>
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Camera Preview</p>
            <div className="rounded-xl overflow-hidden bg-gray-900 aspect-video flex items-center justify-center">
              {cameraPermission === 'granted' ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <CameraOff size={24} className="text-gray-500" />
                  <p className="text-[10px] text-gray-500">Camera disabled</p>
                </div>
              )}
            </div>
          </div>

          {/* Events Feed */}
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
                  {severityIcon(evt.severity)}
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
