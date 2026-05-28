import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import {
  login,
  register,
  signOut,
  signInWithGoogle,
  resetPassword,
} from '@/services/firebase/auth'
import { ROUTES } from '@/constants'
import type { LoginInput, RegisterInput } from '@/types'

export function useAuth() {
  const router = useRouter()
  const { firebaseUser, profile, loading, initialized } = useAuthStore()

  const handleLogin = async (input: LoginInput) => {
    try {
      await login(input)
      toast.success('Welcome back!', { description: 'You are now signed in.' })
      router.push(ROUTES.dashboard)
    } catch (err: any) {
      const messages: Record<string, string> = {
        'auth/user-not-found': 'No account with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
      }
      toast.error(messages[err.code] ?? 'Login failed. Please try again.')
      throw err
    }
  }

  const handleRegister = async (input: RegisterInput) => {
    try {
      await register(input)
      toast.success('Account created!', { description: `Welcome, ${input.displayName}!` })
      router.push(ROUTES.dashboard)
    } catch (err: any) {
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password is too weak.',
      }
      toast.error(messages[err.code] ?? 'Registration failed. Please try again.')
      throw err
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      toast.success('Signed in with Google!')
      router.push(ROUTES.dashboard)
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('Google sign-in failed. Please try again.')
      }
      throw err
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully.')
      router.push(ROUTES.login)
    } catch {
      toast.error('Failed to sign out.')
    }
  }

  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email)
      toast.success('Reset email sent!', {
        description: 'Check your inbox for the password reset link.',
      })
    } catch (err: any) {
      toast.error('Failed to send reset email.')
      throw err
    }
  }

  return {
    user: firebaseUser,
    profile,
    loading,
    initialized,
    isAuthenticated: !!firebaseUser,
    login: handleLogin,
    register: handleRegister,
    signInWithGoogle: handleGoogleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
  }
}
