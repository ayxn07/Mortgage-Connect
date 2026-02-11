import { auth, firestore } from './firebase';
import type { User, CreateUserInput } from '../types';

/**
 * Sign in with email & password.
 */
export async function signInWithEmail(email: string, password: string) {
  return auth().signInWithEmailAndPassword(email, password);
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
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);

  // Sign in to Firebase with the credential
  const userCredential = await auth().signInWithCredential(googleCredential);

  // Check if user document exists in Firestore
  const userDocRef = firestore().collection('users').doc(userCredential.user.uid);
  const userDocSnap = await userDocRef.get();
  const isNewUser = !userDocSnap.exists;

  return { isNewUser, user: userCredential.user };
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

  await firestore()
    .collection('users')
    .doc(uid)
    .set({
      ...userData,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Fetch the first admin user from Firestore.
 * Returns null if no admin exists.
 */
export async function getAdminUser(): Promise<User | null> {
  const snapshot = await firestore()
    .collection('users')
    .where('role', '==', 'admin')
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  return snapshot.docs[0].data() as User;
}
