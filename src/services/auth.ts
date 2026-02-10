import { auth, firestore } from './firebase';
import type { User, CreateUserInput } from '../types';

/**
 * Sign in with email & password.
 */
export async function signInWithEmail(email: string, password: string) {
  return auth().signInWithEmailAndPassword(email, password);
}

/**
 * Create a new account and an associated Firestore user document.
 */
export async function signUpWithEmail({ email, password, displayName, phone }: CreateUserInput) {
  const credential = await auth().createUserWithEmailAndPassword(email, password);

  // Create the companion Firestore document
  const userData: Omit<User, 'createdAt' | 'updatedAt'> = {
    uid: credential.user.uid,
    email,
    displayName,
    photoURL: null,
    role: 'user',
    phone: phone ?? null,
  };

  await firestore()
    .collection('users')
    .doc(credential.user.uid)
    .set({
      ...userData,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

  return credential;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  return auth().signOut();
}

/**
 * Send a password-reset email.
 */
export async function resetPassword(email: string) {
  return auth().sendPasswordResetEmail(email);
}

/**
 * Fetch the current user's Firestore document.
 */
export async function getCurrentUserDoc(): Promise<User | null> {
  const currentUser = auth().currentUser;
  if (!currentUser) return null;

  const doc = await firestore().collection('users').doc(currentUser.uid).get();
  if (!doc.exists) return null;

  return doc.data() as User;
}

/**
 * Update fields on the current user's Firestore document.
 */
export async function updateUserDoc(uid: string, data: Partial<Omit<User, 'uid' | 'createdAt'>>) {
  return firestore()
    .collection('users')
    .doc(uid)
    .update({
      ...data,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
}
