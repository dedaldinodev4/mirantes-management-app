import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import { COLLECTIONS } from '@/constants'
import type { User, RegisterInput, LoginInput } from '@/types'

const googleProvider = new GoogleAuthProvider()

// ── Register ──────────────────────────────────────────────────────────────────
export async function register({ displayName, email, password }: RegisterInput) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)

  await updateProfile(credential.user, { displayName })

  // Create user document in Firestore
  await setDoc(doc(db, COLLECTIONS.users, credential.user.uid), {
    uid: credential.user.uid,
    email,
    displayName,
    photoURL: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return credential.user
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function login({ email, password }: LoginInput) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

// ── Google Sign In ────────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider)
  const user = credential.user

  // Upsert user document
  const userRef = doc(db, COLLECTIONS.users, user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  return user
}

// ── Sign Out ──────────────────────────────────────────────────────────────────
export async function signOut() {
  await firebaseSignOut(auth)
}

// ── Password Reset ────────────────────────────────────────────────────────────
export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email)
}

// ── Get User Profile ──────────────────────────────────────────────────────────
export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid))
  if (!snap.exists()) return null
  return snap.data() as User
}

// ── Auth State Observer ───────────────────────────────────────────────────────
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback)
}
