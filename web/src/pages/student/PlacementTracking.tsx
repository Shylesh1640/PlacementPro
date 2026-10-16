import { CheckCircle, Circle, Trophy } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Assessments\nCompleted', done: true },
  { id: 2, label: 'Job Match\nIdentified', done: true },
  { id: 3, label: 'Interview\nScheduled', done: true },
  { id: 4, label: 'Interview\nCompleted', done: true },
  { id: 5, label: 'Offer\nReceived', done: true },
]

export function PlacementTracking() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Placement Tracking</h1>
        <p className="text-sm text-[#4B5563] mt-0.5">Track your placement journey from assessment to offer</p>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-8">
        <div className="flex items-start justify-between gap-2">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex-1 flex flex-col items-center relative">
              {idx < STEPS.length - 1 && (
                <div
                  className="absolute top-5 left-1/2 w-full h-0.5"
                  style={{ background: step.done ? '#4F46E5' : '#E6E8F5', zIndex: 0 }}
                />
              )}
              <div className="relative z-10">
                {step.done ? (
                  idx === STEPS.length - 1 ? (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#4F46E5' }}>
                      <CheckCircle size={22} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#DCFCE7' }}>
                      <CheckCircle size={22} style={{ color: '#16A34A' }} />
                    </div>
                  )
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border-2" style={{ borderColor: '#E6E8F5' }}>
                    <Circle size={18} className="text-gray-300" />
                  </div>
                )}
              </div>
              <p className="text-xs text-center mt-3 font-medium leading-tight whitespace-pre-line text-[#4B5563]">
                {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-8 text-center">
        <div className="flex justify-center gap-2 mb-4 text-2xl">
          🎉 🏆 🎊
        </div>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FFF7ED' }}>
          <Trophy size={40} style={{ color: '#F59E0B' }} />
        </div>
        <h2 className="text-xl font-bold text-[#111827] mb-2">Congratulations!</h2>
        <p className="text-[#4B5563] text-sm mb-6 max-w-md mx-auto">
          You have been placed at <strong>Google</strong> as a <strong>Software Development Engineer</strong>!
        </p>
        <button
          className="text-sm font-medium px-6 py-2.5 rounded-lg text-white"
          style={{ background: '#4F46E5' }}
        >
          View Details
        </button>
      </div>
    </div>
  )
}
