import { supabase } from './client'
import type { User, LoginInput, RegisterInput } from '@/types'
import type { TablesInsert, TablesUpdate } from './database.types'


//* ── Map DB row → app User *// 
function rowToUser(row: any): User {
  return {
    uid: row.id,
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    photoURL: row.photo_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

//* ── Upsert profile (safe to call multiple times) *//
export async function upsertProfile(id: string, email: string, displayName: string) {
  const payload: TablesInsert<'profiles'> = {
    id,
    email: email.toLowerCase().trim(),
    display_name: displayName.trim(),
    photo_url: null,
  }
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' })
  if (error) console.warn('upsertProfile warning:', error.message)
}

//* ── Register *//
export async function register({ displayName, email, password }: RegisterInput) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: displayName.trim() } },
  })

  if (error) throw error

  const user = data.user
  if (!user) throw new Error('Registration failed. Please try again.')

  // Supabase returns identities=[] when the email already exists
  if (user.identities?.length === 0) {
    throw new Error('EMAIL_ALREADY_EXISTS')
  }

  // Session present means email confirmation is disabled → already logged in
  const needsConfirmation = !data.session

  if (!needsConfirmation) {
    // Ensure profile row exists (trigger may not have fired yet in some configs)
    await upsertProfile(user.id, email, displayName)
  }

  return { user, needsConfirmation }
}

//* ── Login *//
export async function login({ email, password }: LoginInput) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Translate Supabase internal error codes to user-friendly messages
    if (error.message.includes('Email not confirmed')) {
      throw new Error('EMAIL_NOT_CONFIRMED')
    }
    throw error
  }

  return data.user!
}

//* ── Resend confirmation email *//
export async function resendConfirmation(email: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() })
  if (error) throw error
}


//* ── Google OAuth *//
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) throw error
}

//* ── Sign out *//
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

//* ── Reset password *//
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback`,
  })
  if (error) throw error
}

//* ── Update profile *//
export async function updateUserProfile(
  uid: string,
  data: { displayName?: string; email?: string },
) {
  const updates: TablesUpdate<'profiles'> = {}
  if (data.displayName) updates.display_name = data.displayName
  if (data.email) updates.email = data.email.toLowerCase().trim()

  const { error } = await supabase.from('profiles').update(updates).eq('id', uid)
  if (error) throw new Error(error.message)

  if (data.email) {
    const { error: authErr } = await supabase.auth.updateUser({ email: data.email })
    if (authErr) throw new Error(authErr.message)
  }
}


//* ── Change password *//
export async function changePassword(_currentPassword: string, newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
}

//* ── Get single profile by UID *//
export async function getUserProfile(uid: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single()
  if (error || !data) return null
  return rowToUser(data)
}

//* ── Get multiple profiles by UID array *//
export async function getUserProfiles(uids: string[]): Promise<User[]> {
  if (!uids.length) return []
  const { data, error } = await supabase.from('profiles').select('*').in('id', uids)
  if (error || !data) return []
  return data.map(rowToUser)
}

//* ── Find user by email *//
export async function findUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()
  if (error || !data) return null
  return rowToUser(data)
}

//* ── Auth state observer *//
export function onAuthChange(
  callback: (user: { id: string; email: string } | null) => void,
) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null
    callback(user ? { id: user.id, email: user.email ?? '' } : null)
  })
  return () => data.subscription.unsubscribe()
}

//* ── Get current session *//
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}
