import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import {
  login,
  register,
  signOut,
  signInWithGoogle,
  resetPassword,
  resendConfirmation,
  updateUserProfile,
  changePassword,
  getUserProfile,
} from '@/services/supabase/auth'
import { ROUTES } from '@/constants'
import type { LoginInput, RegisterInput } from '@/types'

//* ── Classify every possible Supabase error *//
type ErrorKind =
  | 'EMAIL_NOT_CONFIRMED'
  | 'EMAIL_RATE_LIMIT'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'WEAK_PASSWORD'
  | 'NETWORK'
  | 'GENERIC'

function classifyError(err: any): { kind: ErrorKind; message: string } {
  const raw = (
    err?.message ??
    err?.error_description ??
    err?.msg ??
    ''
  ).toLowerCase()

  const code = (err?.code ?? err?.error ?? '').toLowerCase()
  const status = err?.status ?? err?.statusCode ?? 0

  // Email not confirmed
  if (raw.includes('email not confirmed') || raw.includes('email_not_confirmed'))
    return { kind: 'EMAIL_NOT_CONFIRMED', message: '' }

  // Rate limit — Supabase has MANY different messages for this
  if (
    raw.includes('for security purposes') ||
    raw.includes('rate limit') ||
    raw.includes('too many requests') ||
    raw.includes('over_email_send_rate_limit') ||
    raw.includes('email rate limit') ||
    raw.includes('request this after') ||   // "you can only request this after X seconds"
    raw.includes('wait') ||                 // catch-all for timing messages
    code === 'over_email_send_rate_limit' ||
    code === 'too_many_requests' ||
    status === 429
  ) {
    return { kind: 'EMAIL_RATE_LIMIT', message: '' }
  }

  // Duplicate email
  if (
    raw === 'email_already_exists' ||
    raw.includes('already exists') ||
    raw.includes('already registered') ||
    raw.includes('user already')
  )
    return { kind: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists.' }

  // Bad credentials
  if (raw.includes('invalid login') || raw.includes('invalid credentials') || raw.includes('wrong password'))
    return { kind: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }

  // Weak password
  if (raw.includes('password should be') || raw.includes('password must be'))
    return { kind: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters.' }

  // Network
  if (raw.includes('fetch') || raw.includes('network') || raw.includes('failed to fetch'))
    return { kind: 'NETWORK', message: 'Network error. Check your connection and try again.' }

  return { kind: 'GENERIC', message: err?.message || 'Something went wrong. Please try again.' }
}

export function useAuth() {
  const router = useRouter()
  const { sessionUser, profile, loading, initialized, setProfile } = useAuthStore()

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (input: LoginInput) => {
    try {
      await login(input)
      router.push(ROUTES.dashboard)
    } catch (err: any) {
      const { kind, message } = classifyError(err)
      if (kind === 'EMAIL_NOT_CONFIRMED') {
        // Login page shows inline resend UI — attach flag so page can check
        throw Object.assign(err, { isNotConfirmed: true })
      }
      toast.error(message || 'Login failed. Please try again.')
      throw err
    }
  }

  // ── Register ──────────────────────────────────────────────────────────────
  // NEVER throws to the page — always returns a result object
  const handleRegister = async (
    input: RegisterInput,
  ): Promise<{ needsConfirmation: boolean; rateLimited?: boolean }> => {
    try {
      const { needsConfirmation } = await register(input)

      if (needsConfirmation) {
        // Confirmation email was sent — show pending screen
        return { needsConfirmation: true }
      }

      // Email confirmation disabled → session exists, onAuthStateChange fires
      // and AuthProvider updates the store. Just redirect.
      toast.success('Welcome to Flow!', { description: `Logged in as ${input.email}` })
      router.push(ROUTES.dashboard)
      return { needsConfirmation: false }
    } catch (err: any) {
      const { kind, message } = classifyError(err)

      if (kind === 'EMAIL_RATE_LIMIT') {
        // Account WAS created — just couldn't send the email
        // Show pending screen with rate-limit explanation
        toast.error('Email rate limit reached', {
          description:
            'Supabase free tier allows only 2 confirmation emails per hour. ' +
            'Your account was created — disable "Confirm email" in Supabase to log in now.',
          duration: 10000,
        })
        return { needsConfirmation: true, rateLimited: true }
      }

      if (kind === 'EMAIL_ALREADY_EXISTS') {
        toast.error('Account already exists', {
          description: 'An account with this email already exists. Try logging in instead.',
        })
        return { needsConfirmation: false }
      }

      toast.error(message)
      // Return instead of throw so the page doesn't crash
      return { needsConfirmation: false }
    }
  }

  // ── Resend confirmation ───────────────────────────────────────────────────
  const handleResendConfirmation = async (email: string) => {
    try {
      await resendConfirmation(email)
      toast.success('Confirmation email sent!', { description: 'Check your inbox.' })
    } catch (err: any) {
      const { kind } = classifyError(err)
      if (kind === 'EMAIL_RATE_LIMIT') {
        toast.error('Rate limit reached', {
          description:
            'Please wait before requesting another email, or go to Supabase Dashboard → ' +
            'Authentication → Providers → Email and disable "Confirm email".',
          duration: 8000,
        })
      } else {
        toast.error('Failed to resend. Please try again later.')
      }
    }
  }

  // ── Google ────────────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch {
      toast.error('Google sign-in failed. Please try again.')
    }
  }

  // ── Sign out ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    try {
      await signOut()
      router.push(ROUTES.login)
    } catch {
      toast.error('Failed to sign out.')
    }
  }

  // ── Reset password ────────────────────────────────────────────────────────
  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email)
      toast.success('Reset email sent!', { description: 'Check your inbox.' })
    } catch (err: any) {
      const { kind, message } = classifyError(err)
      toast.error(kind === 'EMAIL_RATE_LIMIT' ? 'Rate limit reached. Please wait before trying again.' : message)
    }
  }

  // ── Update profile ────────────────────────────────────────────────────────
  const handleUpdateProfile = async (data: { displayName?: string; email?: string }) => {
    if (!sessionUser) return
    try {
      await updateUserProfile(sessionUser.id, data)
      const updated = await getUserProfile(sessionUser.id)
      if (updated) setProfile(updated)
      toast.success('Profile updated successfully')
    } catch (err: any) {
      toast.error(classifyError(err).message)
      throw err
    }
  }

  // ── Change password ───────────────────────────────────────────────────────
  const handleChangePassword = async (current: string, newPassword: string) => {
    try {
      await changePassword(current, newPassword)
      toast.success('Password changed successfully')
    } catch (err: any) {
      toast.error(classifyError(err).message)
      throw err
    }
  }

  return {
    user: sessionUser,
    profile,
    loading,
    initialized,
    isAuthenticated: !!sessionUser,
    login: handleLogin,
    register: handleRegister,
    resendConfirmation: handleResendConfirmation,
    signInWithGoogle: handleGoogleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updateProfile: handleUpdateProfile,
    changePassword: handleChangePassword,
  }
}
