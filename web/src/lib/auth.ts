import { supabase } from './supabase'
import type { UserRole } from '../types/database'

export async function signIn(email: string, password: string, role: UserRole) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  // Try profiles table (available after migrations are run)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single<{ role: string }>()

  // Fall back to user_metadata stored in the JWT (works before migrations too)
  const effectiveRole: string =
    profile?.role ?? data.user.user_metadata?.role ?? 'student'

  if (effectiveRole !== role) {
    await supabase.auth.signOut()
    throw new Error(`This account is not registered as ${role}. It is a ${effectiveRole} account.`)
  }

  return data
}

export async function signUp(email: string, password: string, fullName: string, role: UserRole) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
