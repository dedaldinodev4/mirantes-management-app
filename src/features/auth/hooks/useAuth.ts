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
      toast.success('Bem-vindo de volta!', { description: 'Usuário logado.' })
      router.push(ROUTES.dashboard)
    } catch (err: any) {
      const messages: Record<string, string> = {
        'auth/user-not-found': 'Nenhuma conta com este e-mail.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/too-many-requests': 'Muitas tentativas.Tente novamente mais tarde.',
        'auth/invalid-credential': 'E-mail ou senha inválida.',
      }
      toast.error(messages[err.code] ?? 'Login falhou. Por favor, tente novamente.')
      throw err
    }
  }

  const handleRegister = async (input: RegisterInput) => {
    try {
      await register(input)
      toast.success('Conta criada!', { description: `Bem-vindo, ${input.displayName}!` })
      router.push(ROUTES.dashboard)
    } catch (err: any) {
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'Uma conta com este e-mail já existe.',
        'auth/weak-password': 'A senha é muito fraca.',
      }
      toast.error(messages[err.code] ?? 'Registro falhou. Por favor, tente novamente.')
      throw err
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      toast.success('Entrou com Google!')
      router.push(ROUTES.dashboard)
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('Falha no login do Google. Por favor, tente novamente.')
      }
      throw err
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Saiu com sucesso.')
      router.push(ROUTES.login)
    } catch {
      toast.error('Não foi possível sair.')
    }
  }

  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email)
      toast.success('Redefinir e-mail enviado!', {
        description: 'Verifique sua caixa de entrada para o link de redefinição de senha.',
      })
    } catch (err: any) {
      toast.error('Não foi possível enviar o e-mail de redefinição.')
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
