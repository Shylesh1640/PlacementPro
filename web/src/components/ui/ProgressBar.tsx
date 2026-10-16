import { cn } from '../../lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  color?: string
  className?: string
}

export function ProgressBar({ value, max = 100, label, showValue = true, color = 'bg-primary', className }: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100)

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between mb-1.5">
          {label && <span className="text-sm text-body font-medium">{label}</span>}
          {showValue && <span className="text-sm font-semibold text-heading">{percentage}%</span>}
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={cn('h-2.5 rounded-full transition-all duration-500', color)}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  )
}
