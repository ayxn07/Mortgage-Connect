import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useColorScheme } from 'nativewind';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useConversation } from '@/src/hooks/useChat';
import { ArrowLeft, Send } from '@/components/Icons';
import { getInitials, formatRelativeTime } from '@/src/utils/formatters';
import type { Message } from '@/src/types/chat';
import * as Haptics from 'expo-haptics';

// ─── Typing Indicator Animation ──────────────────────────────────────────────

function TypingIndicator({ isDark }: { isDark: boolean }) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      className={`flex-row items-center self-start ml-5 mb-3 px-4 py-3 rounded-2xl rounded-bl-sm ${
        isDark ? 'bg-[#1a1a1a] border border-[#252525]' : 'bg-white border border-gray-100'
      }`}
      style={{
        shadowColor: isDark ? '#000' : '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.3 : 0.04,
        shadowRadius: 4,
        elevation: 1,
      }}>
      <View className="flex-row gap-1.5">
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            entering={FadeIn.delay(i * 150).duration(300)}
            className={`w-2 h-2 rounded-full ${
              isDark ? 'bg-gray-500' : 'bg-gray-400'
            }`}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Date Separator ──────────────────────────────────────────────────────────

function DateSeparator({ date, isDark }: { date: string; isDark: boolean }) {
  return (
    <View className="items-center my-5">
      <View
        className={`px-4 py-1.5 rounded-full ${
          isDark ? 'bg-[#141414] border border-[#1e1e1e]' : 'bg-white border border-gray-100'
        }`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.03,
          shadowRadius: 3,
          elevation: 1,
        }}>
        <Text
          className={`text-[11px] font-semibold tracking-wide ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
          {date}
        </Text>
      </View>
    </View>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isMe,
  isDark,
  showAvatar,
  onLongPress,
}: {
  message: Message;
  isMe: boolean;
  isDark: boolean;
  showAvatar: boolean;
  onLongPress: () => void;
}) {
  const time = message.timestamp?.toDate
    ? formatTime(message.timestamp.toDate())
    : '';

  // Check read status
  const readByOther = Object.keys(message.readBy || {}).length > 1;

  if (message.deleted) {
    return (
      <View className={`px-5 mb-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
        <View
          className={`rounded-2xl px-4 py-2.5 max-w-[75%] ${
            isDark
              ? 'bg-[#141414] border border-[#1e1e1e]'
              : 'bg-gray-50 border border-gray-100'
          }`}>
          <Text
            className={`text-[13px] italic ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`}>
            This message was deleted
          </Text>
        </View>
      </View>
    );
  }

  // Reply preview
  const replyPreview = message.replyTo ? (
    <View
      className={`mb-2 px-3 py-2 rounded-xl border-l-[3px] ${
        isMe
          ? isDark
            ? 'bg-white/10 border-white/30'
            : 'bg-white/10 border-white/30'
          : isDark
            ? 'bg-[#252525] border-gray-600'
            : 'bg-gray-100 border-gray-300'
      }`}>
      <Text
        className={`text-[11px] font-bold mb-0.5 ${
          isMe
            ? isDark
              ? 'text-gray-400'
              : 'text-white/60'
            : isDark
              ? 'text-gray-400'
              : 'text-gray-500'
        }`}
        numberOfLines={1}>
        {message.replyTo.senderName}
      </Text>
      <Text
        className={`text-[11px] ${
          isMe
            ? isDark
              ? 'text-gray-500'
              : 'text-white/40'
            : isDark
              ? 'text-gray-500'
              : 'text-gray-400'
        }`}
        numberOfLines={2}>
        {message.replyTo.text}
      </Text>
    </View>
  ) : null;

  return (
    <View className={`px-5 ${showAvatar ? 'mt-3' : 'mt-0.5'} ${isMe ? 'items-end' : 'items-start'}`}>
      {/* Sender name for non-me messages */}
      {!isMe && showAvatar && (
        <View className="flex-row items-center mb-1.5 ml-1">
          <View
            className={`w-6 h-6 rounded-full items-center justify-center mr-1.5 ${
              isDark ? 'bg-[#252525]' : 'bg-gray-200'
            }`}>
            <Text
              className={`text-[9px] font-bold ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
              {getInitials(message.senderName)}
            </Text>
          </View>
          <Text
            className={`text-[11px] font-semibold ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
            {message.senderName}
          </Text>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onLongPress();
        }}
        delayLongPress={400}>
        <View
          className={`rounded-2xl px-4 py-3 max-w-[78%] ${
            isMe
              ? isDark
                ? 'bg-white rounded-br-sm'
                : 'bg-black rounded-br-sm'
              : isDark
                ? 'bg-[#1a1a1a] rounded-bl-sm border border-[#252525]'
                : 'bg-white rounded-bl-sm border border-gray-100'
          }`}
          style={{
            minWidth: 70,
            ...(isMe
              ? {}
              : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDark ? 0.2 : 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                }),
          }}>
          {replyPreview}
          <Text
            className={`text-[15px] leading-[22px] ${
              isMe
                ? isDark
                  ? 'text-black'
                  : 'text-white'
                : isDark
                  ? 'text-gray-100'
                  : 'text-gray-900'
            }`}>
            {message.content?.text || ''}
          </Text>
          <View className="flex-row items-center justify-end mt-1.5 gap-1.5">
            {message.edited && (
              <Text
                className={`text-[10px] italic ${
                  isMe
                    ? isDark
                      ? 'text-gray-500'
                      : 'text-white/40'
                    : isDark
                      ? 'text-gray-600'
                      : 'text-gray-400'
                }`}>
                edited
              </Text>
            )}
            <Text
              className={`text-[10px] ${
                isMe
                  ? isDark
                    ? 'text-gray-500'
                    : 'text-white/40'
                  : isDark
                    ? 'text-gray-600'
                    : 'text-gray-400'
              }`}>
              {time}
            </Text>
            {isMe && (
              <Feather
                name={readByOther ? 'check-circle' : 'check'}
                size={12}
                color={
                  readByOther
                    ? '#3b82f6'
                    : isDark
                      ? '#999'
                      : '#888'
                }
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Time Formatter ──────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined,
  });
}

// ─── Reply Preview Bar ──────────────────────────────────────────────────────

function ReplyBar({
  message,
  isDark,
  onCancel,
}: {
  message: Message;
  isDark: boolean;
  onCancel: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      className={`mx-4 mb-0 px-4 py-3 rounded-t-2xl flex-row items-center border-l-[3px] ${
        isDark
          ? 'bg-[#141414] border-white/30'
          : 'bg-gray-50 border-black/20'
      }`}>
      <Feather
        name="corner-up-left"
        size={14}
        color={isDark ? '#666' : '#999'}
        style={{ marginRight: 10 }}
      />
      <View className="flex-1">
        <Text
          className={`text-[11px] font-bold ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
          Replying to {message.senderName}
        </Text>
        <Text
          className={`text-[12px] mt-0.5 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}
          numberOfLines={1}>
          {message.content?.text || 'Message'}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onCancel}
        className="ml-3 p-1.5 rounded-full"
        style={{
          backgroundColor: isDark ? '#252525' : '#e5e5e5',
        }}>
        <Feather name="x" size={14} color={isDark ? '#888' : '#666'} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Conversation Screen ────────────────────────────────────────────────

export default function ChatConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ chatId: string }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const chatId = params.chatId;

  const {
    messages,
    rawMessages,
    activeChat,
    otherParticipant,
    otherPresence,
    isOtherTyping,
    loadingMessages,
    sendingMessage,
    hasMoreMessages,
    userId,
    sendMessage,
    loadMore,
    onTyping,
    deleteMessage,
  } = useConversation(chatId);

  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Handle send
  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    setReplyingTo(null);
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await sendMessage(
        text,
        replyingTo
          ? {
            messageId: replyingTo.messageId,
            text: replyingTo.content?.text || '',
            senderName: replyingTo.senderName,
          }
          : undefined
      );
    } catch {
      // Error handled in store
    }
  }, [inputText, replyingTo, sendMessage]);

  // Handle text change
  const handleTextChange = useCallback(
    (text: string) => {
      setInputText(text);
      if (text.length > 0) {
        onTyping();
      }
    },
    [onTyping]
  );

  // Handle long press on message
  const handleMessageLongPress = useCallback(
    (message: Message) => {
      const isMyMessage = message.senderId === userId;
      const options = [
        {
          text: 'Reply',
          onPress: () => setReplyingTo(message),
        },
        ...(isMyMessage && !message.deleted
          ? [
            {
              text: 'Delete',
              style: 'destructive' as const,
              onPress: () => {
                Alert.alert(
                  'Delete Message',
                  'This message will be deleted for everyone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => deleteMessage(message.messageId),
                    },
                  ]
                );
              },
            },
          ]
          : []),
        { text: 'Cancel', style: 'cancel' as const },
      ];

      Alert.alert('Message', undefined, options);
    },
    [userId, deleteMessage]
  );

  // Group messages by date for separators
  const messagesWithDates = useMemo(() => {
    const result: Array<{ type: 'date'; date: string } | { type: 'message'; message: Message }> =
      [];
    let lastDate = '';

    for (const msg of messages) {
      const msgDate = msg.timestamp?.toDate
        ? formatDateLabel(msg.timestamp.toDate())
        : '';

      if (msgDate && msgDate !== lastDate) {
        result.push({ type: 'date', date: msgDate });
        lastDate = msgDate;
      }
      result.push({ type: 'message', message: msg });
    }

    return result;
  }, [messages]);

  // Online status text
  const statusText = useMemo(() => {
    if (isOtherTyping) return 'typing...';
    if (otherPresence?.isOnline) return 'Online';
    if (otherPresence?.lastSeen?.toDate) {
      return `Last seen ${formatRelativeTime(otherPresence.lastSeen.toDate())}`;
    }
    return '';
  }, [isOtherTyping, otherPresence]);

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (!chatId) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <Text className={isDark ? 'text-gray-500' : 'text-gray-400'}>
          No chat selected
        </Text>
      </SafeAreaView>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}
      edges={['top']}>
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1"
        keyboardVerticalOffset={0}>
        {/* Header */}
        <View
          className={`flex-row items-center px-4 py-3.5 ${
            isDark ? 'bg-black' : 'bg-white'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}>
          <TouchableOpacity
            onPress={() => router.back()}
            className={`mr-3 p-2 rounded-full ${
              isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
            }`}
            activeOpacity={0.7}>
            <ArrowLeft color={isDark ? '#fff' : '#000'} size={20} />
          </TouchableOpacity>

          {/* Avatar */}
          <View className="relative">
            <View
              className={`w-11 h-11 rounded-full items-center justify-center ${
                isDark ? 'bg-[#252525]' : 'bg-gray-100'
              }`}>
              <Text
                className={`text-sm font-bold ${
                  isDark ? 'text-white' : 'text-gray-700'
                }`}>
                {otherParticipant
                  ? getInitials(otherParticipant.displayName)
                  : '?'}
              </Text>
            </View>
            {/* Online indicator */}
            {otherPresence?.isOnline && (
              <View
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500"
                style={{
                  borderWidth: 2.5,
                  borderColor: isDark ? '#000' : '#fff',
                }}
              />
            )}
          </View>

          {/* Name & Status */}
          <View className="flex-1 ml-3">
            <Text
              className={`text-[16px] font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
              numberOfLines={1}>
              {otherParticipant?.displayName || 'Chat'}
            </Text>
            {statusText ? (
              <Text
                className={`text-[12px] mt-0.5 ${
                  isOtherTyping
                    ? 'text-green-500 font-semibold'
                    : otherPresence?.isOnline
                      ? 'text-green-500 font-medium'
                      : isDark
                        ? 'text-gray-500'
                        : 'text-gray-400'
                }`}>
                {statusText}
              </Text>
            ) : null}
          </View>

          {/* Role badge */}
          {otherParticipant?.role === 'agent' && (
            <View
              className={`px-3 py-1.5 rounded-full ${
                isDark ? 'bg-blue-500/15' : 'bg-blue-50'
              }`}>
              <Text
                className={`text-[10px] font-bold tracking-wide ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                AGENT
              </Text>
            </View>
          )}
          {otherParticipant?.role === 'admin' && (
            <View
              className={`px-3 py-1.5 rounded-full ${
                isDark ? 'bg-amber-500/15' : 'bg-amber-50'
              }`}>
              <Text
                className={`text-[10px] font-bold tracking-wide ${
                  isDark ? 'text-amber-400' : 'text-amber-600'
                }`}>
                ADMIN
              </Text>
            </View>
          )}
        </View>

        {/* Messages */}
        {loadingMessages && messages.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <View
              className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
              }`}>
              <ActivityIndicator color={isDark ? '#fff' : '#000'} size="large" />
            </View>
            <Text
              className={`text-sm font-medium ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
              Loading messages...
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messagesWithDates}
            keyExtractor={(item, index) =>
              item.type === 'date'
                ? `date-${item.date}-${index}`
                : `msg-${item.message.messageId}`
            }
            renderItem={({ item, index }) => {
              if (item.type === 'date') {
                return <DateSeparator date={item.date} isDark={isDark} />;
              }

              const msg = item.message;
              const isMe = msg.senderId === userId;

              // Determine if we should show avatar (first message from this sender in a group)
              const prevItem = index > 0 ? messagesWithDates[index - 1] : null;
              const showAvatar =
                !isMe &&
                (prevItem?.type === 'date' ||
                  (prevItem?.type === 'message' && prevItem.message.senderId !== msg.senderId));

              return (
                <MessageBubble
                  message={msg}
                  isMe={isMe}
                  isDark={isDark}
                  showAvatar={showAvatar}
                  onLongPress={() => handleMessageLongPress(msg)}
                />
              );
            }}
            ListHeaderComponent={
              isOtherTyping ? (
                <TypingIndicator isDark={isDark} />
              ) : null
            }
            ListFooterComponent={
              hasMoreMessages && messages.length >= 30 ? (
                <TouchableOpacity
                  onPress={loadMore}
                  className={`items-center py-5 mx-20 my-2 rounded-full ${
                    isDark ? 'bg-[#141414] border border-[#1e1e1e]' : 'bg-white border border-gray-100'
                  }`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isDark ? 0.2 : 0.03,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                  activeOpacity={0.7}>
                  <Text
                    className={`text-xs font-semibold ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    Load older messages
                  </Text>
                </TouchableOpacity>
              ) : null
            }
            ListEmptyComponent={
              <Animated.View
                entering={FadeIn.delay(300)}
                className="flex-1 items-center justify-center pt-20">
                <View
                  className={`w-20 h-20 rounded-full items-center justify-center mb-5 ${
                    isDark ? 'bg-[#141414] border border-[#1e1e1e]' : 'bg-white border border-gray-100'
                  }`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.2 : 0.04,
                    shadowRadius: 6,
                    elevation: 2,
                  }}>
                  <Feather
                    name="message-circle"
                    size={32}
                    color={isDark ? '#444' : '#ccc'}
                  />
                </View>
                <Text
                  className={`text-base font-bold mb-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                  No messages yet
                </Text>
                <Text
                  className={`text-sm ${
                    isDark ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                  Say hello to start the conversation
                </Text>
              </Animated.View>
            }
            inverted
            contentContainerStyle={{
              paddingTop: 10,
              paddingBottom: 10,
              flexGrow: messages.length === 0 ? 1 : undefined,
            }}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Reply Bar */}
        {replyingTo && (
          <ReplyBar
            message={replyingTo}
            isDark={isDark}
            onCancel={() => setReplyingTo(null)}
          />
        )}

        {/* Input Bar */}
        <View>
          <View
            className={`flex-row items-end px-4 py-3 ${
              isDark ? 'bg-black' : 'bg-white'
            }`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: isDark ? 0.3 : 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}>
            <View
              className={`flex-1 flex-row items-end rounded-3xl px-4 py-3 mr-3 min-h-[48px] max-h-[120px] ${
                isDark
                  ? 'bg-[#141414] border border-[#252525]'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
              <TextInput
                value={inputText}
                onChangeText={handleTextChange}
                placeholder="Type a message..."
                placeholderTextColor={isDark ? '#555' : '#999'}
                multiline
                maxLength={2000}
                className={`flex-1 text-[15px] max-h-[100px] ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
                style={{ paddingTop: 0, paddingBottom: 0 }}
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || sendingMessage}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                inputText.trim()
                  ? isDark
                    ? 'bg-white'
                    : 'bg-black'
                  : isDark
                    ? 'bg-[#1a1a1a] border border-[#252525]'
                    : 'bg-gray-100 border border-gray-200'
              }`}
              activeOpacity={0.7}
              style={inputText.trim() ? {
                shadowColor: isDark ? '#fff' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 3,
              } : undefined}>
              {sendingMessage ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? '#000' : '#fff'}
                />
              ) : (
                <Feather
                  name="send"
                  size={18}
                  color={
                    inputText.trim()
                      ? isDark
                        ? '#000'
                        : '#fff'
                      : isDark
                        ? '#555'
                        : '#999'
                  }
                  style={{ marginLeft: 2 }}
                />
              )}
            </TouchableOpacity>
          </View>
          {/* Bottom safe area spacer */}
          <SafeAreaView edges={['bottom']} className={isDark ? 'bg-black' : 'bg-white'} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
