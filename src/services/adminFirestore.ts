/**
 * Admin Firestore service for mobile app.
 * Mirrors the admin dashboard's firestore.ts but uses @react-native-firebase.
 */
import { firestore } from './firebase';
import type { User, UserRole } from '../types/user';
import type { Agent } from '../types/agent';
import type { MortgageApplication, ApplicationStatus } from '../types/application';
import type { SupportQuery, SupportStatus } from '../types/support';
import type { Review } from '../types/review';

// ============ Users ============

export async function fetchAllUsers(): Promise<User[]> {
  const snapshot = await firestore()
    .collection('users')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map((d) => ({ ...d.data(), uid: d.id }) as User);
}

export async function fetchUserById(uid: string): Promise<User | null> {
  const doc = await firestore().collection('users').doc(uid).get();
  if (!doc.exists) return null;
  return { ...doc.data(), uid: doc.id } as User;
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await firestore().collection('users').doc(uid).update({
    role,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
}

export async function deleteUser(uid: string): Promise<void> {
  await firestore().collection('users').doc(uid).delete();
}

export function subscribeToUsers(callback: (users: User[]) => void) {
  return firestore()
    .collection('users')
    .orderBy('createdAt', 'desc')
    .onSnapshot((snapshot) => {
      const users = snapshot.docs.map(
        (d) => ({ ...d.data(), uid: d.id }) as User
      );
      callback(users);
    });
}

// ============ Agents ============

export async function fetchAllAgents(): Promise<Agent[]> {
  const snapshot = await firestore()
    .collection('users')
    .where('role', '==', 'agent')
    .get();
  const agents = snapshot.docs.map((d) => ({ ...d.data(), uid: d.id }) as Agent);
  return agents.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

export async function toggleAgentAvailability(
  uid: string,
  availability: boolean
): Promise<void> {
  await firestore().collection('users').doc(uid).update({
    availability,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
}

export async function fetchAgentReviews(agentId: string): Promise<Review[]> {
  const snapshot = await firestore()
    .collection('reviews')
    .where('agentId', '==', agentId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(
    (d) => ({ ...d.data(), reviewId: d.id }) as Review
  );
}

// ============ Applications ============

export async function fetchAllApplications(): Promise<MortgageApplication[]> {
  const snapshot = await firestore()
    .collection('applications')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(
    (d) => ({ ...d.data(), applicationId: d.id }) as MortgageApplication
  );
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  notes?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
  if (notes !== undefined) {
    updateData.notes = notes;
  }
  await firestore().collection('applications').doc(id).update(updateData);
}

export async function assignAgentToApplication(
  applicationId: string,
  agentId: string
): Promise<void> {
  await firestore().collection('applications').doc(applicationId).update({
    agentId,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
}

export function subscribeToApplications(
  callback: (apps: MortgageApplication[]) => void
) {
  return firestore()
    .collection('applications')
    .orderBy('createdAt', 'desc')
    .onSnapshot((snapshot) => {
      const apps = snapshot.docs.map(
        (d) => ({ ...d.data(), applicationId: d.id }) as MortgageApplication
      );
      callback(apps);
    });
}

// ============ Support ============

export async function fetchAllSupportQueries(): Promise<SupportQuery[]> {
  const snapshot = await firestore()
    .collection('supportQueries')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(
    (d) => ({ ...d.data(), queryId: d.id }) as SupportQuery
  );
}

export async function updateSupportStatus(
  queryId: string,
  status: SupportStatus
): Promise<void> {
  await firestore().collection('supportQueries').doc(queryId).update({
    status,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
}

export async function addAdminResponse(
  queryId: string,
  response: string
): Promise<void> {
  await firestore().collection('supportQueries').doc(queryId).update({
    adminResponse: response,
    status: 'in_progress' as SupportStatus,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
}

export function subscribeToSupportQueries(
  callback: (queries: SupportQuery[]) => void
) {
  return firestore()
    .collection('supportQueries')
    .orderBy('createdAt', 'desc')
    .onSnapshot((snapshot) => {
      const queries = snapshot.docs.map(
        (d) => ({ ...d.data(), queryId: d.id }) as SupportQuery
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
  const [usersSnap, appsSnap, supportSnap, chatsSnap] = await Promise.all([
    firestore().collection('users').get(),
    firestore().collection('applications').orderBy('createdAt', 'desc').get(),
    firestore().collection('supportQueries').orderBy('createdAt', 'desc').get(),
    firestore().collection('chats').get(),
  ]);

  const users = usersSnap.docs.map((d) => d.data());
  const apps = appsSnap.docs.map((d) => d.data());
  const tickets = supportSnap.docs.map((d) => d.data());

  // Count users by role
  const usersByRole: Record<string, number> = {};
  let agentCount = 0;
  let activeAgentCount = 0;
  for (const u of users) {
    const role = u.role || 'user';
    usersByRole[role] = (usersByRole[role] || 0) + 1;
    if (role === 'agent') {
      agentCount++;
      if (u.availability) activeAgentCount++;
    }
  }

  // Count applications by status
  const applicationsByStatus: Record<string, number> = {};
  for (const a of apps) {
    const status = a.status || 'draft';
    applicationsByStatus[status] = (applicationsByStatus[status] || 0) + 1;
  }

  // Recent users (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentUsersCount = users.filter((u) => {
    const created = u.createdAt?.toDate?.();
    return created && created >= sevenDaysAgo;
  }).length;

  return {
    totalUsers: users.length,
    totalAgents: agentCount,
    totalApplications: apps.length,
    totalSupportTickets: tickets.length,
    pendingApplications: apps.filter(
      (a) => a.status === 'submitted' || a.status === 'pre_approval'
    ).length,
    openTickets: tickets.filter(
      (t) => t.status === 'open' || t.status === 'in_progress'
    ).length,
    approvedApplications: apps.filter(
      (a) =>
        a.status === 'offer_letter' ||
        a.status === 'disbursement' ||
        a.status === 'completed'
    ).length,
    rejectedApplications: apps.filter((a) => a.status === 'rejected').length,
    activeAgents: activeAgentCount,
    totalChats: chatsSnap.size,
    recentUsersCount,
    applicationsByStatus,
    usersByRole,
  };
}

export async function fetchRecentUsers(count = 6): Promise<User[]> {
  const snapshot = await firestore()
    .collection('users')
    .orderBy('createdAt', 'desc')
    .limit(count)
    .get();
  return snapshot.docs.map((d) => ({ ...d.data(), uid: d.id }) as User);
}

export async function fetchActiveAgents(): Promise<Agent[]> {
  const snapshot = await firestore()
    .collection('users')
    .where('role', '==', 'agent')
    .get();
  const agents = snapshot.docs.map((d) => ({ ...d.data(), uid: d.id }) as Agent);
  return agents.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}
