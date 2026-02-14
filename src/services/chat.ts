/**
 * Chat service layer for Firestore real-time messaging.
 *
 * Handles:
 * - Creating chats between users/agents
 * - Sending/receiving messages in real-time
 * - Typing indicators & online presence
 * - Read receipts & unread counts
 * - Message pagination
 */
import { db, storage } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  increment,
  Timestamp,
} from '@react-native-firebase/firestore';
import { ref, getDownloadURL } from '@react-native-firebase/storage';
import type {
  Chat,
  Message,
  ChatParticipant,
  UserPresence,
  CreateChatInput,
  ChatType,
  MessageType,
  MessageContent,
} from '../types/chat';
import type { UserRole } from '../types/user';

const chatsCol = collection(db, 'chats');
const presenceCol = collection(db, 'userPresence');

// ─── Chat CRUD ───────────────────────────────────────────────────────────────

/**
 * Find an existing chat between two users or return null.
 */
export async function findExistingChat(
  userId: string,
  otherUserId: string
): Promise<Chat | null> {
  const q = query(chatsCol, where('participantIds', 'array-contains', userId));
  const snapshot = await getDocs(q);

  for (const d of snapshot.docs) {
    const chat = d.data() as Chat;
    if (chat.participantIds.includes(otherUserId)) {
      return chat;
    }
  }

  return null;
}

/**
 * Create a new chat between the current user and another user.
 * Returns the existing chat if one already exists.
 */
export async function createChat(
  currentUserId: string,
  currentUserName: string,
  currentUserPhoto: string | null,
  currentUserRole: UserRole,
  input: CreateChatInput
): Promise<Chat> {
  // Check if chat already exists
  const existing = await findExistingChat(currentUserId, input.otherUserId);
  if (existing) return existing;

  const chatRef = doc(chatsCol);
  const chatId = chatRef.id;
  const now = serverTimestamp();

  // Determine chat type
  let type: ChatType = 'user_agent';
  if (
    (currentUserRole === 'user' && input.otherUserRole === 'admin') ||
    (currentUserRole === 'admin' && input.otherUserRole === 'user')
  ) {
    type = 'user_admin';
  } else if (
    (currentUserRole === 'agent' && input.otherUserRole === 'admin') ||
    (currentUserRole === 'admin' && input.otherUserRole === 'agent')
  ) {
    type = 'agent_admin';
  }

  const currentParticipant: ChatParticipant = {
    uid: currentUserId,
    displayName: currentUserName,
    photoURL: currentUserPhoto,
    role: currentUserRole,
  };

  const otherParticipant: ChatParticipant = {
    uid: input.otherUserId,
    displayName: input.otherUserName,
    photoURL: input.otherUserPhoto,
    role: input.otherUserRole,
  };

  const chatData = {
    chatId,
    type,
    participants: {
      [currentUserId]: currentParticipant,
      [input.otherUserId]: otherParticipant,
    },
    participantIds: [currentUserId, input.otherUserId],
    lastMessage: null,
    unreadCount: {
      [currentUserId]: 0,
      [input.otherUserId]: 0,
    },
    createdAt: now,
    updatedAt: now,
    archived: {
      [currentUserId]: false,
      [input.otherUserId]: false,
    },
    muted: {
      [currentUserId]: false,
      [input.otherUserId]: false,
    },
  };

  await setDoc(doc(db, 'chats', chatId), chatData);

  // Send initial message if provided
  if (input.initialMessage?.trim()) {
    await sendMessage(
      chatId,
      currentUserId,
      currentUserName,
      currentUserPhoto,
      input.initialMessage.trim(),
      'text'
    );
  }

  // Fetch the created document to get server timestamps
  const snap = await getDoc(doc(db, 'chats', chatId));
  return snap.data() as Chat;
}

/**
 * Fetch a single chat by ID.
 */
export async function fetchChatById(chatId: string): Promise<Chat | null> {
  const snap = await getDoc(doc(db, 'chats', chatId));
  if (!snap.exists()) return null;
  return snap.data() as Chat;
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
  type: MessageType = 'text',
  replyTo?: Message['replyTo']
): Promise<Message> {
  const messagesCol = collection(db, 'chats', chatId, 'messages');
  const messageRef = doc(messagesCol);
  const messageId = messageRef.id;
  const now = serverTimestamp();

  const messageData = {
    messageId,
    senderId,
    senderName,
    senderPhoto,
    type,
    content: {
      text: type === 'text' ? text : undefined,
    },
    timestamp: now,
    readBy: {
      [senderId]: now,
    },
    edited: false,
    deleted: false,
    ...(replyTo ? { replyTo } : {}),
  };

  // Batch write: message + update chat's lastMessage + increment unread
  const batch = writeBatch(db);

  // Write message
  batch.set(messageRef, messageData);

  // Get chat to find other participant IDs
  const chatSnap = await getDoc(doc(db, 'chats', chatId));
  const chat = chatSnap.data() as Chat;

  // Build unread increment for all participants except sender
  const unreadUpdates: Record<string, any> = {};
  for (const pid of chat.participantIds) {
    if (pid !== senderId) {
      unreadUpdates[`unreadCount.${pid}`] = increment(1);
    }
  }

  // Update chat metadata
  const chatDocRef = doc(db, 'chats', chatId);
  batch.update(chatDocRef, {
    lastMessage: {
      text: type === 'text' ? text : `Sent ${type === 'image' ? 'an image' : 'a document'}`,
      senderId,
      timestamp: now,
      type,
    },
    updatedAt: now,
    ...unreadUpdates,
  });

  await batch.commit();

  // Return a local version (server timestamp not yet resolved)
  return {
    ...messageData,
    timestamp: Timestamp.now(),
    readBy: {
      [senderId]: Timestamp.now(),
    },
  } as Message;
}

/**
 * Fetch messages with pagination (newest first).
 */
export async function fetchMessages(
  chatId: string,
  messageLimit = 30,
  startAfterTimestamp?: any
): Promise<Message[]> {
  const messagesCol = collection(db, 'chats', chatId, 'messages');
  const constraints: any[] = [
    orderBy('timestamp', 'desc'),
    firestoreLimit(messageLimit),
  ];

  if (startAfterTimestamp) {
    constraints.push(startAfter(startAfterTimestamp));
  }

  const q = query(messagesCol, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d: any) => d.data() as Message);
}

/**
 * Subscribe to new messages in real-time (latest N messages).
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(
  chatId: string,
  count: number,
  callback: (messages: Message[]) => void
): () => void {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'desc'),
    firestoreLimit(count)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d: any) => d.data() as Message);
      callback(messages);
    },
    (error) => {
      console.error('[Chat] Message subscription error:', error);
    }
  );
}

/**
 * Subscribe to user's chat list in real-time.
 * Returns an unsubscribe function.
 */
export function subscribeToChats(
  userId: string,
  callback: (chats: Chat[]) => void
): () => void {
  const q = query(
    chatsCol,
    where('participantIds', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const chats = snapshot.docs.map((d: any) => d.data() as Chat);
      callback(chats);
    },
    (error) => {
      console.error('[Chat] Chats subscription error:', error);
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
  await updateDoc(doc(db, 'chats', chatId), {
    [`unreadCount.${userId}`]: 0,
  });

  // Fetch recent messages and mark unread ones as read
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'desc'),
    firestoreLimit(50)
  );
  const allRecent = await getDocs(q);

  const batch = writeBatch(db);
  let updated = 0;
  for (const d of allRecent.docs) {
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
  const q = query(chatsCol, where('participantIds', 'array-contains', userId));
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
 * Set typing status for a user in a specific chat.
 */
export async function setTypingStatus(
  userId: string,
  chatId: string | null
): Promise<void> {
  await setDoc(
    doc(db, 'userPresence', userId),
    {
      uid: userId,
      isTypingIn: chatId,
    },
    { merge: true }
  );
}

/**
 * Subscribe to a user's presence (online status & typing).
 * Returns an unsubscribe function.
 */
export function subscribeToPresence(
  userId: string,
  callback: (presence: UserPresence | null) => void
): () => void {
  return onSnapshot(
    doc(db, 'userPresence', userId),
    (snapshot) => {
      const data = snapshot.data();
      if (data) {
        callback(data as UserPresence);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('[Chat] Presence subscription error:', error);
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
    doc(db, 'userPresence', userId),
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
    doc(db, 'userPresence', userId),
    {
      uid: userId,
      currentChatId: chatId,
    },
    { merge: true }
  );
}

// ─── Message Actions ─────────────────────────────────────────────────────────

/**
 * Delete a message (soft delete - marks as deleted).
 */
export async function deleteMessage(
  chatId: string,
  messageId: string
): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    deleted: true,
    deletedAt: serverTimestamp(),
    content: { text: 'This message was deleted' },
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
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    'content.text': newText,
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
  await updateDoc(doc(db, 'chats', chatId), {
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
  await updateDoc(doc(db, 'chats', chatId), {
    [`muted.${userId}`]: muted,
  });
}

/**
 * Delete a chat (removes the chat document and all messages).
 */
export async function deleteChat(chatId: string): Promise<void> {
  // Delete all messages in batches (Firestore batch limit is 500)
  const messagesCol = collection(db, 'chats', chatId, 'messages');
  let hasMore = true;

  while (hasMore) {
    const q = query(messagesCol, firestoreLimit(450));
    const snapshot = await getDocs(q);
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

  // Delete the chat document itself
  await deleteDoc(doc(db, 'chats', chatId));
}

// ─── Media / File Upload ──────────────────────────────────────────────────────

/**
 * Upload a file to Firebase Storage and return the download URL.
 * Files are stored at: chat_media/{chatId}/{timestamp}_{fileName}
 */
export async function uploadChatMedia(
  chatId: string,
  fileUri: string,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `chat_media/${chatId}/${timestamp}_${sanitizedName}`;

  const storageRef = ref(storage, storagePath);

  // Upload task
  await storageRef.putFile(fileUri, mimeType ? { contentType: mimeType } : undefined);

  // Get download URL
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

/**
 * Send an image message in a chat.
 */
export async function sendImageMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  senderPhoto: string | null,
  imageUri: string,
  fileName: string,
  replyTo?: Message['replyTo']
): Promise<Message> {
  // Upload image to Firebase Storage
  const mediaUrl = await uploadChatMedia(chatId, imageUri, fileName, 'image/jpeg');

  const messagesCol = collection(db, 'chats', chatId, 'messages');
  const messageRef = doc(messagesCol);
  const messageId = messageRef.id;
  const now = serverTimestamp();

  const messageData = {
    messageId,
    senderId,
    senderName,
    senderPhoto,
    type: 'image' as MessageType,
    content: {
      mediaUrl,
      fileName,
      mimeType: 'image/jpeg',
    } as MessageContent,
    timestamp: now,
    readBy: {
      [senderId]: now,
    },
    edited: false,
    deleted: false,
    ...(replyTo ? { replyTo } : {}),
  };

  // Batch write: message + update chat's lastMessage + increment unread
  const batch = writeBatch(db);
  batch.set(messageRef, messageData);

  const chatSnap = await getDoc(doc(db, 'chats', chatId));
  const chat = chatSnap.data() as Chat;

  const unreadUpdates: Record<string, any> = {};
  for (const pid of chat.participantIds) {
    if (pid !== senderId) {
      unreadUpdates[`unreadCount.${pid}`] = increment(1);
    }
  }

  batch.update(doc(db, 'chats', chatId), {
    lastMessage: {
      text: 'Sent a photo',
      senderId,
      timestamp: now,
      type: 'image' as MessageType,
    },
    updatedAt: now,
    ...unreadUpdates,
  });

  await batch.commit();

  return {
    ...messageData,
    timestamp: Timestamp.now(),
    readBy: { [senderId]: Timestamp.now() },
  } as Message;
}

/**
 * Send a document/file message in a chat.
 */
export async function sendDocumentMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  senderPhoto: string | null,
  fileUri: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  replyTo?: Message['replyTo']
): Promise<Message> {
  // Upload file to Firebase Storage
  const mediaUrl = await uploadChatMedia(chatId, fileUri, fileName, mimeType);

  const messagesCol = collection(db, 'chats', chatId, 'messages');
  const messageRef = doc(messagesCol);
  const messageId = messageRef.id;
  const now = serverTimestamp();

  const messageData = {
    messageId,
    senderId,
    senderName,
    senderPhoto,
    type: 'document' as MessageType,
    content: {
      mediaUrl,
      fileName,
      fileSize,
      mimeType,
    } as MessageContent,
    timestamp: now,
    readBy: {
      [senderId]: now,
    },
    edited: false,
    deleted: false,
    ...(replyTo ? { replyTo } : {}),
  };

  // Batch write
  const batch = writeBatch(db);
  batch.set(messageRef, messageData);

  const chatSnap = await getDoc(doc(db, 'chats', chatId));
  const chat = chatSnap.data() as Chat;

  const unreadUpdates: Record<string, any> = {};
  for (const pid of chat.participantIds) {
    if (pid !== senderId) {
      unreadUpdates[`unreadCount.${pid}`] = increment(1);
    }
  }

  batch.update(doc(db, 'chats', chatId), {
    lastMessage: {
      text: `Sent a file: ${fileName}`,
      senderId,
      timestamp: now,
      type: 'document' as MessageType,
    },
    updatedAt: now,
    ...unreadUpdates,
  });

  await batch.commit();

  return {
    ...messageData,
    timestamp: Timestamp.now(),
    readBy: { [senderId]: Timestamp.now() },
  } as Message;
}
