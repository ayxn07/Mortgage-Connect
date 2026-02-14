import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  limit,
  getCountFromServer,
  writeBatch,
} from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import {
  User,
  Agent,
  MortgageApplication,
  SupportQuery,
  Review,
  DashboardStats,
  ApplicationStatus,
  SupportStatus,
} from "@/lib/types";

// ============ Users ============

export async function fetchAllUsers(): Promise<User[]> {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ ...d.data(), uid: d.id }) as User);
}

export async function fetchUserById(uid: string): Promise<User | null> {
  const docSnap = await getDoc(doc(db, "users", uid));
  if (!docSnap.exists()) return null;
  return { ...docSnap.data(), uid: docSnap.id } as User;
}

export async function updateUserRole(
  uid: string,
  role: "user" | "agent" | "admin"
): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid), {
      role,
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error("Error updating user role:", error);
    throw new Error(error?.message || "Failed to update user role in Firestore");
  }
}

export async function deleteUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid));
}

export function subscribeToUsers(callback: (users: User[]) => void) {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(
      (d) => ({ ...d.data(), uid: d.id }) as User
    );
    callback(users);
  });
}

// ============ Agents ============

export async function fetchAllAgents(): Promise<Agent[]> {
  const q = query(
    collection(db, "users"),
    where("role", "==", "agent")
  );
  const snapshot = await getDocs(q);
  const agents = snapshot.docs.map((d) => ({ ...d.data(), uid: d.id }) as Agent);
  
  // Sort by createdAt in memory
  return agents.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime; // desc order
  });
}

export async function updateAgent(
  uid: string,
  data: Partial<Agent>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function toggleAgentAvailability(
  uid: string,
  availability: boolean
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    availability,
    updatedAt: Timestamp.now(),
  });
}

export async function fetchAgentReviews(agentId: string): Promise<Review[]> {
  const q = query(
    collection(db, "reviews"),
    where("agentId", "==", agentId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ ...d.data(), reviewId: d.id }) as Review
  );
}

// ============ Applications ============

export async function fetchAllApplications(): Promise<MortgageApplication[]> {
  const q = query(
    collection(db, "applications"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) =>
      ({
        ...d.data(),
        applicationId: d.id,
      }) as MortgageApplication
  );
}

export async function fetchApplicationById(
  id: string
): Promise<MortgageApplication | null> {
  const docSnap = await getDoc(doc(db, "applications", id));
  if (!docSnap.exists()) return null;
  return {
    ...docSnap.data(),
    applicationId: docSnap.id,
  } as MortgageApplication;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  notes?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: Timestamp.now(),
  };
  if (notes !== undefined) {
    updateData.notes = notes;
  }
  await updateDoc(doc(db, "applications", id), updateData);
}

export async function assignAgentToApplication(
  applicationId: string,
  agentId: string
): Promise<void> {
  await updateDoc(doc(db, "applications", applicationId), {
    agentId,
    updatedAt: Timestamp.now(),
  });
}

export function subscribeToApplications(
  callback: (apps: MortgageApplication[]) => void
) {
  const q = query(
    collection(db, "applications"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const apps = snapshot.docs.map(
      (d) =>
        ({
          ...d.data(),
          applicationId: d.id,
        }) as MortgageApplication
    );
    callback(apps);
  });
}

// ============ Support ============

export async function fetchAllSupportQueries(): Promise<SupportQuery[]> {
  const q = query(
    collection(db, "supportQueries"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ ...d.data(), queryId: d.id }) as SupportQuery
  );
}

export async function updateSupportStatus(
  queryId: string,
  status: SupportStatus
): Promise<void> {
  await updateDoc(doc(db, "supportQueries", queryId), {
    status,
    updatedAt: Timestamp.now(),
  });
}

export async function addAdminResponse(
  queryId: string,
  response: string
): Promise<void> {
  await updateDoc(doc(db, "supportQueries", queryId), {
    adminResponse: response,
    status: "in_progress" as SupportStatus,
    updatedAt: Timestamp.now(),
  });
}

export function subscribeToSupportQueries(
  callback: (queries: SupportQuery[]) => void
) {
  const q = query(
    collection(db, "supportQueries"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const queries = snapshot.docs.map(
      (d) => ({ ...d.data(), queryId: d.id }) as SupportQuery
    );
    callback(queries);
  });
}

// ============ Dashboard Stats ============

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [usersSnap, agentsSnap, appsSnap, supportSnap] = await Promise.all([
    getCountFromServer(collection(db, "users")),
    getCountFromServer(
      query(collection(db, "users"), where("role", "==", "agent"))
    ),
    getDocs(
      query(collection(db, "applications"), orderBy("createdAt", "desc"))
    ),
    getDocs(
      query(collection(db, "supportQueries"), orderBy("createdAt", "desc"))
    ),
  ]);

  const apps = appsSnap.docs.map((d) => d.data());
  const tickets = supportSnap.docs.map((d) => d.data());

  return {
    totalUsers: usersSnap.data().count,
    totalAgents: agentsSnap.data().count,
    totalApplications: apps.length,
    totalSupportTickets: tickets.length,
    pendingApplications: apps.filter(
      (a) => a.status === "submitted" || a.status === "pre_approval"
    ).length,
    openTickets: tickets.filter(
      (t) => t.status === "open" || t.status === "in_progress"
    ).length,
    approvedApplications: apps.filter(
      (a) =>
        a.status === "offer_letter" ||
        a.status === "disbursement" ||
        a.status === "completed"
    ).length,
    rejectedApplications: apps.filter((a) => a.status === "rejected").length,
  };
}

// ============ Enhanced Dashboard ============

export async function fetchRecentUsers(count = 6): Promise<User[]> {
  const q = query(
    collection(db, "users"),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ ...d.data(), uid: d.id }) as User);
}

export async function fetchActiveAgents(): Promise<Agent[]> {
  const q = query(
    collection(db, "users"),
    where("role", "==", "agent")
  );
  const snapshot = await getDocs(q);
  const agents = snapshot.docs.map((d) => ({ ...d.data(), uid: d.id }) as Agent);
  
  // Sort by createdAt in memory
  return agents.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime; // desc order
  });
}

export interface EnhancedDashboardStats extends DashboardStats {
  activeAgents: number;
  totalChats: number;
  recentUsersCount: number;
  applicationsByStatus: Record<string, number>;
  usersByRole: Record<string, number>;
}

export async function fetchEnhancedDashboardStats(): Promise<EnhancedDashboardStats> {
  const [usersSnap, agentsSnap, activeAgentsSnap, appsSnap, supportSnap, chatsSnap] =
    await Promise.all([
      getDocs(query(collection(db, "users"))),
      getCountFromServer(
        query(collection(db, "users"), where("role", "==", "agent"))
      ),
      getCountFromServer(
        query(
          collection(db, "users"),
          where("role", "==", "agent"),
          where("availability", "==", true)
        )
      ),
      getDocs(
        query(collection(db, "applications"), orderBy("createdAt", "desc"))
      ),
      getDocs(
        query(collection(db, "supportQueries"), orderBy("createdAt", "desc"))
      ),
      getCountFromServer(collection(db, "chats")),
    ]);

  const users = usersSnap.docs.map((d) => d.data());
  const apps = appsSnap.docs.map((d) => d.data());
  const tickets = supportSnap.docs.map((d) => d.data());

  // Count users by role
  const usersByRole: Record<string, number> = {};
  for (const u of users) {
    const role = u.role || "user";
    usersByRole[role] = (usersByRole[role] || 0) + 1;
  }

  // Count applications by status
  const applicationsByStatus: Record<string, number> = {};
  for (const a of apps) {
    const status = a.status || "draft";
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
    totalAgents: agentsSnap.data().count,
    totalApplications: apps.length,
    totalSupportTickets: tickets.length,
    pendingApplications: apps.filter(
      (a) => a.status === "submitted" || a.status === "pre_approval"
    ).length,
    openTickets: tickets.filter(
      (t) => t.status === "open" || t.status === "in_progress"
    ).length,
    approvedApplications: apps.filter(
      (a) =>
        a.status === "offer_letter" ||
        a.status === "disbursement" ||
        a.status === "completed"
    ).length,
    rejectedApplications: apps.filter((a) => a.status === "rejected").length,
    activeAgents: activeAgentsSnap.data().count,
    totalChats: chatsSnap.data().count,
    recentUsersCount,
    applicationsByStatus,
    usersByRole,
  };
}

// ============ Document Access ============

export async function getDocumentUrl(path: string): Promise<string> {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}
