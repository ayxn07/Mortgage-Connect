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
  const snapshot = await firestore()
    .collection('supportQueries')
    .where('uid', '==', uid)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ ...doc.data(), queryId: doc.id }) as SupportQuery);
}

/**
 * Fetch a single support query by ID.
 */
export async function fetchSupportQueryById(queryId: string): Promise<SupportQuery | null> {
  const doc = await firestore().collection('supportQueries').doc(queryId).get();
  if (!doc.exists) return null;
  return { ...doc.data(), queryId: doc.id } as SupportQuery;
}
