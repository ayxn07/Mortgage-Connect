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
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
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

const chatsRef = firestore().collection('chats');
const presenceRef = firestore().collection('userPresence');

// ─── Chat CRUD ───────────────────────────────────────────────────────────────

/**
 * Find an existing chat between two users or return null.
 */
export async function findExistingChat(
  userId: string,
  otherUserId: string
): Promise<Chat | null> {
  const snapshot = await chatsRef
    .where('participantIds', 'array-contains', userId)
    .get();

  for (const doc of snapshot.docs) {
    const chat = doc.data() as Chat;
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

  const chatId = chatsRef.doc().id;
  const now = firestore.FieldValue.serverTimestamp();

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

  const chatData: Omit<Chat, 'createdAt' | 'updatedAt'> & {
    createdAt: ReturnType<typeof firestore.FieldValue.serverTimestamp>;
    updatedAt: ReturnType<typeof firestore.FieldValue.serverTimestamp>;
  } = {
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
    createdAt: now as any,
    updatedAt: now as any,
    archived: {
      [currentUserId]: false,
      [input.otherUserId]: false,
    },
    muted: {
      [currentUserId]: false,
      [input.otherUserId]: false,
    },
  };

  await chatsRef.doc(chatId).set(chatData);

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
  const doc = await chatsRef.doc(chatId).get();
  return doc.data() as Chat;
}

/**
 * Fetch a single chat by ID.
 */
export async function fetchChatById(chatId: string): Promise<Chat | null> {
  const doc = await chatsRef.doc(chatId).get();
  if (!doc.exists) return null;
  return doc.data() as Chat;
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
  const messagesRef = chatsRef.doc(chatId).collection('messages');
  const messageId = messagesRef.doc().id;
  const now = firestore.FieldValue.serverTimestamp();

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
  const batch = firestore().batch();

  // Write message
  batch.set(messagesRef.doc(messageId), messageData);

  // Get chat to find other participant IDs
  const chatDoc = await chatsRef.doc(chatId).get();
  const chat = chatDoc.data() as Chat;

  // Build unread increment for all participants except sender
  const unreadUpdates: Record<string, any> = {};
  for (const pid of chat.participantIds) {
    if (pid !== senderId) {
      unreadUpdates[`unreadCount.${pid}`] = firestore.FieldValue.increment(1);
    }
  }

  // Update chat metadata
  batch.update(chatsRef.doc(chatId), {
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
    timestamp: firestore.Timestamp.now(),
    readBy: {
      [senderId]: firestore.Timestamp.now(),
    },
  } as Message;
}

/**
 * Fetch messages with pagination (newest first).
 */
export async function fetchMessages(
  chatId: string,
  messageLimit = 30,
  startAfterTimestamp?: FirebaseFirestoreTypes.Timestamp
): Promise<Message[]> {
  let query = chatsRef
    .doc(chatId)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(messageLimit);

  if (startAfterTimestamp) {
    query = query.startAfter(startAfterTimestamp);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => doc.data() as Message);
}

/**
 * Subscribe to new messages in real-time (latest N messages).
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(
  chatId: string,
  limit: number,
  callback: (messages: Message[]) => void
): () => void {
  return chatsRef
    .doc(chatId)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .onSnapshot(
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => doc.data() as Message);
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
  return chatsRef
    .where('participantIds', 'array-contains', userId)
    .orderBy('updatedAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        const chats = snapshot.docs.map((doc) => doc.data() as Chat);
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
  await chatsRef.doc(chatId).update({
    [`unreadCount.${userId}`]: 0,
  });

  // Fetch recent messages and mark unread ones as read
  const allRecent = await chatsRef
    .doc(chatId)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();

  const batch = firestore().batch();
  let updated = 0;
  for (const doc of allRecent.docs) {
    const msg = doc.data() as Message;
    if (msg.senderId !== userId && !msg.readBy?.[userId]) {
      batch.update(doc.ref, {
        [`readBy.${userId}`]: firestore.FieldValue.serverTimestamp(),
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
  const snapshot = await chatsRef
    .where('participantIds', 'array-contains', userId)
    .get();

  let total = 0;
  for (const doc of snapshot.docs) {
    const chat = doc.data() as Chat;
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
  await presenceRef.doc(userId).set(
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
  return presenceRef.doc(userId).onSnapshot(
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
  await presenceRef.doc(userId).set(
    {
      uid: userId,
      isOnline,
      lastSeen: firestore.FieldValue.serverTimestamp(),
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
  await presenceRef.doc(userId).set(
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
  await chatsRef
    .doc(chatId)
    .collection('messages')
    .doc(messageId)
    .update({
      deleted: true,
      deletedAt: firestore.FieldValue.serverTimestamp(),
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
  await chatsRef
    .doc(chatId)
    .collection('messages')
    .doc(messageId)
    .update({
      'content.text': newText,
      edited: true,
      editedAt: firestore.FieldValue.serverTimestamp(),
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
  await chatsRef.doc(chatId).update({
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
  await chatsRef.doc(chatId).update({
    [`muted.${userId}`]: muted,
  });
}

/**
 * Delete a chat (removes the chat document and all messages).
 */
export async function deleteChat(chatId: string): Promise<void> {
  // Delete all messages in batches (Firestore batch limit is 500)
  const messagesCollection = chatsRef.doc(chatId).collection('messages');
  let hasMore = true;

  while (hasMore) {
    const snapshot = await messagesCollection.limit(450).get();
    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = firestore().batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();

    if (snapshot.docs.length < 450) {
      hasMore = false;
    }
  }

  // Delete the chat document itself
  await chatsRef.doc(chatId).delete();
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

  const ref = storage().ref(storagePath);

  // Upload task
  await ref.putFile(fileUri, mimeType ? { contentType: mimeType } : undefined);

  // Get download URL
  const downloadUrl = await ref.getDownloadURL();
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

  const messagesRef = chatsRef.doc(chatId).collection('messages');
  const messageId = messagesRef.doc().id;
  const now = firestore.FieldValue.serverTimestamp();

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
  const batch = firestore().batch();
  batch.set(messagesRef.doc(messageId), messageData);

  const chatDoc = await chatsRef.doc(chatId).get();
  const chat = chatDoc.data() as Chat;

  const unreadUpdates: Record<string, any> = {};
  for (const pid of chat.participantIds) {
    if (pid !== senderId) {
      unreadUpdates[`unreadCount.${pid}`] = firestore.FieldValue.increment(1);
    }
  }

  batch.update(chatsRef.doc(chatId), {
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
    timestamp: firestore.Timestamp.now(),
    readBy: { [senderId]: firestore.Timestamp.now() },
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

  const messagesRef = chatsRef.doc(chatId).collection('messages');
  const messageId = messagesRef.doc().id;
  const now = firestore.FieldValue.serverTimestamp();

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
  const batch = firestore().batch();
  batch.set(messagesRef.doc(messageId), messageData);

  const chatDoc = await chatsRef.doc(chatId).get();
  const chat = chatDoc.data() as Chat;

  const unreadUpdates: Record<string, any> = {};
  for (const pid of chat.participantIds) {
    if (pid !== senderId) {
      unreadUpdates[`unreadCount.${pid}`] = firestore.FieldValue.increment(1);
    }
  }

  batch.update(chatsRef.doc(chatId), {
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
    timestamp: firestore.Timestamp.now(),
    readBy: { [senderId]: firestore.Timestamp.now() },
  } as Message;
}
