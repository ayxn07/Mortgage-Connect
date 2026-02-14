import { create } from 'zustand';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import type { User , CreateUserInput } from '../types';
import { useChatStore } from './chatStore';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as firebaseSignOut,
  resetPassword as firebaseResetPassword,
  getCurrentUserDoc,
  updateUserDoc,
  signInWithGoogle,
  createGoogleUserDoc,
} from '../services/auth';


interface AuthState {
  /** Firebase Auth user (null when signed out) */
  firebaseUser: FirebaseAuthTypes.User | null;
  /** Firestore user document */
  userDoc: User | null;
  /** Whether the initial auth check is still loading */
  loading: boolean;
  /** Last auth error message */
  error: string | null;
  /** Whether the auth listener has been initialized */
  initialized: boolean;
  /** Whether a new Google user is completing registration (prevents premature redirect) */
  pendingGoogleRegistration: boolean;
  /** Internal flag: true while signInWithGoogle() is running (prevents onAuthStateChanged from interfering) */
  _signingInWithGoogle: boolean;
  /** Pending credentials for OTP verification */
  pendingEmail: string | null;
  pendingPassword: string | null;

  // --- Actions ---
  /** Initialize the auth state listener (call once in root layout) */
  initialize: () => () => void;
  /** Sign in with email & password (initiates OTP flow) */
  signIn: (email: string, password: string) => Promise<void>;
  /** Complete sign-in after OTP verification */
  completeSignIn: (email: string) => Promise<void>;
  /** Create a new account (initiates OTP flow) */
  signUp: (input: CreateUserInput) => Promise<void>;
  /** Complete sign-up after OTP verification */
  completeSignUp: () => Promise<void>;
  /** Sign in with Google */
  signInWithGoogle: () => Promise<{ isNewUser: boolean }>;
  /** Complete Google user registration */
  completeGoogleRegistration: (phone?: string) => Promise<void>;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Send password reset email */
  resetPassword: (email: string) => Promise<void>;
  /** Refresh the Firestore user document */
  refreshUserDoc: () => Promise<void>;
  /** Update user profile fields */
  updateProfile: (data: Partial<Omit<User, 'uid' | 'createdAt'>>) => Promise<void>;
  /** Clear error */
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  userDoc: null,
  loading: true,
  error: null,
  initialized: false,
  pendingGoogleRegistration: false,
  _signingInWithGoogle: false,
  pendingEmail: null,
  pendingPassword: null,

  initialize: () => {
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[Auth] State changed:', user ? `User ${user.uid}` : 'No user');

      // If a Google sign-in is actively in progress, let signInWithGoogle()
      // handle the state updates instead of this listener.
      const currentState = get();
      if (currentState._signingInWithGoogle) {
        console.log('[Auth] Skipping onAuthStateChanged — Google sign-in in progress');
        set({ firebaseUser: user, initialized: true });
        return;
      }

      // If pendingGoogleRegistration is already set (signInWithGoogle just completed),
      // don't let onAuthStateChanged overwrite it — just keep the flag and update firebaseUser.
      if (currentState.pendingGoogleRegistration && user) {
        console.log('[Auth] Skipping full processing — pendingGoogleRegistration already set');
        set({ firebaseUser: user, initialized: true, loading: false });
        return;
      }

      if (user) {
        try {
          const doc = await getCurrentUserDoc();
          // Re-check flags after the async call in case signInWithGoogle completed
          // while we were fetching the user doc
          const latestState = get();
          if (latestState._signingInWithGoogle || latestState.pendingGoogleRegistration) {
            console.log('[Auth] Skipping state update — Google sign-in handled state');
            set({ firebaseUser: user, initialized: true, loading: false });
            return;
          }
          if (doc) {
            // Existing user with Firestore doc
            set({ firebaseUser: user, userDoc: doc, loading: false, initialized: true, pendingGoogleRegistration: false });
            console.log('[Auth] User doc loaded:', doc.displayName);
          } else {
            // User exists in Firebase Auth but has no Firestore doc
            // This means they signed in with Google but haven't completed registration
            console.log('[Auth] No user doc found - pending Google registration');
            set({ firebaseUser: user, userDoc: null, loading: false, initialized: true, pendingGoogleRegistration: true });
          }
        } catch (err) {
          console.error('[Auth] Failed to load user doc:', err);
          set({ firebaseUser: user, loading: false, initialized: true });
        }
      } else {
        set({ firebaseUser: null, userDoc: null, loading: false, initialized: true, pendingGoogleRegistration: false });
      }
    });

    return unsubscribe;
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // Store credentials for later use after OTP verification
      set({ pendingEmail: email, pendingPassword: password });

      // Verify credentials (this will sign in and immediately sign out)
      const { sendOTP } = await import('../services/otp');
      await sendOTP(email, password);

      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false, pendingEmail: null, pendingPassword: null });
      throw err;
    }
  },

  completeSignIn: async (email) => {
    set({ loading: true, error: null });
    try {
      const { pendingEmail, pendingPassword } = get();

      if (!pendingEmail || !pendingPassword) {
        throw new Error('Session expired. Please login again.');
      }

      // Now actually sign in
      await signInWithEmail(pendingEmail, pendingPassword);
      const doc = await getCurrentUserDoc();

      set({
        userDoc: doc,
        loading: false,
        pendingEmail: null,
        pendingPassword: null
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  signUp: async (input) => {
    set({ loading: true, error: null });
    try {
      // Store credentials for later use after OTP verification
      set({ pendingEmail: input.email, pendingPassword: input.password });

      // Create the account
      await signUpWithEmail(input);

      // Sign out immediately - they need to verify OTP
      await firebaseSignOut();

      // Send OTP
      const { sendSignupOTP } = await import('../services/otp');
      await sendSignupOTP(input.email);

      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false, pendingEmail: null, pendingPassword: null });
      throw err;
    }
  },

  completeSignUp: async () => {
    set({ loading: true, error: null });
    try {
      const { pendingEmail, pendingPassword } = get();

      if (!pendingEmail || !pendingPassword) {
        throw new Error('Session expired. Please sign up again.');
      }

      // Sign in with the credentials
      await signInWithEmail(pendingEmail, pendingPassword);
      const doc = await getCurrentUserDoc();

      set({
        userDoc: doc,
        loading: false,
        pendingEmail: null,
        pendingPassword: null
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null, _signingInWithGoogle: true });
    try {
      const { isNewUser, user } = await signInWithGoogle();
      console.log('[Auth] Google sign-in completed. isNewUser:', isNewUser);

      if (!isNewUser) {
        // Existing user - load their document
        const doc = await getCurrentUserDoc();
        set({ firebaseUser: user, userDoc: doc, loading: false, pendingGoogleRegistration: false, _signingInWithGoogle: false });
        console.log('[Auth] Existing Google user loaded');
      } else {
        // New user - flag pending registration so other screens don't redirect to /(tabs)
        // IMPORTANT: Set pendingGoogleRegistration BEFORE clearing _signingInWithGoogle
        // to prevent onAuthStateChanged from interfering in the gap between these updates
        set({ firebaseUser: user, userDoc: null, loading: false, pendingGoogleRegistration: true, _signingInWithGoogle: false });
        console.log('[Auth] New Google user - pending registration, pendingGoogleRegistration set to true');
      }

      return { isNewUser };
    } catch (err: any) {
      set({ error: err.message, loading: false, _signingInWithGoogle: false });
      throw err;
    }
  },

  completeGoogleRegistration: async (phone?: string) => {
    set({ loading: true, error: null });
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');

      await createGoogleUserDoc(
        currentUser.uid,
        currentUser.email!,
        currentUser.displayName || 'User',
        currentUser.photoURL,
        phone
      );

      const doc = await getCurrentUserDoc();
      set({ userDoc: doc, loading: false, pendingGoogleRegistration: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      // Clean up chat subscriptions and presence before signing out
      const userId = get().firebaseUser?.uid;
      if (userId) {
        await useChatStore.getState().cleanup(userId);
      }
      await firebaseSignOut();
      set({
        firebaseUser: null,
        userDoc: null,
        loading: false,
        pendingGoogleRegistration: false,
        pendingEmail: null,
        pendingPassword: null
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  resetPassword: async (email) => {
    set({ error: null });
    try {
      await firebaseResetPassword(email);
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  refreshUserDoc: async () => {
    try {
      const doc = await getCurrentUserDoc();
      set({ userDoc: doc });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateProfile: async (data) => {
    const { userDoc } = get();
    if (!userDoc) throw new Error('No user logged in');

    try {
      await updateUserDoc(userDoc.uid, data);
      set({ userDoc: { ...userDoc, ...data } as User });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
