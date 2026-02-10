import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * Convenience hook for auth state and actions.
 *
 * Initializes the Firebase auth listener on first mount.
 * Use in root layout to bootstrap auth, and in any screen
 * that needs current user info or auth actions.
 *
 * @example
 * ```tsx
 * const { user, loading, signIn, signOut } = useAuth();
 * ```
 */
export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (!store.initialized) {
      const unsubscribe = store.initialize();
      return unsubscribe;
    }
  }, [store.initialized]);

  return {
    /** Firebase Auth user object */
    user: store.firebaseUser,
    /** Firestore user document with role, displayName, etc. */
    userDoc: store.userDoc,
    /** Whether initial auth check is still loading */
    loading: store.loading,
    /** Whether user is authenticated */
    isAuthenticated: !!store.firebaseUser,
    /** Last error message */
    error: store.error,
    /** Sign in with email & password */
    signIn: store.signIn,
    /** Create account */
    signUp: store.signUp,
    /** Sign out */
    signOut: store.signOut,
    /** Send password reset email */
    resetPassword: store.resetPassword,
    /** Refresh user document from Firestore */
    refreshUserDoc: store.refreshUserDoc,
    /** Update profile fields */
    updateProfile: store.updateProfile,
    /** Clear error */
    clearError: store.clearError,
  };
}
