/**
 * Chat service for the admin dashboard using Firebase web SDK.
 * Mirrors the mobile app's chat service (src/services/chat.ts)
 * but uses `firebase/firestore` instead of `@react-native-firebase`.
 */
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  increment,
  startAfter,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Chat,
  Message,
  ChatParticipant,
  ChatType,
  MessageType,
  UserRole,
} from "@/lib/types";

// ─── Presence Type (admin dashboard only) ────────────────────────────────────
export interface UserPresence {
  uid: string;
  isOnline: boolean;
  lastSeen: Timestamp | null;
  isTypingIn: string | null;
  currentChatId: string | null;
}

// ─── Collection References ───────────────────────────────────────────────────
const chatsCol = collection(db, "chats");
const presenceCol = collection(db, "userPresence");

// ─── Chat CRUD ───────────────────────────────────────────────────────────────

/**
 * Find an existing chat between two users.
 */
export async function findExistingChat(
  userId: string,
  otherUserId: string
): Promise<Chat | null> {
  const q = query(
    chatsCol,
    where("participantIds", "array-contains", userId)
  );
  const snapshot = await getDocs(q);
  for (const d of snapshot.docs) {
    const chat = { ...d.data(), chatId: d.id } as Chat;
    if (chat.participantIds.includes(otherUserId)) {
      return chat;
    }
  }
  return null;
}

/**
 * Create a new chat. Returns existing chat if one already exists.
 */
export async function createChat(
  currentUserId: string,
  currentUserName: string,
  currentUserPhoto: string | null,
  currentUserRole: UserRole,
  otherUserId: string,
  otherUserName: string,
  otherUserPhoto: string | null,
  otherUserRole: UserRole,
  initialMessage?: string
): Promise<Chat> {
  const existing = await findExistingChat(currentUserId, otherUserId);
  if (existing) return existing;

  const chatRef = doc(chatsCol);
  const chatId = chatRef.id;
  const now = serverTimestamp();

  let type: ChatType = "user_agent";
  if (
    (currentUserRole === "user" && otherUserRole === "admin") ||
    (currentUserRole === "admin" && otherUserRole === "user")
  ) {
    type = "user_admin";
  } else if (
    (currentUserRole === "agent" && otherUserRole === "admin") ||
    (currentUserRole === "admin" && otherUserRole === "agent")
  ) {
    type = "agent_admin";
  }

  const currentParticipant: ChatParticipant = {
    uid: currentUserId,
    displayName: currentUserName,
    photoURL: currentUserPhoto,
    role: currentUserRole,
  };

  const otherParticipant: ChatParticipant = {
    uid: otherUserId,
    displayName: otherUserName,
    photoURL: otherUserPhoto,
    role: otherUserRole,
  };

  const chatData = {
    chatId,
    type,
    participants: {
      [currentUserId]: currentParticipant,
      [otherUserId]: otherParticipant,
    },
    participantIds: [currentUserId, otherUserId],
    lastMessage: null,
    unreadCount: {
      [currentUserId]: 0,
      [otherUserId]: 0,
    },
    createdAt: now,
    updatedAt: now,
    archived: {
      [currentUserId]: false,
      [otherUserId]: false,
    },
    muted: {
      [currentUserId]: false,
      [otherUserId]: false,
    },
  };

  await setDoc(chatRef, chatData);

  if (initialMessage?.trim()) {
    await sendMessage(
      chatId,
      currentUserId,
      currentUserName,
      currentUserPhoto,
      initialMessage.trim()
    );
  }

  const created = await getDoc(chatRef);
  return { ...created.data(), chatId } as Chat;
}

/**
 * Fetch a single chat by ID.
 */
export async function fetchChatById(chatId: string): Promise<Chat | null> {
  const d = await getDoc(doc(chatsCol, chatId));
  if (!d.exists()) return null;
  return { ...d.data(), chatId: d.id } as Chat;
}

// ─── Messages ────────────────────────────────────────────────────────────────

/**
 * Send a text message in a chat.
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  senderPhoto: string | null,
  text: string,
  type: MessageType = "text",
  replyTo?: Message["replyTo"]
): Promise<void> {
  const messagesCol = collection(db, "chats", chatId, "messages");
  const msgRef = doc(messagesCol);
  const messageId = msgRef.id;
  const now = serverTimestamp();

  const messageData = {
    messageId,
    senderId,
    senderName,
    senderPhoto,
    type,
    content: {
      text: type === "text" ? text : undefined,
    },
    timestamp: now,
    readBy: {
      [senderId]: now,
    },
    edited: false,
    deleted: false,
    ...(replyTo ? { replyTo } : {}),
  };

  const batch = writeBatch(db);

  // Write the message
  batch.set(msgRef, messageData);

  // Get chat to find other participant IDs
  const chatDoc = await getDoc(doc(chatsCol, chatId));
  const chat = chatDoc.data() as Chat;

  // Build unread updates
  const unreadUpdates: Record<string, unknown> = {};
  for (const pid of chat.participantIds) {
    if (pid !== senderId) {
      unreadUpdates[`unreadCount.${pid}`] = increment(1);
    }
  }

  // Update chat metadata
  batch.update(doc(chatsCol, chatId), {
    lastMessage: {
      text:
        type === "text"
          ? text
          : `Sent ${type === "image" ? "an image" : "a document"}`,
      senderId,
      timestamp: now,
      type,
    },
    updatedAt: now,
    ...unreadUpdates,
  });

  await batch.commit();
}

/**
 * Fetch messages with pagination (newest first).
 */
export async function fetchMessages(
  chatId: string,
  messageLimit = 50,
  startAfterTimestamp?: Timestamp
): Promise<Message[]> {
  const messagesCol = collection(db, "chats", chatId, "messages");
  let q = query(
    messagesCol,
    orderBy("timestamp", "desc"),
    firestoreLimit(messageLimit)
  );

  if (startAfterTimestamp) {
    q = query(
      messagesCol,
      orderBy("timestamp", "desc"),
      startAfter(startAfterTimestamp),
      firestoreLimit(messageLimit)
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as Message);
}

/**
 * Subscribe to new messages in real-time.
 */
export function subscribeToMessages(
  chatId: string,
  msgLimit: number,
  callback: (messages: Message[]) => void
): () => void {
  const messagesCol = collection(db, "chats", chatId, "messages");
  const q = query(
    messagesCol,
    orderBy("timestamp", "desc"),
    firestoreLimit(msgLimit)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => d.data() as Message);
      callback(messages);
    },
    (error) => {
      console.error("[Chat] Message subscription error:", error);
    }
  );
}

/**
 * Subscribe to user's chat list in real-time.
 */
export function subscribeToChats(
  userId: string,
  callback: (chats: Chat[]) => void
): () => void {
  const q = query(
    chatsCol,
    where("participantIds", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const chats = snapshot.docs.map(
        (d) => ({ ...d.data(), chatId: d.id }) as Chat
      );
      callback(chats);
    },
    (error) => {
      console.error("[Chat] Chats subscription error:", error);
    }
  );
}

/**
 * Subscribe to ALL chats (admin can see everything).
 */
export function subscribeToAllChats(
  callback: (chats: Chat[]) => void
): () => void {
  const q = query(chatsCol, orderBy("updatedAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const chats = snapshot.docs.map(
        (d) => ({ ...d.data(), chatId: d.id }) as Chat
      );
      callback(chats);
    },
    (error) => {
      console.error("[Chat] All chats subscription error:", error);
    }
  );
}

// ─── Read Receipts & Unread ──────────────────────────────────────────────────

/**
 * Mark all messages as read for a user in a chat.
 */
export async function markChatAsRead(
  chatId: string,
  userId: string
): Promise<void> {
  // Reset unread count
  await updateDoc(doc(chatsCol, chatId), {
    [`unreadCount.${userId}`]: 0,
  });

  // Mark recent messages as read
  const messagesCol = collection(db, "chats", chatId, "messages");
  const q = query(
    messagesCol,
    orderBy("timestamp", "desc"),
    firestoreLimit(50)
  );
  const snapshot = await getDocs(q);

  const batch = writeBatch(db);
  let updated = 0;
  for (const d of snapshot.docs) {
    const msg = d.data() as Message;
    if (msg.senderId !== userId && !msg.readBy?.[userId]) {
      batch.update(d.ref, {
        [`readBy.${userId}`]: serverTimestamp(),
      });
      updated++;
    }
  }
  if (updated > 0) {
    await batch.commit();
  }
}

/**
 * Get total unread count across all chats for a user.
 */
export async function getTotalUnreadCount(userId: string): Promise<number> {
  const q = query(
    chatsCol,
    where("participantIds", "array-contains", userId)
  );
  const snapshot = await getDocs(q);
  let total = 0;
  for (const d of snapshot.docs) {
    const chat = d.data() as Chat;
    total += chat.unreadCount?.[userId] || 0;
  }
  return total;
}

// ─── Typing Indicators ──────────────────────────────────────────────────────

/**
 * Set typing status for a user.
 */
export async function setTypingStatus(
  userId: string,
  chatId: string | null
): Promise<void> {
  await setDoc(
    doc(presenceCol, userId),
    {
      uid: userId,
      isTypingIn: chatId,
    },
    { merge: true }
  );
}

/**
 * Subscribe to a user's presence (online status & typing).
 */
export function subscribeToPresence(
  userId: string,
  callback: (presence: UserPresence | null) => void
): () => void {
  return onSnapshot(
    doc(presenceCol, userId),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserPresence);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("[Chat] Presence subscription error:", error);
    }
  );
}

// ─── Online Status ──────────────────────────────────────────────────────────

/**
 * Update user's online status.
 */
export async function updateOnlineStatus(
  userId: string,
  isOnline: boolean
): Promise<void> {
  await setDoc(
    doc(presenceCol, userId),
    {
      uid: userId,
      isOnline,
      lastSeen: serverTimestamp(),
      ...(isOnline ? {} : { isTypingIn: null, currentChatId: null }),
    },
    { merge: true }
  );
}

/**
 * Set which chat the user is currently viewing.
 */
export async function setCurrentChat(
  userId: string,
  chatId: string | null
): Promise<void> {
  await setDoc(
    doc(presenceCol, userId),
    {
      uid: userId,
      currentChatId: chatId,
    },
    { merge: true }
  );
}

// ─── Message Actions ─────────────────────────────────────────────────────────

/**
 * Delete a message (soft delete).
 */
export async function deleteMessage(
  chatId: string,
  messageId: string
): Promise<void> {
  await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
    deleted: true,
    deletedAt: serverTimestamp(),
    content: { text: "This message was deleted" },
  });
}

/**
 * Edit a message.
 */
export async function editMessage(
  chatId: string,
  messageId: string,
  newText: string
): Promise<void> {
  await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
    "content.text": newText,
    edited: true,
    editedAt: serverTimestamp(),
  });
}

// ─── Chat Actions ────────────────────────────────────────────────────────────

/**
 * Archive/unarchive a chat for a user.
 */
export async function toggleArchiveChat(
  chatId: string,
  userId: string,
  archived: boolean
): Promise<void> {
  await updateDoc(doc(chatsCol, chatId), {
    [`archived.${userId}`]: archived,
  });
}

/**
 * Mute/unmute a chat for a user.
 */
export async function toggleMuteChat(
  chatId: string,
  userId: string,
  muted: boolean
): Promise<void> {
  await updateDoc(doc(chatsCol, chatId), {
    [`muted.${userId}`]: muted,
  });
}

/**
 * Delete a chat and all its messages.
 */
export async function deleteChat(chatId: string): Promise<void> {
  const messagesCol = collection(db, "chats", chatId, "messages");
  let hasMore = true;

  while (hasMore) {
    const snapshot = await getDocs(
      query(messagesCol, firestoreLimit(450))
    );
    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = writeBatch(db);
    for (const d of snapshot.docs) {
      batch.delete(d.ref);
    }
    await batch.commit();

    if (snapshot.docs.length < 450) {
      hasMore = false;
    }
  }

  await deleteDoc(doc(chatsCol, chatId));
}
