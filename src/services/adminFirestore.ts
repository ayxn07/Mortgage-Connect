/**
 * Admin Firestore service for mobile app.
 * Mirrors the admin dashboard's firestore.ts but uses @react-native-firebase.
 */
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import type { User, UserRole } from '../types/user';
import type { Agent } from '../types/agent';
import type { MortgageApplication, ApplicationStatus } from '../types/application';
import type { SupportQuery, SupportStatus } from '../types/support';
import type { Review } from '../types/review';

// ============ Users ============

export async function fetchAllUsers(): Promise<User[]> {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d: any) => ({ ...d.data(), uid: d.id }) as User);
}

export async function fetchUserById(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { ...snap.data(), uid: snap.id } as User;
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    role,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));
}

export function subscribeToUsers(callback: (users: User[]) => void) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(
      (d: any) => ({ ...d.data(), uid: d.id }) as User
    );
    callback(users);
  });
}

// ============ Agents ============

export async function fetchAllAgents(): Promise<Agent[]> {
  const q = query(collection(db, 'users'), where('role', '==', 'agent'));
  const snapshot = await getDocs(q);
  const agents = snapshot.docs.map((d: any) => ({ ...d.data(), uid: d.id }) as Agent);
  return agents.sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

export async function toggleAgentAvailability(
  uid: string,
  availability: boolean
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    availability,
    updatedAt: serverTimestamp(),
  });
}

export async function fetchAgentReviews(agentId: string): Promise<Review[]> {
  const q = query(
    collection(db, 'reviews'),
    where('agentId', '==', agentId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d: any) => ({ ...d.data(), reviewId: d.id }) as Review
  );
}

// ============ Applications ============

export async function fetchAllApplications(): Promise<MortgageApplication[]> {
  const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d: any) => ({ ...d.data(), applicationId: d.id }) as MortgageApplication
  );
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  notes?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (notes !== undefined) {
    updateData.notes = notes;
  }
  await updateDoc(doc(db, 'applications', id), updateData);
}

export async function assignAgentToApplication(
  applicationId: string,
  agentId: string
): Promise<void> {
  await updateDoc(doc(db, 'applications', applicationId), {
    agentId,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToApplications(
  callback: (apps: MortgageApplication[]) => void
) {
  const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const apps = snapshot.docs.map(
      (d: any) => ({ ...d.data(), applicationId: d.id }) as MortgageApplication
    );
    callback(apps);
  });
}

// ============ Support ============

export async function fetchAllSupportQueries(): Promise<SupportQuery[]> {
  const q = query(collection(db, 'supportQueries'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d: any) => ({ ...d.data(), queryId: d.id }) as SupportQuery
  );
}

export async function updateSupportStatus(
  queryId: string,
  status: SupportStatus
): Promise<void> {
  await updateDoc(doc(db, 'supportQueries', queryId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function addAdminResponse(
  queryId: string,
  response: string
): Promise<void> {
  await updateDoc(doc(db, 'supportQueries', queryId), {
    adminResponse: response,
    status: 'in_progress' as SupportStatus,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToSupportQueries(
  callback: (queries: SupportQuery[]) => void
) {
  const q = query(collection(db, 'supportQueries'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const queries = snapshot.docs.map(
      (d: any) => ({ ...d.data(), queryId: d.id }) as SupportQuery
    );
    callback(queries);
  });
}

// ============ Dashboard Stats ============

export interface EnhancedDashboardStats {
  totalUsers: number;
  totalAgents: number;
  totalApplications: number;
  totalSupportTickets: number;
  pendingApplications: number;
  openTickets: number;
  approvedApplications: number;
  rejectedApplications: number;
  activeAgents: number;
  totalChats: number;
  recentUsersCount: number;
  applicationsByStatus: Record<string, number>;
  usersByRole: Record<string, number>;
}

export async function fetchEnhancedDashboardStats(): Promise<EnhancedDashboardStats> {
  const appsQuery = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
  const supportQuery = query(collection(db, 'supportQueries'), orderBy('createdAt', 'desc'));

  const [usersSnap, appsSnap, supportSnap, chatsSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(appsQuery),
    getDocs(supportQuery),
    getDocs(collection(db, 'chats')),
  ]);

  const users = usersSnap.docs.map((d: any) => d.data());
  const apps = appsSnap.docs.map((d: any) => d.data());
  const tickets = supportSnap.docs.map((d: any) => d.data());

  // Count users by role
  const usersByRole: Record<string, number> = {};
  let agentCount = 0;
  let activeAgentCount = 0;
  for (const u of users) {
    const role = (u as any).role || 'user';
    usersByRole[role] = (usersByRole[role] || 0) + 1;
    if (role === 'agent') {
      agentCount++;
      if ((u as any).availability) activeAgentCount++;
    }
  }

  // Count applications by status
  const applicationsByStatus: Record<string, number> = {};
  for (const a of apps) {
    const status = (a as any).status || 'draft';
    applicationsByStatus[status] = (applicationsByStatus[status] || 0) + 1;
  }

  // Recent users (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentUsersCount = users.filter((u: any) => {
    const created = (u as any).createdAt?.toDate?.();
    return created && created >= sevenDaysAgo;
  }).length;

  return {
    totalUsers: users.length,
    totalAgents: agentCount,
    totalApplications: apps.length,
    totalSupportTickets: tickets.length,
    pendingApplications: apps.filter(
      (a: any) => (a as any).status === 'submitted' || (a as any).status === 'pre_approval'
    ).length,
    openTickets: tickets.filter(
      (t: any) => (t as any).status === 'open' || (t as any).status === 'in_progress'
    ).length,
    approvedApplications: apps.filter(
      (a: any) =>
        (a as any).status === 'offer_letter' ||
        (a as any).status === 'disbursement' ||
        (a as any).status === 'completed'
    ).length,
    rejectedApplications: apps.filter((a: any) => (a as any).status === 'rejected').length,
    activeAgents: activeAgentCount,
    totalChats: chatsSnap.size,
    recentUsersCount,
    applicationsByStatus,
    usersByRole,
  };
}

export async function fetchRecentUsers(count = 6): Promise<User[]> {
  const q = query(
    collection(db, 'users'),
    orderBy('createdAt', 'desc'),
    firestoreLimit(count)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d: any) => ({ ...d.data(), uid: d.id }) as User);
}

export async function fetchActiveAgents(): Promise<Agent[]> {
  const q = query(collection(db, 'users'), where('role', '==', 'agent'));
  const snapshot = await getDocs(q);
  const agents = snapshot.docs.map((d: any) => ({ ...d.data(), uid: d.id }) as Agent);
  return agents.sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}
