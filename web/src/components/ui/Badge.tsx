import React from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    success: 'bg-success-light text-success',
    warning: 'bg-amber-100 text-warning',
    danger: 'bg-red-100 text-danger',
    info: 'bg-blue-100 text-info',
    default: 'bg-gray-100 text-gray-600',
    primary: 'bg-primary-tint text-primary',
  }

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
