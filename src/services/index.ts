/**
 * Central service exports for MortgageConnect.
 *
 * Usage:
 *   import { signInWithEmail, fetchAgents } from '@/src/services';
 */

// Firebase core
export { auth, firestore, storage } from './firebase';

// Auth service
export {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetPassword,
  getCurrentUserDoc,
  updateUserDoc,
} from './auth';

// Agent service
export {
  fetchAgents,
  fetchAgentById,
  fetchFeaturedAgents,
  subscribeToAgents,
} from './agents';

// Application service
export {
  createApplication,
  fetchUserApplications,
  fetchApplicationById,
  updateApplication,
  uploadDocument,
} from './applications';

// Support service
export {
  createSupportQuery,
  fetchUserSupportQueries,
  fetchSupportQueryById,
} from './support';

// Review service
export {
  createReview,
  fetchAgentReviews,
} from './reviews';

// Seed service
export { seedTestAgents, resetSeed } from './seedAgents';
