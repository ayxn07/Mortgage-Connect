import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { UserRole } from './user';

/** Chat participant info embedded in the chat document */
export interface ChatParticipant {
  uid: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
}

/** Chat type based on participants */
export type ChatType = 'user_agent' | 'user_admin' | 'agent_admin';

/** Chat document stored in Firestore `chats/{chatId}` */
export interface Chat {
  chatId: string;
  type: ChatType;
  /** Map of participant uid -> participant info */
  participants: Record<string, ChatParticipant>;
  /** Ordered participant UIDs for Firestore querying */
  participantIds: string[];
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: FirebaseFirestoreTypes.Timestamp;
    type: MessageType;
  } | null;
  /** Map of userId -> unread count */
  unreadCount: Record<string, number>;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
  /** Map of userId -> archived boolean */
  archived: Record<string, boolean>;
  /** Map of userId -> muted boolean */
  muted: Record<string, boolean>;
}

/** Message types */
export type MessageType = 'text' | 'image' | 'document' | 'system';

/** Message content structure */
export interface MessageContent {
  text?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
}

/** Message document stored in `chats/{chatId}/messages/{messageId}` */
export interface Message {
  messageId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  type: MessageType;
  content: MessageContent;
  timestamp: FirebaseFirestoreTypes.Timestamp;
  /** Map of userId -> read timestamp */
  readBy: Record<string, FirebaseFirestoreTypes.Timestamp>;
  edited: boolean;
  editedAt?: FirebaseFirestoreTypes.Timestamp;
  deleted: boolean;
  deletedAt?: FirebaseFirestoreTypes.Timestamp;
  /** Reply context */
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
  };
}

/** User presence document in `userPresence/{userId}` */
export interface UserPresence {
  uid: string;
  isOnline: boolean;
  lastSeen: FirebaseFirestoreTypes.Timestamp;
  currentChatId?: string | null;
  isTypingIn?: string | null;
}

/** Input for creating/sending a new message */
export interface SendMessageInput {
  chatId: string;
  text: string;
  type?: MessageType;
  replyTo?: Message['replyTo'];
}

/** Input for starting a new chat */
export interface CreateChatInput {
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string | null;
  otherUserRole: UserRole;
  initialMessage?: string;
}

/** Chat list item (for display) */
export interface ChatListItem extends Chat {
  /** The other participant (not the current user) */
  otherParticipant: ChatParticipant;
  /** Other participant's presence info */
  otherPresence?: UserPresence | null;
}
