import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types/database'

interface RoleGuardProps {
  allowedRole: UserRole
  children: React.ReactNode
}

export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-gradient">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== allowedRole) return <Navigate to="/login" replace />

  return <>{children}</>
}
