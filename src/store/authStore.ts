import { create } from 'zustand';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { auth } from '../services/firebase';
import type { User } from '../types';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as firebaseSignOut,
  resetPassword as firebaseResetPassword,
  getCurrentUserDoc,
  updateUserDoc,
} from '../services/auth';
import type { CreateUserInput } from '../types';

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

  // --- Actions ---
  /** Initialize the auth state listener (call once in root layout) */
  initialize: () => () => void;
  /** Sign in with email & password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Create a new account */
  signUp: (input: CreateUserInput) => Promise<void>;
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

  initialize: () => {
    // Set up auth state listener
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      console.log('[Auth] State changed:', user ? `User ${user.uid}` : 'No user');
      
      set({ firebaseUser: user, loading: false, initialized: true });

      if (user) {
        try {
          const doc = await getCurrentUserDoc();
          set({ userDoc: doc });
          console.log('[Auth] User doc loaded:', doc?.displayName);
        } catch (err) {
          console.error('[Auth] Failed to load user doc:', err);
          // User doc may not exist yet
        }
      } else {
        set({ userDoc: null });
      }
    });
    
    return unsubscribe;
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmail(email, password);
      const doc = await getCurrentUserDoc();
      set({ userDoc: doc, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  signUp: async (input) => {
    set({ loading: true, error: null });
    try {
      await signUpWithEmail(input);
      const doc = await getCurrentUserDoc();
      set({ userDoc: doc, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      await firebaseSignOut();
      set({ firebaseUser: null, userDoc: null, loading: false });
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
