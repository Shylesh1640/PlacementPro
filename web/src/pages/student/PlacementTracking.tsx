import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Circle, Trophy, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  getStudentByProfileId, getStudentInterviews, getStudentPlacement, getStudentApplications
} from '../../lib/queries'

const STEP_LABELS = [
  'Assessments\nCompleted',
  'Job Match\nIdentified',
  'Interview\nScheduled',
  'Interview\nCompleted',
  'Offer\nReceived',
]

function getStepsCompleted(
  student: any,
  interviews: any[],
  placement: any,
  applications: any[]
): number {
  if (!student) return 0
  const status = student.placement_status ?? 'pending'
  if (placement) return 5
  if (status === 'placed') return 5
  if (status === 'interview_completed') return 4
  if (status === 'interview_scheduled' || interviews.some((i: any) => i.status === 'scheduled')) return 3
  if (status === 'matched' || applications.length > 0) return 2
  if (status === 'assessment_completed') return 1
  return 0
}

export function PlacementTracking() {
  const { user } = useAuth()

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', user?.id],
    queryFn: () => getStudentByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const { data: interviews = [] } = useQuery({
    queryKey: ['interviews', student?.id],
    queryFn: () => getStudentInterviews(student!.id),
    enabled: !!student?.id,
  })

  const { data: placement } = useQuery({
    queryKey: ['placement', student?.id],
    queryFn: () => getStudentPlacement(student!.id),
    enabled: !!student?.id,
  })

  const { data: applications = [] } = useQuery({
    queryKey: ['applications', student?.id],
    queryFn: () => getStudentApplications(student!.id),
    enabled: !!student?.id,
  })

  const isDemo = !student
  const stepsCompleted = isDemo ? 5 : getStepsCompleted(student, interviews, placement, applications)
  const isPlaced = stepsCompleted >= 5
  const placedAt = placement?.companies?.name ?? 'Google'
  const placedRole = placement?.jobs?.title ?? 'Software Development Engineer'

  const progressMessages: Record<number, string> = {
    0: 'Start your journey by completing the assessments.',
    1: 'Assessment done! Browse job matches to find opportunities.',
    2: 'Job matched! Your application is under review.',
    3: 'Interview scheduled! Prepare well.',
    4: 'Interview completed! Awaiting offer.',
    5: '🎉 Congratulations on your placement!',
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Placement Tracking</h1>
        <p className="text-sm text-[#4B5563] mt-0.5">Track your placement journey from assessment to offer</p>
      </div>

      {/* 5-step stepper */}
      <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-8">
        <div className="flex items-start justify-between gap-2">
          {STEP_LABELS.map((label, idx) => {
            const done = idx < stepsCompleted
            const isCurrent = idx === stepsCompleted
            const isFinal = idx === STEP_LABELS.length - 1
            return (
              <div key={idx} className="flex-1 flex flex-col items-center relative">
                {idx < STEP_LABELS.length - 1 && (
                  <div
                    className="absolute top-5 left-1/2 w-full h-0.5 z-0"
                    style={{ background: done ? '#4F46E5' : '#E6E8F5' }}
                  />
                )}
                <div className="relative z-10">
                  {done ? (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: isFinal ? '#4F46E5' : '#DCFCE7' }}
                    >
                      <CheckCircle size={22} style={{ color: isFinal ? 'white' : '#16A34A' }} />
                    </div>
                  ) : isCurrent ? (
                    <div
                      className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: '#4F46E5', background: '#EEF0FF' }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ background: '#4F46E5' }} />
                    </div>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: '#E6E8F5' }}
                    >
                      <Circle size={18} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <p
                  className="text-xs text-center mt-3 font-medium leading-tight whitespace-pre-line"
                  style={{ color: done ? '#111827' : isCurrent ? '#4F46E5' : '#9CA3AF' }}
                >
                  {label}
                </p>
              </div>
            )
          })}
        </div>
        <p className="text-center text-sm text-[#9CA3AF] mt-6">
          {progressMessages[Math.min(stepsCompleted, 5)]}
        </p>
      </div>

      {/* Congratulations card */}
      {isPlaced && (
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-8 text-center">
          <div className="flex justify-center gap-2 mb-4 text-2xl">🎉 🏆 🎊</div>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#FFF7ED' }}
          >
            <Trophy size={40} style={{ color: '#F59E0B' }} />
          </div>
          <h2 className="text-xl font-bold text-[#111827] mb-2">Congratulations!</h2>
          <p className="text-[#4B5563] text-sm mb-6 max-w-md mx-auto">
            You have been placed at <strong>{placedAt}</strong> as a <strong>{placedRole}</strong>!
          </p>
          {placement && (
            <div className="flex justify-center gap-4 text-sm text-[#4B5563] mb-6 flex-wrap">
              {placement.package_lpa && (
                <span className="px-3 py-1.5 rounded-full border border-[#E6E8F5]">
                  💰 {placement.package_lpa} LPA
                </span>
              )}
              {placement.joining_date && (
                <span className="px-3 py-1.5 rounded-full border border-[#E6E8F5]">
                  📅 Joining: {new Date(placement.joining_date).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
          <button
            className="text-sm font-medium px-6 py-2.5 rounded-lg text-white"
            style={{ background: '#4F46E5' }}
          >
            View Details
          </button>
        </div>
      )}

      {/* Not yet placed — CTAs */}
      {!isPlaced && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Complete Assessments', to: '/student/assessments', done: stepsCompleted >= 1 },
            { label: 'Browse Job Matches', to: '/student/job-matches', done: stepsCompleted >= 2 },
            { label: 'View Interviews', to: '/student/interviews', done: stepsCompleted >= 3 },
          ].map(c => (
            <Link
              key={c.label}
              to={c.to}
              className="flex items-center justify-between p-4 rounded-[12px] border transition-all hover:border-indigo-300"
              style={{
                background: c.done ? '#DCFCE7' : 'white',
                borderColor: c.done ? '#A7F3D0' : '#E6E8F5',
              }}
            >
              <span className="text-sm font-medium" style={{ color: c.done ? '#16A34A' : '#4F46E5' }}>
                {c.done && '✓ '}{c.label}
              </span>
              <ArrowRight size={16} style={{ color: c.done ? '#16A34A' : '#4F46E5' }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
