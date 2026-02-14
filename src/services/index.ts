/**
 * Central service exports for MortgageConnect.
 *
 * Usage:
 *   import { signInWithEmail, fetchAgents } from '@/src/services';
 */

// Firebase core
export { auth, db, storage } from './firebase';

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

// Chat service
export {
  createChat,
  findExistingChat,
  sendMessage,
  fetchMessages,
  subscribeToMessages,
  subscribeToChats,
  markChatAsRead,
  getTotalUnreadCount,
  setTypingStatus,
  subscribeToPresence,
  updateOnlineStatus,
  setCurrentChat,
  deleteMessage,
  editMessage,
  toggleArchiveChat,
  toggleMuteChat,
  deleteChat,
} from './chat';

// AI Chat service
export {
  createWelcomeMessages,
  detectCalculatorIntent,
  startCalculatorFlow,
  continueCalculatorFlow,
  callAIModel,
  processTextForQuickActions,
  generateMessageId,
} from './aiChat';
