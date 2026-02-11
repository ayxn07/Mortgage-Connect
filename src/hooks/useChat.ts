import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import type { Chat, ChatListItem, ChatParticipant } from '../types/chat';

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
 * Hook to manage an active chat conversation.
 * Handles message subscription, typing indicators, read receipts.
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

  // Send message handler
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

  // Messages in chronological order (newest last) for FlatList
  const sortedMessages = useMemo(() => {
    return [...messages].reverse();
  }, [messages]);

  return {
    messages: sortedMessages,
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
    loadMore: loadMoreMessages,
    onTyping: handleTyping,
    deleteMessage: deleteMsg,
  };
}
