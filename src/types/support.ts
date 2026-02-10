import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/** Support ticket categories */
export type SupportCategory = 'general' | 'technical' | 'billing' | 'feedback';

/** Support ticket status flow */
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

/**
 * Support query/ticket document.
 * Stored in Firestore `supportQueries/{queryId}`.
 */
export interface SupportQuery {
  queryId: string;
  uid: string;
  category: SupportCategory;
  subject: string;
  message: string;
  name: string;
  email: string;
  attachments?: string[]; // Firebase Storage URLs
  status: SupportStatus;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

/** Input for creating a support ticket */
export interface CreateSupportQueryInput {
  category: SupportCategory;
  name: string;
  email: string;
  subject: string;
  message: string;
}

/** FAQ item used on support screen */
export interface FAQ {
  id: string;
  question: string;
  answer: string;
}
