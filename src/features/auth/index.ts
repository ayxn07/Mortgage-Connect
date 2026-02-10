/**
 * Auth feature module.
 *
 * Re-exports everything related to authentication so screens
 * can import from a single feature path:
 *
 *   import { useAuth, signInWithEmail, User } from '@/src/features/auth';
 */

// Hook
export { useAuth } from '../../hooks/useAuth';

// Store
export { useAuthStore } from '../../store/authStore';

// Services
export {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetPassword,
  getCurrentUserDoc,
  updateUserDoc,
} from '../../services/auth';

// Types
export type {
  User,
  UserRole,
  CreateUserInput,
  SignInInput,
  NotificationPreferences,
  UserSettings,
} from '../../types';
