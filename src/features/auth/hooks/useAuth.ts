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
import { classifyError } from '@/utils'


export function useAuth() {
  const router = useRouter()
  const { sessionUser, profile, loading, initialized, setProfile } = useAuthStore()

  //* ── Login *//
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
      toast.error(message || 'Falha no login. Por favor tente novamente.')
      throw err
    }
  }

  //* ── Register *//
  const handleRegister = async (
    input: RegisterInput,
  ): Promise<{ needsConfirmation: boolean; rateLimited?: boolean }> => {
    try {
      const { needsConfirmation } = await register(input)

      if (needsConfirmation) {
        // Confirmation email was sent — show pending screen
        return { needsConfirmation: true }
      }

      toast.success('Bem-vindo ao Flow!', { description: `Conta criada para ${input.email}` })
      router.push(ROUTES.dashboard)
      return { needsConfirmation: false }
    } catch (err: any) {
      const { kind, message } = classifyError(err)

      if (kind === 'EMAIL_RATE_LIMIT') {
        toast.error('Limite de emails atingido', {
          description:
            `O Supabase gratuito permite apenas 2 emails de confirmação por hora. 
            A sua conta foi criada — desative "Confirmar email" no painel do 
            Supabase para entrar já.`,
          duration: 10000,
        })
        return { needsConfirmation: true, rateLimited: true }
      }

      if (kind === 'EMAIL_ALREADY_EXISTS') {
        toast.error('Conta já existente', {
          description: 'Já existe uma conta com este email. Tente fazer login.'
        })
        return { needsConfirmation: false }
      }

      toast.error(message)
      return { needsConfirmation: false }
    }
  }

  //* ── Resend confirmation *//
  const handleResendConfirmation = async (email: string) => {
    try {
      await resendConfirmation(email)
      toast.success('Email enviado!', {
        description: 'Verifique a sua caixa de entrada.'
      })
    } catch (err: any) {
      const { kind } = classifyError(err)
      if (kind === 'EMAIL_RATE_LIMIT') {
        toast.error('Limite atingido', {
          description:
            `Aguarde antes de solicitar outro email, ou desative 
            a confirmação no painel do Supabase.`,
          duration: 8000,
        })
      } else {
        toast.error('Falha ao reenviar. Tente novamente mais tarde.')
      }
    }
  }

  //* ── Google *//
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch {
      toast.error('Falha no login com Google. Por favor tente novamente.')
    }
  }

  //* ── Sign out *//
  const handleSignOut = async () => {
    try {
      await signOut()
      router.push(ROUTES.login)
    } catch {
      toast.error('Falha ao terminar sessão.')
    }
  }

  //* ── Reset password *//
  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email)
      toast.success('Email enviado!', {
        description: 'Verifique a sua caixa de entrada.'
      })
    } catch (err: any) {
      const { kind, message } = classifyError(err)
      toast.error(kind === 'EMAIL_RATE_LIMIT' ? 'Limite atingido. Aguarde antes de tentar novamente.' : message)
    }
  }

  //* ── Update profile *//
  const handleUpdateProfile = async (data: { displayName?: string; email?: string }) => {
    if (!sessionUser) return
    try {
      await updateUserProfile(sessionUser.id, data)
      const updated = await getUserProfile(sessionUser.id)
      if (updated) setProfile(updated)
      toast.success('Perfil atualizado com sucesso')
    } catch (err: any) {
      toast.error(classifyError(err).message)
      throw err
    }
  }

  //* ── Change password *//
  const handleChangePassword = async (current: string, newPassword: string) => {
    try {
      await changePassword(current, newPassword)
      toast.success('Senha alterada com sucesso')
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
