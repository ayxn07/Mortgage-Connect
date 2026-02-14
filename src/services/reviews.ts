import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  increment,
} from '@react-native-firebase/firestore';
import type { Review, CreateReviewInput } from '../types';

/**
 * Submit a review for an agent.
 * Also updates the agent's avgRating and reviewCount.
 */
export async function createReview(
  userId: string,
  userName: string,
  input: CreateReviewInput
): Promise<string> {
  const batch = writeBatch(db);

  // Create the review document
  const reviewRef = doc(collection(db, 'reviews'));
  batch.set(reviewRef, {
    reviewId: reviewRef.id,
    agentId: input.agentId,
    userId,
    userName,
    rating: input.rating,
    comment: input.comment,
    createdAt: serverTimestamp(),
  });

  // Update agent's review stats (increment count, recalculate avg)
  const agentRef = doc(db, 'users', input.agentId);
  batch.update(agentRef, {
    reviewCount: increment(1),
    totalReviews: increment(1),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  // Recalculate average rating after commit
  await recalculateAgentRating(input.agentId);

  return reviewRef.id;
}

/**
 * Fetch all reviews for a given agent.
 */
export async function fetchAgentReviews(agentId: string): Promise<Review[]> {
  const q = query(
    collection(db, 'reviews'),
    where('agentId', '==', agentId)
  );
  const snapshot = await getDocs(q);

  const reviews = snapshot.docs.map((d: any) => d.data() as Review);

  // Sort in memory to avoid needing a composite index
  return reviews.sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime; // desc order
  });
}

/**
 * Recalculate an agent's average rating from all their reviews.
 */
async function recalculateAgentRating(agentId: string): Promise<void> {
  const reviews = await fetchAgentReviews(agentId);
  if (reviews.length === 0) return;

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = Math.round((totalRating / reviews.length) * 10) / 10;

  await updateDoc(doc(db, 'users', agentId), {
    avgRating,
    reviewCount: reviews.length,
  });
}
