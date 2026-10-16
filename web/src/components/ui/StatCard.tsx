import React from 'react'
import { Card } from './Card'
import { cn } from '../../lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  iconBg?: string
  trend?: { value: number; positive: boolean }
}

export function StatCard({ title, value, subtitle, icon, iconBg = 'bg-primary-tint', trend }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0', iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-heading mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        {trend && (
          <p className={cn('text-xs mt-0.5', trend.positive ? 'text-success' : 'text-danger')}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </p>
        )}
      </div>
    </Card>
  )
}
