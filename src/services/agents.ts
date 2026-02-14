import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
} from '@react-native-firebase/firestore';
import type { Agent, AgentFilters } from '../types';

/**
 * Fetch all agents (users with role === 'agent').
 * Optionally accepts filters for category and availability.
 */
export async function fetchAgents(filters?: Partial<AgentFilters>): Promise<Agent[]> {
  const constraints: any[] = [where('role', '==', 'agent')];

  if (filters?.availableOnly) {
    constraints.push(where('availability', '==', true));
  }

  if (filters?.minRating) {
    constraints.push(where('avgRating', '>=', filters.minRating));
  }

  const q = query(collection(db, 'users'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d: any) => ({ ...d.data(), uid: d.id }) as Agent);
}

/**
 * Fetch a single agent by their uid.
 */
export async function fetchAgentById(agentId: string): Promise<Agent | null> {
  const snap = await getDoc(doc(db, 'users', agentId));
  if (!snap.exists()) return null;
  return { ...snap.data(), uid: snap.id } as Agent;
}

/**
 * Fetch featured agents for the Home screen (top 5 by rating).
 */
export async function fetchFeaturedAgents(count = 5): Promise<Agent[]> {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'agent'),
    orderBy('avgRating', 'desc'),
    firestoreLimit(count)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d: any) => ({ ...d.data(), uid: d.id }) as Agent);
}

/**
 * Subscribe to real-time agent updates.
 * Returns an unsubscribe function.
 */
export function subscribeToAgents(
  onUpdate: (agents: Agent[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, 'users'), where('role', '==', 'agent'));

  return onSnapshot(
    q,
    (snapshot) => {
      const agents = snapshot.docs.map((d: any) => ({ ...d.data(), uid: d.id }) as Agent);
      onUpdate(agents);
    },
    (error: Error) => {
      onError?.(error);
    }
  );
}
