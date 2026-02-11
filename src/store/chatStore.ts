import { create } from 'zustand';
import type { Chat, Message, UserPresence, CreateChatInput } from '../types/chat';
import type { UserRole } from '../types/user';
import {
  createChat,
  sendMessage as sendMessageService,
  sendImageMessage as sendImageService,
  sendDocumentMessage as sendDocumentService,
  subscribeToChats,
  subscribeToMessages,
  subscribeToPresence,
  markChatAsRead,
  setTypingStatus,
  updateOnlineStatus,
  setCurrentChat,
  deleteMessage as deleteMessageService,
  fetchMessages,
  findExistingChat,
} from '../services/chat';

interface ChatState {
  /** All user's chats */
  chats: Chat[];
  /** Messages for the currently active chat */
  messages: Message[];
  /** Currently active chat ID */
  activeChatId: string | null;
  /** Currently active chat data */
  activeChat: Chat | null;
  /** Presence data for other participants keyed by UID */
  presenceMap: Record<string, UserPresence | null>;
  /** Loading states */
  loadingChats: boolean;
  loadingMessages: boolean;
  sendingMessage: boolean;
  /** Whether more messages can be loaded (pagination) */
  hasMoreMessages: boolean;
  /** Total unread count across all chats */
  totalUnread: number;
  /** Error message */
  error: string | null;

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Subscribe to user's chat list */
  subscribeChats: (userId: string) => () => void;
  /** Open a chat and subscribe to its messages */
  openChat: (chatId: string, userId: string) => () => void;
  /** Close the active chat */
  closeChat: (userId: string) => void;
  /** Send a message in the active chat */
  sendMessage: (
    text: string,
    senderId: string,
    senderName: string,
    senderPhoto: string | null,
    replyTo?: Message['replyTo']
  ) => Promise<void>;
  /** Send an image message in the active chat */
  sendImageMessage: (
    senderId: string,
    senderName: string,
    senderPhoto: string | null,
    imageUri: string,
    fileName: string,
    replyTo?: Message['replyTo']
  ) => Promise<void>;
  /** Send a document/file message in the active chat */
  sendDocumentMessage: (
    senderId: string,
    senderName: string,
    senderPhoto: string | null,
    fileUri: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    replyTo?: Message['replyTo']
  ) => Promise<void>;
  /** Create a new chat or open existing one */
  createOrOpenChat: (
    currentUserId: string,
    currentUserName: string,
    currentUserPhoto: string | null,
    currentUserRole: UserRole,
    input: CreateChatInput
  ) => Promise<string>;
  /** Load older messages (pagination) */
  loadMoreMessages: () => Promise<void>;
  /** Set typing status */
  setTyping: (userId: string, isTyping: boolean) => void;
  /** Mark active chat as read */
  markRead: (userId: string) => Promise<void>;
  /** Update user online status */
  setOnline: (userId: string, isOnline: boolean) => Promise<void>;
  /** Delete a message */
  deleteMsg: (messageId: string) => Promise<void>;
  /** Subscribe to a specific user's presence */
  watchPresence: (userId: string) => () => void;
  /** Compute total unread from loaded chats */
  computeTotalUnread: (userId: string) => void;
  /** Clear error */
  clearError: () => void;
  /** Clean up all subscriptions (call on logout) */
  cleanup: (userId: string) => Promise<void>;
}

// Track active subscriptions so we can clean them up
let chatListUnsub: (() => void) | null = null;
let messageUnsub: (() => void) | null = null;
const presenceUnsubs: Record<string, () => void> = {};

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messages: [],
  activeChatId: null,
  activeChat: null,
  presenceMap: {},
  loadingChats: true,
  loadingMessages: false,
  sendingMessage: false,
  hasMoreMessages: true,
  totalUnread: 0,
  error: null,

  subscribeChats: (userId: string) => {
    // Clean up old subscription
    if (chatListUnsub) {
      chatListUnsub();
    }

    set({ loadingChats: true });

    chatListUnsub = subscribeToChats(userId, (chats) => {
      set({ chats, loadingChats: false });
      // Compute unread
      get().computeTotalUnread(userId);
    });

    return () => {
      if (chatListUnsub) {
        chatListUnsub();
        chatListUnsub = null;
      }
    };
  },

  openChat: (chatId: string, userId: string) => {
    // Clean up previous message subscription
    if (messageUnsub) {
      messageUnsub();
    }

    set({ activeChatId: chatId, loadingMessages: true, messages: [], hasMoreMessages: true });

    // Find the chat data
    const chat = get().chats.find((c) => c.chatId === chatId) || null;
    set({ activeChat: chat });

    // Set current chat in presence
    setCurrentChat(userId, chatId).catch(() => {});

    // Subscribe to messages
    messageUnsub = subscribeToMessages(chatId, 30, (messages) => {
      set({ messages, loadingMessages: false });
    });

    // Mark as read
    markChatAsRead(chatId, userId).catch(() => {});

    return () => {
      if (messageUnsub) {
        messageUnsub();
        messageUnsub = null;
      }
      setCurrentChat(userId, null).catch(() => {});
      set({ activeChatId: null, activeChat: null, messages: [] });
    };
  },

  closeChat: (userId: string) => {
    if (messageUnsub) {
      messageUnsub();
      messageUnsub = null;
    }
    setCurrentChat(userId, null).catch(() => {});
    setTypingStatus(userId, null).catch(() => {});
    set({ activeChatId: null, activeChat: null, messages: [] });
  },

  sendMessage: async (text, senderId, senderName, senderPhoto, replyTo) => {
    const { activeChatId } = get();
    if (!activeChatId || !text.trim()) return;

    set({ sendingMessage: true, error: null });
    try {
      await sendMessageService(
        activeChatId,
        senderId,
        senderName,
        senderPhoto,
        text.trim(),
        'text',
        replyTo
      );
      // Clear typing
      setTypingStatus(senderId, null).catch(() => {});
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ sendingMessage: false });
    }
  },

  sendImageMessage: async (senderId, senderName, senderPhoto, imageUri, fileName, replyTo) => {
    const { activeChatId } = get();
    if (!activeChatId) return;

    set({ sendingMessage: true, error: null });
    try {
      await sendImageService(
        activeChatId,
        senderId,
        senderName,
        senderPhoto,
        imageUri,
        fileName,
        replyTo
      );
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ sendingMessage: false });
    }
  },

  sendDocumentMessage: async (senderId, senderName, senderPhoto, fileUri, fileName, fileSize, mimeType, replyTo) => {
    const { activeChatId } = get();
    if (!activeChatId) return;

    set({ sendingMessage: true, error: null });
    try {
      await sendDocumentService(
        activeChatId,
        senderId,
        senderName,
        senderPhoto,
        fileUri,
        fileName,
        fileSize,
        mimeType,
        replyTo
      );
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ sendingMessage: false });
    }
  },

  createOrOpenChat: async (currentUserId, currentUserName, currentUserPhoto, currentUserRole, input) => {
    set({ error: null });
    try {
      // Check for existing chat first
      const existing = await findExistingChat(currentUserId, input.otherUserId);
      if (existing) {
        return existing.chatId;
      }

      // Create new chat
      const chat = await createChat(
        currentUserId,
        currentUserName,
        currentUserPhoto,
        currentUserRole,
        input
      );
      return chat.chatId;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  loadMoreMessages: async () => {
    const { activeChatId, messages, hasMoreMessages, loadingMessages } = get();
    if (!activeChatId || !hasMoreMessages || loadingMessages) return;

    set({ loadingMessages: true });
    try {
      const oldest = messages[messages.length - 1];
      const olderMessages = await fetchMessages(
        activeChatId,
        30,
        oldest?.timestamp
      );

      if (olderMessages.length < 30) {
        set({ hasMoreMessages: false });
      }

      set({
        messages: [...messages, ...olderMessages],
        loadingMessages: false,
      });
    } catch (err: any) {
      set({ error: err.message, loadingMessages: false });
    }
  },

  setTyping: (userId: string, isTyping: boolean) => {
    const { activeChatId } = get();
    setTypingStatus(userId, isTyping ? activeChatId : null).catch(() => {});
  },

  markRead: async (userId: string) => {
    const { activeChatId } = get();
    if (!activeChatId) return;
    try {
      await markChatAsRead(activeChatId, userId);
    } catch (err) {
      console.error('[ChatStore] Failed to mark read:', err);
    }
  },

  setOnline: async (userId: string, isOnline: boolean) => {
    try {
      await updateOnlineStatus(userId, isOnline);
    } catch (err) {
      console.error('[ChatStore] Failed to update online status:', err);
    }
  },

  deleteMsg: async (messageId: string) => {
    const { activeChatId } = get();
    if (!activeChatId) return;
    try {
      await deleteMessageService(activeChatId, messageId);
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  watchPresence: (userId: string) => {
    // Clean up old presence watcher for this user
    if (presenceUnsubs[userId]) {
      presenceUnsubs[userId]();
    }

    const unsub = subscribeToPresence(userId, (presence) => {
      set((state) => ({
        presenceMap: {
          ...state.presenceMap,
          [userId]: presence,
        },
      }));
    });

    presenceUnsubs[userId] = unsub;

    return () => {
      unsub();
      delete presenceUnsubs[userId];
    };
  },

  computeTotalUnread: (userId: string) => {
    const { chats } = get();
    let total = 0;
    for (const chat of chats) {
      total += chat.unreadCount?.[userId] || 0;
    }
    set({ totalUnread: total });
  },

  clearError: () => set({ error: null }),

  cleanup: async (userId: string) => {
    // Unsubscribe from chat list
    if (chatListUnsub) {
      chatListUnsub();
      chatListUnsub = null;
    }

    // Unsubscribe from messages
    if (messageUnsub) {
      messageUnsub();
      messageUnsub = null;
    }

    // Unsubscribe from all presence watchers
    for (const key of Object.keys(presenceUnsubs)) {
      presenceUnsubs[key]();
      delete presenceUnsubs[key];
    }

    // Set user offline and clear typing
    try {
      await updateOnlineStatus(userId, false);
      await setTypingStatus(userId, null);
      await setCurrentChat(userId, null);
    } catch {
      // Best-effort cleanup, don't throw
    }

    // Reset state
    set({
      chats: [],
      messages: [],
      activeChatId: null,
      activeChat: null,
      presenceMap: {},
      loadingChats: true,
      loadingMessages: false,
      sendingMessage: false,
      hasMoreMessages: true,
      totalUnread: 0,
      error: null,
    });
  },
}));
