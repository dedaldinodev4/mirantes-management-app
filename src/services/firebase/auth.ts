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
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import { 
  doc, setDoc, getDoc, updateDoc, serverTimestamp, 
  getDocs,
  query,
  collection,
  where
} from 'firebase/firestore'
import { auth, db } from './config'
import { COLLECTIONS } from '@/constants'
import type { User, RegisterInput, LoginInput } from '@/types'

const googleProvider = new GoogleAuthProvider()

//* Register *//
export async function register({ displayName, email, password }: RegisterInput) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)

  await updateProfile(credential.user, { displayName })

  // Create user document in Firestore
  await setDoc(doc(db, COLLECTIONS.users, credential.user.uid), {
    uid: credential.user.uid,
    email: email.toLowerCase().trim(),
    displayName,
    photoURL: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return credential.user
}

//* Login *//
export async function login({ email, password }: LoginInput) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

//* Google Sign In *//
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

//* Sign Out *//
export async function signOut() {
  await firebaseSignOut(auth)
}

//* Password Reset (unauthenticated) *//
export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email)
}

//* Update Profile (authenticated) *//
export async function updateUserProfile(uid: string, data: { displayName?: string; email?: string }) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  if (data.displayName) {
    await updateProfile(user, { displayName: data.displayName })
  }
  await updateDoc(doc(db, COLLECTIONS.users, uid), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}


//* Change Password (authenticated, requires re-auth) *//
export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('Not authenticated')
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
}


//* Get Multiple User Profiles *//
export async function getUserProfiles(uids: string[]): Promise<User[]> {
  if (!uids.length) return []
  const snaps = await Promise.all(
    uids.map((uid) => getDoc(doc(db, COLLECTIONS.users, uid))),
  )
  return snaps
    .filter((s) => s.exists())
    .map((s) => ({ uid: s.id, ...s.data() }) as User)
}


//* Get User Profile *//
export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid))
  if (!snap.exists()) return null
  return { uid: snap.id, ...snap.data() } as User
}


// Requires email field to be stored lowercase (guaranteed by register/signInWithGoogle)
export async function findUserByEmail(email: string): Promise<User | null> {
  const normalised = email.toLowerCase().trim()
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.users),
      where('email', '==', normalised),
    ),
  )
  if (snap.empty) return null
  const d = snap.docs[0]
  return { uid: d.id, ...d.data() } as User
}

//* Auth State Observer *//
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback)
}
