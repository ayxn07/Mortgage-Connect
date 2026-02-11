import { firestore } from './firebase';
import type { SupportQuery, CreateSupportQueryInput } from '../types';

/**
 * Submit a new support query / feedback ticket.
 */
export async function createSupportQuery(
  uid: string,
  input: CreateSupportQueryInput
): Promise<string> {
  const docRef = await firestore()
    .collection('supportQueries')
    .add({
      uid,
      ...input,
      status: 'open',
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  return docRef.id;
}

/**
 * Fetch all support queries for a user.
 */
export async function fetchUserSupportQueries(uid: string): Promise<SupportQuery[]> {
  try {
    console.log('Fetching support queries from Firestore for uid:', uid);
    const snapshot = await firestore()
      .collection('supportQueries')
      .where('uid', '==', uid)
      .get();

    console.log('Firestore query completed. Document count:', snapshot.size);
    
    const queries = snapshot.docs.map((doc) => {
      const data = doc.data();
      console.log('Document data:', { id: doc.id, ...data });
      return { ...data, queryId: doc.id } as SupportQuery;
    });
    
    // Sort by createdAt in memory to avoid needing a composite index
    queries.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime; // desc order
    });
    
    return queries;
  } catch (error) {
    console.error('Error in fetchUserSupportQueries:', error);
    throw error;
  }
}

/**
 * Fetch a single support query by ID.
 */
export async function fetchSupportQueryById(queryId: string): Promise<SupportQuery | null> {
  const doc = await firestore().collection('supportQueries').doc(queryId).get();
  if (!doc.exists) return null;
  return { ...doc.data(), queryId: doc.id } as SupportQuery;
}
