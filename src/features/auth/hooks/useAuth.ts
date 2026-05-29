import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import {
  login,
  register,
  signOut,
  signInWithGoogle,
  resetPassword,
  updateUserProfile,
  changePassword,
  getUserProfile
} from '@/services/firebase/auth'
import { ROUTES, FIREBASE_ERRORS } from '@/constants'
import type { LoginInput, RegisterInput } from '@/types'
import { getFirebaseError } from '@/utils'


export function useAuth() {
  const router = useRouter()
  const { firebaseUser, profile, loading, initialized, setProfile, reset } = useAuthStore()

  const handleLogin = async (input: LoginInput) => {
    try {
      await login(input)
      toast.success('Bem-vindo de volta!', { description: 'Usuário logado.' })
      router.push(ROUTES.dashboard)
    } catch (err: any) {
      toast.error(getFirebaseError(err))
      throw err
    }
  }

  const handleRegister = async (input: RegisterInput) => {
    try {
      await register(input)
      router.push(ROUTES.dashboard)
    } catch (err: any) {
      toast.error(getFirebaseError(err))
      throw err
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
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
      toast.error(getFirebaseError(err))
      throw err
    }
  }

  const handleUpdateProfile = async (data: { displayName?: string; email?: string }) => {
    if (!firebaseUser) return
    try {
      await updateUserProfile(firebaseUser.uid, data)
      // Refresh profile in store
      const updated = await getUserProfile(firebaseUser.uid)
      if (updated) setProfile(updated)
      toast.success('Perfil atualizado com sucesso!')
    } catch (err: any) {
      toast.error(getFirebaseError(err))
      throw err
    }
  }

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await changePassword(currentPassword, newPassword)
      reset()
      toast.success('Senha alterada com sucesso!')
      router.push(ROUTES.dashboard)
    } catch (err: any) {
      toast.error(getFirebaseError(err))
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
    updateProfile: handleUpdateProfile,
    changePassword: handleChangePassword,
  }
}
