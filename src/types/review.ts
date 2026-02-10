import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Review document.
 * Stored in Firestore `reviews/{reviewId}`.
 */
export interface Review {
  reviewId: string;
  agentId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

/** Input for submitting a new review */
export interface CreateReviewInput {
  agentId: string;
  rating: number;
  comment: string;
}
