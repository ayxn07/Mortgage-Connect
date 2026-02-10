import { firestore } from './firebase';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { Agent, AgentFilters } from '../types';

/**
 * Fetch all agents (users with role === 'agent').
 * Optionally accepts filters for category and availability.
 */
export async function fetchAgents(filters?: Partial<AgentFilters>): Promise<Agent[]> {
  let query: FirebaseFirestoreTypes.Query = firestore()
    .collection('users')
    .where('role', '==', 'agent');

  if (filters?.availableOnly) {
    query = query.where('availability', '==', true);
  }

  if (filters?.minRating) {
    query = query.where('avgRating', '>=', filters.minRating);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ ...doc.data(), uid: doc.id }) as Agent);
}

/**
 * Fetch a single agent by their uid.
 */
export async function fetchAgentById(agentId: string): Promise<Agent | null> {
  const doc = await firestore().collection('users').doc(agentId).get();
  if (!doc.exists) return null;
  return { ...doc.data(), uid: doc.id } as Agent;
}

/**
 * Fetch featured agents for the Home screen (top 5 by rating).
 */
export async function fetchFeaturedAgents(limit = 5): Promise<Agent[]> {
  const snapshot = await firestore()
    .collection('users')
    .where('role', '==', 'agent')
    .orderBy('avgRating', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({ ...doc.data(), uid: doc.id }) as Agent);
}

/**
 * Subscribe to real-time agent updates.
 * Returns an unsubscribe function.
 */
export function subscribeToAgents(
  onUpdate: (agents: Agent[]) => void,
  onError?: (error: Error) => void
) {
  return firestore()
    .collection('users')
    .where('role', '==', 'agent')
    .onSnapshot(
      (snapshot) => {
        const agents = snapshot.docs.map((doc) => ({ ...doc.data(), uid: doc.id }) as Agent);
        onUpdate(agents);
      },
      (error) => {
        onError?.(error);
      }
    );
}
