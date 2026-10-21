import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  GraduationCap, Shield, Clock, AlertTriangle, CheckCircle,
  Info, Camera, Eye, EyeOff
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

interface ProcEvent {
  id: string
  type: string
  message: string
  time: string
  severity: 'high' | 'medium' | 'low'
  snapshotUrl?: string
}

const FALLBACK_QUESTIONS = [
  { id:'fq1',  question:'Q1.  If a train travels 120 km in 2 hours, what is its average speed?',            option_a:'50 km/h', option_b:'60 km/h', option_c:'70 km/h', option_d:'80 km/h',  correct_answer:'B' },
  { id:'fq2',  question:'Q2.  A man buys a TV for ₹15,000 and sells it for ₹18,000. Profit %?',            option_a:'15%',     option_b:'18%',     option_c:'20%',     option_d:'25%',      correct_answer:'C' },
  { id:'fq3',  question:'Q3.  If 8 workers complete a job in 12 days, how many days will 6 workers take?', option_a:'14 days', option_b:'16 days', option_c:'18 days', option_d:'20 days',  correct_answer:'B' },
  { id:'fq4',  question:'Q4.  Next in series: 2, 6, 12, 20, 30, ?',                                        option_a:'40',      option_b:'42',      option_c:'44',      option_d:'46',       correct_answer:'B' },
  { id:'fq5',  question:'Q5.  A pipe fills a tank in 4h; another empties it in 6h. Both open: full in?',   option_a:'8h',      option_b:'10h',     option_c:'12h',     option_d:'14h',      correct_answer:'C' },
  { id:'fq6',  question:'Q6.  Simple interest on ₹5,000 at 8% p.a. for 3 years?',                         option_a:'₹1,000',  option_b:'₹1,200',  option_c:'₹1,400',  option_d:'₹1,600',  correct_answer:'B' },
  { id:'fq7',  question:'Q7.  Shopkeeper gives 20% discount on ₹500. Selling price?',                      option_a:'₹350',    option_b:'₹380',    option_c:'₹400',    option_d:'₹420',     correct_answer:'C' },
  { id:'fq8',  question:'Q8.  In a class of 60 students, 40% are girls. How many boys?',                   option_a:'24',      option_b:'32',      option_c:'36',      option_d:'40',       correct_answer:'C' },
  { id:'fq9',  question:'Q9.  Time complexity of binary search?',                                           option_a:'O(n)',    option_b:'O(n²)',   option_c:'O(log n)',option_d:'O(1)',     correct_answer:'C' },
  { id:'fq10', question:'Q10. Two numbers in ratio 3:5; sum is 96. Larger number?',                         option_a:'36',      option_b:'48',      option_c:'60',      option_d:'72',       correct_answer:'C' },
]

const TOTAL_SECONDS = 45 * 60
const fmtTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
const getLetter = (idx: number) => ['A','B','C','D'][idx] ?? 'A'

export function AssessmentTake() {
  const { id: assessmentId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [questions,          setQuestions]          = useState<any[]>([])
  const [attemptId,          setAttemptId]          = useState<string | null>(null)
  const [studentId,          setStudentId]          = useState<string | null>(null)
  const [currentQ,           setCurrentQ]           = useState(0)
  const [answers,            setAnswers]            = useState<Record<number,number>>({})
  const [timeLeft,           setTimeLeft]           = useState(TOTAL_SECONDS)
  const [submitting,         setSubmitting]         = useState(false)
  const [terminated,         setTerminated]         = useState(false)
  const [terminateCountdown, setTerminateCountdown] = useState(0)
  const [showConsent,        setShowConsent]        = useState(true)
  const [camGranted,         setCamGranted]         = useState(false)
  const [faceCount,          setFaceCount]          = useState<number | null>(null)
  const [events,             setEvents]             = useState<ProcEvent[]>([])
  const [highCount,          setHighCount]          = useState(0)

  const videoRef      = useRef<HTMLVideoElement>(null)
  const overlayRef    = useRef<HTMLCanvasElement>(null)
  const captureRef    = useRef<HTMLCanvasElement>(null)
  const streamRef     = useRef<MediaStream | null>(null)
  const frameRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const clearRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptIdRef  = useRef<string | null>(null)
  const studentIdRef  = useRef<string | null>(null)
  const terminRef     = useRef(false)
  const submittingRef = useRef(false)
  const answersRef    = useRef<Record<number,number>>({})
  const questionsRef  = useRef<any[]>([])

  useEffect(() => { attemptIdRef.current  = attemptId  }, [attemptId])
  useEffect(() => { studentIdRef.current  = studentId  }, [studentId])
  useEffect(() => { terminRef.current     = terminated }, [terminated])
  useEffect(() => { submittingRef.current = submitting }, [submitting])
  useEffect(() => { answersRef.current    = answers    }, [answers])
  useEffect(() => { questionsRef.current  = questions  }, [questions])

  // Load questions + start attempt
  useEffect(() => {
    if (!user?.id || !assessmentId || showConsent) return
    ;(async () => {
      try {
        const stu = await getStudentByProfileId(user.id)
        if (stu?.id) setStudentId(stu.id)
        const dbQ = await getAssessmentWithQuestions(assessmentId)
        setQuestions(dbQ.length > 0 ? dbQ : FALLBACK_QUESTIONS)
        const att = await startAttempt(assessmentId, stu?.id ?? '')
        if (att) setAttemptId(att.id)
      } catch { setQuestions(FALLBACK_QUESTIONS) }
    })()
  }, [user?.id, assessmentId, showConsent])

  // Block copy-paste + right-click
  useEffect(() => {
    if (showConsent) return
    const b = (e: Event) => e.preventDefault()
    document.addEventListener('copy', b); document.addEventListener('paste', b)
    document.addEventListener('cut',  b); document.addEventListener('contextmenu', b)
    return () => {
      document.removeEventListener('copy', b); document.removeEventListener('paste', b)
      document.removeEventListener('cut',  b); document.removeEventListener('contextmenu', b)
    }
  }, [showConsent])

  // Tab-switch
  useEffect(() => {
    if (showConsent) return
    const h = () => { if (document.hidden) addEvent('tab_switch','Tab switch detected','medium',true) }
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConsent])

  // Timer
  useEffect(() => {
    if (showConsent || terminated) return
    const t = setInterval(() => setTimeLeft(s => { if (s<=1){clearInterval(t);doSubmit(true);return 0} return s-1 }), 1000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConsent, terminated])

  // Attach stream to video once it becomes visible (camGranted → display:block)
  useEffect(() => {
    if (!camGranted || !streamRef.current) return
    const v = videoRef.current
    if (!v) return
    v.srcObject = streamRef.current
    v.play().catch(() => {
      // Retry once on play() rejection (autoplay policy)
      setTimeout(() => v.play().catch(() => {}), 200)
    })
  }, [camGranted])

  // Camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      // Show video FIRST (removes display:none), then attach stream via useEffect above
      setCamGranted(true)
      setShowConsent(false)
      addEvent('all_clear','Proctoring started — camera active','low',false)
    } catch {
      setCamGranted(false); setShowConsent(false)
      addEvent('camera_denied','Camera denied — limited proctoring','medium',false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Frame analysis every 4s
  useEffect(() => {
    if (showConsent || !camGranted) return
    frameRef.current = setInterval(async () => {
      const v=videoRef.current, cap=captureRef.current
      if (!v || !cap || v.videoWidth===0 || !v.srcObject) return
      cap.width=v.videoWidth; cap.height=v.videoHeight
      const ctx=cap.getContext('2d'); if(!ctx) return
      ctx.drawImage(v,0,0)
      const dataUrl=cap.toDataURL('image/jpeg',0.7), b64=dataUrl.split(',')[1]
      try {
        const aiUrl = import.meta.env.VITE_AI_SERVICE_URL ?? 'http://localhost:8000'
        const res = await fetch(`${aiUrl}/api/proctor/analyze`,{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ attempt_id:attemptIdRef.current??'demo', frame_base64:b64, timestamp:new Date().toISOString() }),
          signal:AbortSignal.timeout(5000)
        })
        if(!res.ok) return
        const r = await res.json()
        setFaceCount(r.face_count??null)
        drawOverlay(r.face_count??0)
        if(r.flagged && r.event_type!=='all_clear'){
          let snap: string|undefined
          if(r.severity==='high') snap=await captureSnapshot(dataUrl, r.event_type)
          addEvent(r.event_type, r.message, r.severity, true, snap)
        }
      } catch {/* AI offline */}
    }, 4000)
    clearRef.current = setInterval(()=>addEvent('all_clear','Proctoring clear','low',false), 30000)
    return () => { if(frameRef.current) clearInterval(frameRef.current); if(clearRef.current) clearInterval(clearRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConsent, camGranted])

  const drawOverlay = (count: number) => {
    const ov=overlayRef.current, v=videoRef.current; if(!ov||!v) return
    ov.width=v.clientWidth||320; ov.height=v.clientHeight||240
    const ctx=ov.getContext('2d'); if(!ctx) return
    ctx.clearRect(0,0,ov.width,ov.height)
    if(count===1){
      ctx.strokeStyle='#16A34A'; ctx.lineWidth=2
      ctx.strokeRect(ov.width*0.25, ov.height*0.08, ov.width*0.5, ov.height*0.75)
      ctx.fillStyle='rgba(22,163,74,0.8)'; ctx.fillRect(ov.width*0.25, ov.height*0.08-18, ov.width*0.5, 18)
      ctx.fillStyle='white'; ctx.font='bold 10px sans-serif'; ctx.fillText('Face detected ✓', ov.width*0.25+4, ov.height*0.08-5)
    } else if(count>1){
      ctx.strokeStyle='#EF4444'; ctx.lineWidth=3; ctx.strokeRect(3,3,ov.width-6,ov.height-6)
      ctx.fillStyle='rgba(239,68,68,0.88)'; ctx.fillRect(0,0,ov.width,22)
      ctx.fillStyle='white'; ctx.font='bold 11px sans-serif'; ctx.fillText(`⚠ ${count} FACES — VIOLATION`,6,15)
    } else {
      ctx.strokeStyle='#F59E0B'; ctx.lineWidth=2; ctx.setLineDash([8,4])
      ctx.strokeRect(3,3,ov.width-6,ov.height-6); ctx.setLineDash([])
      ctx.fillStyle='rgba(245,158,11,0.88)'; ctx.fillRect(0,0,ov.width,22)
      ctx.fillStyle='white'; ctx.font='bold 10px sans-serif'; ctx.fillText('⚠ No face — look at screen',6,15)
    }
  }

  const captureSnapshot = async (dataUrl: string, eventType: string): Promise<string|undefined> => {
    try {
      const blob=(await fetch(dataUrl)).blob(); const b=await blob
      const path=`proctoring/${attemptIdRef.current??'unknown'}/${eventType}_${Date.now()}.jpg`
      const {error}=await supabase.storage.from('proctoring-snapshots').upload(path,b,{contentType:'image/jpeg',upsert:true})
      if(error) return undefined
      return supabase.storage.from('proctoring-snapshots').getPublicUrl(path).data.publicUrl
    } catch { return undefined }
  }

  const addEvent = useCallback((type:string,message:string,severity:'high'|'medium'|'low',saveToDB:boolean,snapshotUrl?:string)=>{
    const time=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
    setEvents(p=>[{id:Date.now().toString(),type,message,time,severity,snapshotUrl},...p.slice(0,19)])
    if(severity==='high'){
      setHighCount(c=>{ const n=c+1; if(n>=3&&!terminRef.current) triggerTermination(); return n })
    }
    if(saveToDB && attemptIdRef.current && type!=='all_clear')
      saveProctoringEvent(attemptIdRef.current,type,severity,snapshotUrl).catch(()=>{})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const triggerTermination = useCallback(()=>{
    if(terminRef.current) return
    terminRef.current=true; setTerminated(true); setTerminateCountdown(5)
    let c=5; const t=setInterval(()=>{ c--; setTerminateCountdown(c); if(c<=0){clearInterval(t);doSubmit(true,true)} },1000)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const handleSelect=(qIdx:number,optIdx:number)=>{
    if(terminRef.current) return
    setAnswers(p=>({...p,[qIdx]:optIdx}))
    const atId=attemptIdRef.current, qs=questionsRef.current
    if(atId&&qs[qIdx]){const l=getLetter(optIdx);saveAnswer(atId,qs[qIdx].id,l,l===qs[qIdx].correct_answer).catch(()=>{})}
  }

  const doSubmit=useCallback(async(auto=false,isTerminated=false)=>{
    if(submittingRef.current) return
    submittingRef.current=true; setSubmitting(true)
    streamRef.current?.getTracks().forEach(t=>t.stop())
    if(frameRef.current) clearInterval(frameRef.current)
    if(clearRef.current)  clearInterval(clearRef.current)
    const aid=attemptIdRef.current, sid=studentIdRef.current
    const qs=questionsRef.current.length>0?questionsRef.current:FALLBACK_QUESTIONS, ans=answersRef.current
    if(aid&&qs.length>0){
      let correct=0; qs.forEach((q,i)=>{if(getLetter(ans[i]??-1)===q.correct_answer)correct++})
      const score=Math.round((correct/qs.length)*100)
      const status=isTerminated?'auto_submitted':auto?'auto_submitted':'submitted'
      await submitAttempt(aid,score,score,status).catch(()=>{})
      if(sid){
        const qr=await (supabase as any).from('students').select('id,profile_id,cgpa,tenth_percent,twelfth_percent,backlogs').eq('id',sid).single().then((r:any)=>r,()=>({data:null}))
        if(qr?.data) calculateAndSaveReadiness({studentId:qr.data.id,profileId:qr.data.profile_id,cgpa:qr.data.cgpa??0,tenthPercent:qr.data.tenth_percent??0,twelfthPercent:qr.data.twelfth_percent??0,backlogs:qr.data.backlogs??0}).catch(()=>{})
      }
    }
    navigate('/student/results')
  },[navigate])

  const q=questions[currentQ], totalQ=questions.length||FALLBACK_QUESTIONS.length
  const sevColor=(s:string)=>s==='high'?'#EF4444':s==='medium'?'#F59E0B':'#16A34A'
  const sevBg=(s:string)=>s==='high'?'#FEF2F2':s==='medium'?'#FFFBEB':'#F0FFF4'
  const SevIcon=({s}:{s:string})=>s==='high'?<AlertTriangle size={12} style={{color:sevColor(s),flexShrink:0}}/>:s==='medium'?<Info size={12} style={{color:sevColor(s),flexShrink:0}}/>:<CheckCircle size={12} style={{color:sevColor(s),flexShrink:0}}/>

  if(showConsent) return(
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'linear-gradient(135deg,#EEF1FF,#F7F8FF)'}}>
      <div className="bg-white rounded-[16px] shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-center mb-4"><div className="w-16 h-16 rounded-full flex items-center justify-center" style={{background:'#EEF0FF'}}><Camera size={32} style={{color:'#4F46E5'}}/></div></div>
        <h2 className="text-lg font-bold text-[#111827] text-center mb-2">AI Proctoring Required</h2>
        <p className="text-sm text-[#4B5563] text-center mb-5 leading-relaxed">Your webcam is required for real-time face tracking during this exam.</p>
        <ul className="text-sm text-[#4B5563] space-y-2 mb-5">
          <li className="flex items-center gap-2"><CheckCircle size={14} style={{color:'#16A34A'}}/> Real-time OpenCV face detection</li>
          <li className="flex items-center gap-2"><CheckCircle size={14} style={{color:'#16A34A'}}/> Multiple faces = flag + screenshot captured</li>
          <li className="flex items-center gap-2"><AlertTriangle size={14} style={{color:'#F59E0B'}}/> 3 high violations = exam auto-terminated</li>
          <li className="flex items-center gap-2"><Shield size={14} style={{color:'#4F46E5'}}/> Copy-paste and right-click are disabled</li>
        </ul>
        <div className="space-y-2">
          <button onClick={startCamera} className="w-full py-3 rounded-lg text-white text-sm font-semibold" style={{background:'#4F46E5'}}>Allow Camera &amp; Start Exam</button>
          <button onClick={()=>{setCamGranted(false);setShowConsent(false)}} className="w-full py-3 rounded-lg border border-[#E6E8F5] text-sm text-[#4B5563] hover:bg-gray-50">Proceed Without Camera</button>
        </div>
      </div>
    </div>
  )

  if(terminated&&terminateCountdown>0) return(
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.88)'}}>
      <div className="bg-white rounded-[16px] p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{background:'#FEE2E2'}}><AlertTriangle size={32} style={{color:'#EF4444'}}/></div>
        <h2 className="text-xl font-bold text-[#111827] mb-2">Exam Terminated</h2>
        <p className="text-sm text-[#4B5563] mb-4 leading-relaxed">3 high-severity proctoring violations detected. Auto-submitting in:</p>
        <div className="text-5xl font-bold mb-4" style={{color:'#EF4444'}}>{terminateCountdown}</div>
        <p className="text-xs text-[#9CA3AF]">Answers saved. Incident reported to administrator.</p>
      </div>
    </div>
  )

  return(
    <div className="fixed inset-0 flex flex-col overflow-hidden select-none" style={{background:'#F8F9FF'}}
      onCopy={e=>e.preventDefault()} onPaste={e=>e.preventDefault()} onCut={e=>e.preventDefault()} onContextMenu={e=>e.preventDefault()}>
      <canvas ref={captureRef} className="hidden"/>
      <header className="flex items-center justify-between px-6 py-3 flex-shrink-0" style={{background:'#1E1B4B'}}>
        <div className="flex items-center gap-2.5"><GraduationCap size={20} className="text-white"/><span className="text-white font-bold text-sm">PlacementPro</span></div>
        <div className="flex items-center gap-3">
          {highCount>0&&<div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full" style={{background:highCount>=3?'#FEE2E2':'#FFF7ED',color:highCount>=3?'#EF4444':'#F59E0B'}}><AlertTriangle size={11}/>{highCount}/3 violations {highCount>=3?'— TERMINATED':''}</div>}
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/><span className="text-green-400 text-xs font-medium">AI Proctoring Active</span></div>
        </div>
      </header>
      <div className="flex items-center gap-3 px-6 py-2.5 flex-shrink-0" style={{background:'#F0FFF4',borderBottom:'1px solid #A7F3D0'}}>
        <Shield size={14} style={{color:'#16A34A'}}/><p className="text-xs font-medium" style={{color:'#166534'}}>Proctoring Active — Face tracking enabled. Copy-paste disabled. {highCount}/3 violations.</p>
      </div>
      <div className="px-6 py-3 bg-white border-b border-[#E6E8F5] flex items-center justify-between flex-shrink-0">
        <h1 className="text-sm font-bold text-[#111827]">Assessment — Q{currentQ+1} of {totalQ}</h1>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border" style={{background:timeLeft<300?'#FEF2F2':'#FFF7ED',borderColor:timeLeft<300?'#FECACA':'#FED7AA'}}>
          <Clock size={14} style={{color:timeLeft<300?'#EF4444':'#F59E0B'}}/><p className="text-base font-bold font-mono" style={{color:timeLeft<300?'#EF4444':'#F59E0B'}}>{fmtTime(timeLeft)}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {q?(
              <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6">
                <p className="text-sm font-medium text-[#111827] leading-relaxed mb-5">{q.question}</p>
                <div className="space-y-2.5">
                  {[q.option_a,q.option_b,q.option_c,q.option_d].map((opt,idx)=>(
                    <label key={idx} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${answers[currentQ]===idx?'border-[#4F46E5] bg-[#EEF0FF]':'border-[#E6E8F5] hover:border-[#C7D2FE]'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${answers[currentQ]===idx?'border-[#4F46E5]':'border-[#D1D5DB]'}`}>
                        {answers[currentQ]===idx&&<div className="w-2 h-2 rounded-full" style={{background:'#4F46E5'}}/>}
                      </div>
                      <input type="radio" className="sr-only" checked={answers[currentQ]===idx} onChange={()=>handleSelect(currentQ,idx)}/>
                      <span className={`text-sm ${answers[currentQ]===idx?'text-[#4F46E5] font-medium':'text-[#4B5563]'}`}>{String.fromCharCode(65+idx)}. {opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ):(
              <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full mx-auto mb-3"/>
                <p className="text-sm text-[#9CA3AF]">Loading questions…</p>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <button onClick={()=>setCurrentQ(q=>Math.max(0,q-1))} disabled={currentQ===0} className="text-sm font-medium px-5 py-2.5 rounded-lg border border-[#E6E8F5] text-[#4B5563] disabled:opacity-40 hover:bg-gray-50">← Previous</button>
              <div className="flex gap-1 flex-wrap justify-center max-w-xs">
                {(questions.length>0?questions:FALLBACK_QUESTIONS).map((_,idx)=>(
                  <button key={idx} onClick={()=>setCurrentQ(idx)} className="w-7 h-7 rounded-lg text-[11px] font-medium"
                    style={{background:idx===currentQ?'#4F46E5':answers[idx]!==undefined?'#16A34A':'#F3F4F6',color:idx===currentQ||answers[idx]!==undefined?'white':'#4B5563'}}>
                    {idx+1}
                  </button>
                ))}
              </div>
              {currentQ<totalQ-1?(
                <button onClick={()=>setCurrentQ(q=>q+1)} className="text-sm font-medium px-5 py-2.5 rounded-lg text-white" style={{background:'#4F46E5'}}>Next →</button>
              ):(
                <button onClick={()=>doSubmit(false)} disabled={submitting} className="text-sm font-medium px-5 py-2.5 rounded-lg text-white disabled:opacity-60" style={{background:'#16A34A'}}>
                  {submitting?'Submitting…':'Submit ✓'}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${camGranted?'bg-green-400 animate-pulse':'bg-gray-300'}`}/>
                  <span className="text-xs font-medium text-[#4B5563]">{camGranted?'Camera Active':'No Camera'}</span>
                </div>
                {faceCount!==null&&<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:faceCount===1?'#DCFCE7':'#FEE2E2',color:faceCount===1?'#16A34A':'#EF4444'}}>{faceCount===0?'⚠ No face':faceCount===1?'1 face ✓':`${faceCount} faces ⚠`}</span>}
              </div>
              <div className="relative rounded-xl overflow-hidden bg-gray-900" style={{aspectRatio:'4/3'}}>
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{display:camGranted?'block':'none'}}/>
                {!camGranted&&<div className="absolute inset-0 flex flex-col items-center justify-center"><EyeOff size={28} className="text-gray-500 mb-2"/><p className="text-xs text-gray-500">Camera not active</p></div>}
                <canvas ref={overlayRef} className="absolute inset-0 pointer-events-none" style={{width:'100%',height:'100%',display:camGranted?'block':'none'}}/>
                {highCount>=3&&<div className="absolute top-0 left-0 right-0 py-1 text-center text-[10px] font-bold text-white rounded-t-xl" style={{background:'#DC2626'}}>EXAM TERMINATED — {highCount} violations</div>}
              </div>
            </div>
            <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-3">
              <div className="flex items-center gap-2 mb-2"><Eye size={13} style={{color:'#4F46E5'}}/><span className="text-xs font-semibold text-[#111827] uppercase tracking-wide">Proctoring Feed</span></div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {events.length===0?(
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{background:'#F0FFF4'}}><CheckCircle size={11} style={{color:'#16A34A'}}/><span className="text-xs" style={{color:'#16A34A'}}>No events yet</span></div>
                ):events.map(evt=>(
                  <div key={evt.id} className="p-2 rounded-lg" style={{background:sevBg(evt.severity)}}>
                    <div className="flex items-center gap-1.5">
                      <SevIcon s={evt.severity}/>
                      <p className="text-xs font-medium flex-1 truncate" style={{color:sevColor(evt.severity)}}>{evt.message}</p>
                      <span className="text-[9px] flex-shrink-0" style={{color:sevColor(evt.severity)}}>{evt.time}</span>
                    </div>
                    {evt.snapshotUrl&&<img src={evt.snapshotUrl} alt="capture" className="mt-1.5 w-full rounded border border-gray-200" style={{maxHeight:64,objectFit:'cover'}}/>}
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
