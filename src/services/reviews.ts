import { firestore } from './firebase';
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
  const batch = firestore().batch();

  // Create the review document
  const reviewRef = firestore().collection('reviews').doc();
  batch.set(reviewRef, {
    reviewId: reviewRef.id,
    agentId: input.agentId,
    userId,
    userName,
    rating: input.rating,
    comment: input.comment,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  // Update agent's review stats (increment count, recalculate avg)
  const agentRef = firestore().collection('users').doc(input.agentId);
  batch.update(agentRef, {
    reviewCount: firestore.FieldValue.increment(1),
    totalReviews: firestore.FieldValue.increment(1),
    updatedAt: firestore.FieldValue.serverTimestamp(),
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
  const snapshot = await firestore()
    .collection('reviews')
    .where('agentId', '==', agentId)
    .get();

  const reviews = snapshot.docs.map((doc) => doc.data() as Review);
  
  // Sort in memory to avoid needing a composite index
  return reviews.sort((a, b) => {
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

  await firestore().collection('users').doc(agentId).update({
    avgRating,
    reviewCount: reviews.length,
  });
}
