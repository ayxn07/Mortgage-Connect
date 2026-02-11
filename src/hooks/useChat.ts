import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import type { Chat, ChatListItem, ChatParticipant, Message } from '../types/chat';
import type { IMessage } from 'react-native-gifted-chat';

/**
 * Hook to manage the chat list subscription and provide enriched chat data.
 * Automatically subscribes to the user's chats and online status.
 */
export function useChatList() {
  const { firebaseUser, userDoc } = useAuthStore();
  const {
    chats,
    loadingChats,
    totalUnread,
    subscribeChats,
    setOnline,
  } = useChatStore();

  const userId = firebaseUser?.uid;
  const [subKey, setSubKey] = useState(0);

  // Subscribe to chat list
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeChats(userId);

    // Set online status
    setOnline(userId, true);

    return () => {
      unsubscribe();
      // Set offline when leaving the chat list
      setOnline(userId, false);
    };
  }, [userId, subKey]);

  // Force re-subscribe (for pull-to-refresh)
  const resubscribe = useCallback(() => {
    setSubKey((k) => k + 1);
  }, []);

  // Convert chats to ChatListItems with the "other" participant resolved
  const chatListItems: ChatListItem[] = useMemo(() => {
    if (!userId) return [];

    return chats
      .filter((chat) => !chat.archived?.[userId]) // filter out archived
      .map((chat) => {
        const otherParticipantId = chat.participantIds.find((id) => id !== userId);
        const otherParticipant = otherParticipantId
          ? chat.participants[otherParticipantId]
          : null;

        return {
          ...chat,
          otherParticipant: otherParticipant || {
            uid: 'unknown',
            displayName: 'Unknown User',
            photoURL: null,
            role: 'user' as const,
          },
        };
      });
  }, [chats, userId]);

  return {
    chats: chatListItems,
    loading: loadingChats,
    totalUnread,
    userId,
    userDoc,
    resubscribe,
  };
}

/**
 * Convert a Firestore Message to GiftedChat IMessage format.
 */
function toGiftedMessage(msg: Message, userId: string): IMessage {
  const isMe = msg.senderId === userId;
  const timestamp = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();

  const base: IMessage = {
    _id: msg.messageId,
    text: msg.deleted ? 'This message was deleted' : (msg.content?.text || ''),
    createdAt: timestamp,
    user: {
      _id: msg.senderId,
      name: msg.senderName,
      avatar: msg.senderPhoto || undefined,
    },
  };

  // Image message
  if (msg.type === 'image' && msg.content?.mediaUrl && !msg.deleted) {
    base.image = msg.content.mediaUrl;
    base.text = '';
  }

  // Document message - store doc info so we can render a custom bubble
  if (msg.type === 'document' && msg.content?.mediaUrl && !msg.deleted) {
    base.text = '';
    // Attach file metadata in extra fields (GiftedChat passes extra props through)
    (base as any).document = {
      url: msg.content.mediaUrl,
      fileName: msg.content.fileName || 'File',
      fileSize: msg.content.fileSize || 0,
      mimeType: msg.content.mimeType || 'application/octet-stream',
    };
  }

  // Reply info
  if (msg.replyTo) {
    (base as any).replyTo = msg.replyTo;
  }

  // Edited flag
  if (msg.edited) {
    (base as any).edited = true;
  }

  // Deleted flag
  if (msg.deleted) {
    (base as any).deleted = true;
  }

  // Read receipt info
  if (isMe) {
    const readByOther = Object.keys(msg.readBy || {}).length > 1;
    (base as any).received = true;
    (base as any).sent = true;
    (base as any).readByOther = readByOther;
  }

  return base;
}

/**
 * Hook to manage an active chat conversation.
 * Handles message subscription, typing indicators, read receipts.
 * Returns messages in GiftedChat-compatible format.
 */
export function useConversation(chatId: string | undefined) {
  const { firebaseUser, userDoc } = useAuthStore();
  const {
    messages,
    activeChat,
    loadingMessages,
    sendingMessage,
    hasMoreMessages,
    presenceMap,
    openChat,
    closeChat,
    sendMessage,
    sendImageMessage,
    sendDocumentMessage,
    loadMoreMessages,
    setTyping,
    markRead,
    watchPresence,
    deleteMsg,
  } = useChatStore();

  const userId = firebaseUser?.uid;
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to messages when chat opens
  useEffect(() => {
    if (!chatId || !userId) return;

    const unsubscribe = openChat(chatId, userId);

    return () => {
      unsubscribe();
    };
  }, [chatId, userId]);

  // Watch other participant's presence
  useEffect(() => {
    if (!activeChat || !userId) return;

    const otherParticipantId = activeChat.participantIds.find((id) => id !== userId);
    if (!otherParticipantId) return;

    const unsub = watchPresence(otherParticipantId);
    return unsub;
  }, [activeChat, userId]);

  // Mark chat as read when messages update
  useEffect(() => {
    if (!chatId || !userId || messages.length === 0) return;
    markRead(userId);
  }, [messages.length, chatId, userId]);

  // Get other participant info
  const otherParticipant = useMemo(() => {
    if (!activeChat || !userId) return null;
    const otherId = activeChat.participantIds.find((id) => id !== userId);
    return otherId ? activeChat.participants[otherId] : null;
  }, [activeChat, userId]);

  // Get other participant's presence
  const otherPresence = useMemo(() => {
    if (!otherParticipant) return null;
    return presenceMap[otherParticipant.uid] || null;
  }, [otherParticipant, presenceMap]);

  // Is the other user typing in this chat?
  const isOtherTyping = useMemo(() => {
    if (!otherPresence || !chatId) return false;
    return otherPresence.isTypingIn === chatId;
  }, [otherPresence, chatId]);

  // Convert Firestore messages to GiftedChat format (newest first for GiftedChat)
  const giftedMessages: IMessage[] = useMemo(() => {
    if (!userId) return [];
    // messages from store are in desc order (newest first) which GiftedChat expects
    return messages.map((msg) => toGiftedMessage(msg, userId));
  }, [messages, userId]);

  // Send text message handler
  const handleSend = useCallback(
    async (text: string, replyTo?: typeof messages[0]['replyTo']) => {
      if (!userId || !userDoc) return;
      await sendMessage(
        text,
        userId,
        userDoc.displayName,
        userDoc.photoURL || null,
        replyTo
      );
    },
    [userId, userDoc, sendMessage]
  );

  // Send image message handler
  const handleSendImage = useCallback(
    async (imageUri: string, fileName: string) => {
      if (!userId || !userDoc) return;
      await sendImageMessage(
        userId,
        userDoc.displayName,
        userDoc.photoURL || null,
        imageUri,
        fileName
      );
    },
    [userId, userDoc, sendImageMessage]
  );

  // Send document message handler
  const handleSendDocument = useCallback(
    async (fileUri: string, fileName: string, fileSize: number, mimeType: string) => {
      if (!userId || !userDoc) return;
      await sendDocumentMessage(
        userId,
        userDoc.displayName,
        userDoc.photoURL || null,
        fileUri,
        fileName,
        fileSize,
        mimeType
      );
    },
    [userId, userDoc, sendDocumentMessage]
  );

  // Typing handler with debounce
  const handleTyping = useCallback(() => {
    if (!userId) return;

    setTyping(userId, true);

    // Clear previous timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeout.current = setTimeout(() => {
      setTyping(userId, false);
    }, 3000);
  }, [userId, setTyping]);

  // Stop typing cleanup
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      if (userId) {
        setTyping(userId, false);
      }
    };
  }, [userId]);

  return {
    messages: giftedMessages,
    rawMessages: messages,
    activeChat,
    otherParticipant,
    otherPresence,
    isOtherTyping,
    loadingMessages,
    sendingMessage,
    hasMoreMessages,
    userId,
    userDoc,
    sendMessage: handleSend,
    sendImage: handleSendImage,
    sendDocument: handleSendDocument,
    loadMore: loadMoreMessages,
    onTyping: handleTyping,
    deleteMessage: deleteMsg,
  };
}
