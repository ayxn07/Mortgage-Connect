import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import type { SupportQuery, CreateSupportQueryInput } from '../types';

/**
 * Submit a new support query / feedback ticket.
 */
export async function createSupportQuery(
  uid: string,
  input: CreateSupportQueryInput
): Promise<string> {
  const docRef = await addDoc(collection(db, 'supportQueries'), {
    uid,
    ...input,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Fetch all support queries for a user.
 */
export async function fetchUserSupportQueries(uid: string): Promise<SupportQuery[]> {
  try {
    console.log('Fetching support queries from Firestore for uid:', uid);
    const q = query(
      collection(db, 'supportQueries'),
      where('uid', '==', uid)
    );
    const snapshot = await getDocs(q);

    console.log('Firestore query completed. Document count:', snapshot.size);
    
    const queries = snapshot.docs.map((d: any) => {
      const data = d.data();
      console.log('Document data:', { id: d.id, ...data });
      return { ...data, queryId: d.id } as SupportQuery;
    });
    
    // Sort by createdAt in memory to avoid needing a composite index
    queries.sort((a: any, b: any) => {
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
  const snap = await getDoc(doc(db, 'supportQueries', queryId));
  if (!snap.exists()) return null;
  return { ...snap.data(), queryId: snap.id } as SupportQuery;
}
