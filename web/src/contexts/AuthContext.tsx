import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, UserRole } from '../types/database'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

/** Build a Profile from JWT metadata — works before migrations are run. */
function profileFromAuthUser(authUser: User): Profile {
  const meta = authUser.user_metadata ?? {}
  return {
    id: authUser.id,
    email: authUser.email ?? '',
    full_name: meta.full_name ?? authUser.email ?? 'User',
    role: (meta.role as UserRole) ?? 'student',
    avatar_url: meta.avatar_url ?? undefined,
    created_at: authUser.created_at,
    updated_at: authUser.updated_at ?? authUser.created_at,
  }
}

/**
 * Load profile from DB if table exists; fall back to JWT metadata on any error.
 * This handles: table missing (404/42P01), row missing (PGRST116), network issues.
 */
async function loadProfile(authUser: User): Promise<Profile> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (data && !error) return data as Profile

    // Any error (table missing = 404, row missing = PGRST116, etc.) → use JWT
    return profileFromAuthUser(authUser)
  } catch {
    return profileFromAuthUser(authUser)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    /**
     * Use onAuthStateChange as the single source of truth.
     * It fires immediately for the current session (INITIAL_SESSION event)
     * so we don't need a separate getSession() call.
     *
     * IMPORTANT: setLoading(true) is called SYNCHRONOUSLY before the async
     * loadProfile() so RoleGuard shows a spinner (never sees user=null
     * mid-flight and bounces to /login).
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Set loading true synchronously so RoleGuard waits
        setLoading(true)

        if (session?.user) {
          const profile = await loadProfile(session.user)
          setUser(profile)
        } else {
          setUser(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
