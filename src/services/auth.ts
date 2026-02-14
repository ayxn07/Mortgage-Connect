import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  signInWithCredential,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseAuthSignOut,
  GoogleAuthProvider,
} from '@react-native-firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
  getDocs,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import type { User, CreateUserInput } from '../types';

/**
 * Sign in with email & password.
 */
export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign in with Google using @react-native-google-signin + Firebase Auth.
 * Launches the native Google sign-in dialog, obtains an ID token,
 * then signs in to Firebase with a Google credential.
 * Returns { isNewUser: boolean, user: FirebaseAuthTypes.User }
 */
export async function signInWithGoogle() {
  // Lazy-load the native module so the app doesn't crash if the
  // native binary hasn't been rebuilt yet.
  const { GoogleSignin } = require('@react-native-google-signin/google-signin');

  // Check if Google Play Services are available (Android)
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // Launch the native Google sign-in dialog
  const signInResult = await GoogleSignin.signIn();

  console.log('Google Sign-In result:', signInResult);

  // Extract the ID token from the result
  const idToken = signInResult?.data?.idToken;
  if (!idToken) {
    console.error('No ID token returned from Google Sign-In result. Full result:', signInResult);
    throw new Error('Google sign-in failed: no ID token returned');
  }

  // Create a Firebase Google credential with the token
  const googleCredential = GoogleAuthProvider.credential(idToken);

  // Sign in to Firebase with the credential
  const userCredential = await signInWithCredential(auth, googleCredential);

  // Check if user document exists in Firestore
  const userDocRef = doc(db, 'users', userCredential.user.uid);
  const userDocSnap = await getDoc(userDocRef);
  const isNewUser = !userDocSnap.exists();

  return { isNewUser, user: userCredential.user };
}

/**
 * Create a new account and an associated Firestore user document.
 */
export async function signUpWithEmail({ email, password, displayName, phone }: CreateUserInput) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  // Create the companion Firestore document
  const userData: Omit<User, 'createdAt' | 'updatedAt'> = {
    uid: credential.user.uid,
    email,
    displayName,
    photoURL: null,
    role: 'user',
    phone: phone ?? null,
  };

  await setDoc(doc(db, 'users', credential.user.uid), {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return credential;
}

/**
 * Sign out the current user (Firebase + Google).
 */
export async function signOut() {
  try {
    // Lazy-load the native module
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    // Sign out of Google if the user signed in via Google
    const isGoogleSignedIn = await GoogleSignin.getCurrentUser();
    if (isGoogleSignedIn) {
      await GoogleSignin.signOut();
    }
  } catch {
    // Ignore Google sign-out errors — proceed with Firebase sign-out
  }
  return firebaseAuthSignOut(auth);
}

/**
 * Send a password-reset email.
 */
export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Fetch the current user's Firestore document.
 */
export async function getCurrentUserDoc(): Promise<User | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const snap = await getDoc(doc(db, 'users', currentUser.uid));
  if (!snap.exists()) return null;

  return snap.data() as User;
}

/**
 * Update fields on the current user's Firestore document.
 */
export async function updateUserDoc(uid: string, data: Partial<Omit<User, 'uid' | 'createdAt'>>) {
  return updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Create a Firestore user document for a Google Sign-In user.
 */
export async function createGoogleUserDoc(uid: string, email: string, displayName: string, photoURL: string | null, phone?: string) {
  const userData: Omit<User, 'createdAt' | 'updatedAt'> = {
    uid,
    email,
    displayName,
    photoURL,
    role: 'user',
    phone: phone ?? null,
  };

  await setDoc(doc(db, 'users', uid), {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Fetch the first admin user from Firestore.
 * Returns null if no admin exists.
 */
export async function getAdminUser(): Promise<User | null> {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'admin'),
    limit(1)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  return snapshot.docs[0].data() as User;
}
