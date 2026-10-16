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

/** Build a Profile from the Supabase auth user's JWT metadata.
 *  Used as a fallback when the profiles table doesn't exist yet (pre-migration). */
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

/** Loads the profile: DB row if the table exists, otherwise JWT metadata. */
async function loadProfile(authUser: User): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single()

  // Table exists and row found
  if (data) return data as Profile

  // Table missing (code 42P01) or row missing (code PGRST116) — use JWT metadata
  if (error?.code === '42P01' || error?.code === 'PGRST116' || !data) {
    return profileFromAuthUser(authUser)
  }

  return profileFromAuthUser(authUser)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadProfile(session.user)
        setUser(profile)
      }
      setLoading(false)
    })

    // Listen for auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
