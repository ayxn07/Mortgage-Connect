import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useChatList } from '@/src/hooks/useChat';
import { useChatStore } from '@/src/store/chatStore';
import { useAuthStore } from '@/src/store/authStore';
import { getAdminUser } from '@/src/services/auth';
import { Search, MessageCircle } from '@/components/Icons';
import { Feather } from '@expo/vector-icons';
import type { ChatListItem } from '@/src/types/chat';
import type { User } from '@/src/types/user';
import { formatRelativeTime } from '@/src/utils/formatters';
import { getInitials } from '@/src/utils/formatters';

// ─── Chat List Item Component ────────────────────────────────────────────────

function ChatListCard({
  item,
  userId,
  isDark,
  onPress,
  index,
}: {
  item: ChatListItem;
  userId: string;
  isDark: boolean;
  onPress: () => void;
  index: number;
}) {
  const other = item.otherParticipant;
  const unread = item.unreadCount?.[userId] || 0;
  const lastMsg = item.lastMessage;

  // Format last message time
  const timeStr = lastMsg?.timestamp?.toDate
    ? formatRelativeTime(lastMsg.timestamp.toDate())
    : '';

  // Last message preview
  const previewText = lastMsg
    ? lastMsg.type === 'text'
      ? lastMsg.text
      : lastMsg.type === 'image'
        ? 'Sent a photo'
        : 'Sent a file'
    : 'No messages yet';

  const isSentByMe = lastMsg?.senderId === userId;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`mx-5 mb-2.5 rounded-2xl p-4 ${isDark
          ? unread > 0
            ? 'bg-[#1a1a1a] border border-[#333]'
            : 'bg-[#111] border border-[#1e1e1e]'
          : unread > 0
            ? 'bg-white border border-gray-200'
            : 'bg-white border border-gray-100'
          }`}>
        <View className="flex-row items-center">
          {/* Avatar */}
          <View className="relative">
            <View
              className={`w-14 h-14 rounded-full items-center justify-center ${isDark ? 'bg-[#252525]' : 'bg-gray-100'
                }`}>
              <Text
                className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-700'
                  }`}>
                {getInitials(other.displayName)}
              </Text>
            </View>
            {/* Role badge */}
            {other.role === 'agent' && (
              <View className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full w-5 h-5 items-center justify-center border-2 border-black">
                <Feather name="briefcase" size={10} color="#fff" />
              </View>
            )}
            {other.role === 'admin' && (
              <View className="absolute -bottom-0.5 -right-0.5 bg-amber-500 rounded-full w-5 h-5 items-center justify-center border-2 border-black">
                <Feather name="shield" size={10} color="#fff" />
              </View>
            )}
          </View>

          {/* Content */}
          <View className="flex-1 ml-3.5">
            <View className="flex-row items-center justify-between">
              <Text
                className={`text-[15px] font-bold flex-1 mr-2 ${isDark ? 'text-white' : 'text-gray-900'
                  }`}
                numberOfLines={1}>
                {other.displayName}
              </Text>
              <Text
                className={`text-xs ${unread > 0
                  ? isDark
                    ? 'text-white font-semibold'
                    : 'text-black font-semibold'
                  : isDark
                    ? 'text-gray-600'
                    : 'text-gray-400'
                  }`}>
                {timeStr}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mt-1">
              <Text
                className={`text-[13px] flex-1 mr-3 ${unread > 0
                  ? isDark
                    ? 'text-gray-300 font-medium'
                    : 'text-gray-700 font-medium'
                  : isDark
                    ? 'text-gray-500'
                    : 'text-gray-400'
                  }`}
                numberOfLines={1}>
                {isSentByMe ? 'You: ' : ''}
                {previewText}
              </Text>
              {unread > 0 && (
                <View
                  className={`min-w-[22px] h-[22px] rounded-full items-center justify-center px-1.5 ${isDark ? 'bg-white' : 'bg-black'
                    }`}>
                  <Text
                    className={`text-[11px] font-bold ${isDark ? 'text-black' : 'text-white'
                      }`}>
                    {unread > 99 ? '99+' : unread}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Chat List Screen ──────────────────────────────────────────────────

export default function ChatsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const { chats, loading, totalUnread, userId, userDoc, resubscribe } = useChatList();
  const { createOrOpenChat } = useChatStore();
  const { firebaseUser } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [creatingAdminChat, setCreatingAdminChat] = useState(false);

  // Fetch admin user on mount
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const admin = await getAdminUser();
        setAdminUser(admin);
      } catch (error) {
        console.error('Failed to fetch admin:', error);
      } finally {
        setLoadingAdmin(false);
      }
    };

    fetchAdmin();
  }, []);

  // Check if current user is admin
  const isCurrentUserAdmin = userDoc?.role === 'admin';

  // Check if admin chat already exists
  const hasAdminChat = useMemo(() => {
    if (!adminUser) return false;
    return chats.some((chat) => chat.otherParticipant.uid === adminUser.uid);
  }, [chats, adminUser]);

  // Filter chats by search
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter((chat) =>
      chat.otherParticipant.displayName.toLowerCase().includes(query)
    );
  }, [chats, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      resubscribe();
    } finally {
      // Give Firestore a moment to deliver the fresh snapshot
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const openChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  // Handle message admin button
  const handleMessageAdmin = async () => {
    if (!adminUser || !firebaseUser || !userDoc) {
      Alert.alert('Error', 'Unable to start chat with admin. Please try again.');
      return;
    }

    setCreatingAdminChat(true);
    try {
      const chatId = await createOrOpenChat(
        firebaseUser.uid,
        userDoc.displayName,
        userDoc.photoURL || null,
        userDoc.role,
        {
          otherUserId: adminUser.uid,
          otherUserName: adminUser.displayName,
          otherUserPhoto: adminUser.photoURL || null,
          otherUserRole: adminUser.role,
          initialMessage: undefined,
        }
      );
      router.push(`/chat/${chatId}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create chat');
    } finally {
      setCreatingAdminChat(false);
    }
  };

  // ─── Empty State ──────────────────────────────────────────────────────────

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeIn.delay(200)}
      className="flex-1 items-center justify-center px-10 pt-20">
      <View
        className={`w-20 h-20 rounded-full items-center justify-center mb-5 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
          }`}>
        <MessageCircle color={isDark ? '#444' : '#ccc'} size={36} />
      </View>
      <Text
        className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'
          }`}>
        No conversations yet
      </Text>
      <Text
        className={`text-sm text-center leading-5 ${isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
        Start a conversation by messaging an agent from their profile page.
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/agents')}
        className={`mt-6 rounded-2xl px-8 py-3.5 ${isDark ? 'bg-white' : 'bg-black'
          }`}
        activeOpacity={0.8}>
        <Text
          className={`font-bold text-sm ${isDark ? 'text-black' : 'text-white'
            }`}>
          Browse Agents
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // ─── Loading State ────────────────────────────────────────────────────────

  if (loading && chats.length === 0) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}
        edges={['top']}>
        <View className="px-6 pt-4 pb-2">
          <Text
            className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Messages
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={isDark ? '#fff' : '#000'} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}
      edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text
              className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'
                }`}>
              Messages
            </Text>
            {totalUnread > 0 && (
              <Text
                className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Message Admin Button */}
      {!isCurrentUserAdmin && adminUser && !hasAdminChat && !loadingAdmin && (
        <Animated.View entering={FadeInDown.delay(100)} className="px-5 pb-2">
          <TouchableOpacity
            onPress={handleMessageAdmin}
            disabled={creatingAdminChat}
            activeOpacity={0.7}
            className={`rounded-2xl p-4 flex-row items-center ${isDark
                ? 'bg-amber-900/20 border border-amber-500/30'
                : 'bg-amber-50 border border-amber-200'
              }`}>
            <View
              className={`w-12 h-12 rounded-full items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'
                }`}>
              <Feather
                name="shield"
                size={20}
                color={isDark ? '#fbbf24' : '#d97706'}
              />
            </View>
            <View className="flex-1 ml-3">
              <Text
                className={`text-[15px] font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'
                  }`}>
                Message Admin Support
              </Text>
              <Text
                className={`text-[12px] mt-0.5 ${isDark ? 'text-amber-500/70' : 'text-amber-600/70'
                  }`}>
                Get help from {adminUser.displayName}
              </Text>
            </View>
            {creatingAdminChat ? (
              <ActivityIndicator
                size="small"
                color={isDark ? '#fbbf24' : '#d97706'}
              />
            ) : (
              <Feather
                name="chevron-right"
                size={20}
                color={isDark ? '#fbbf24' : '#d97706'}
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Search Bar */}
      {chats.length > 0 && (
        <View className="px-5 py-2">
          <View
            className={`flex-row items-center rounded-2xl px-4 py-3 ${isDark
              ? 'bg-[#141414] border border-[#252525]'
              : 'bg-white border border-gray-200'
              }`}>
            <Search color={isDark ? '#555' : '#999'} size={18} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search conversations..."
              placeholderTextColor={isDark ? '#555' : '#999'}
              className={`flex-1 ml-3 text-sm ${isDark ? 'text-white' : 'text-gray-900'
                }`}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather
                  name="x"
                  size={18}
                  color={isDark ? '#555' : '#999'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.chatId}
        renderItem={({ item, index }) => (
          <ChatListCard
            item={item}
            userId={userId || ''}
            isDark={isDark}
            onPress={() => openChat(item.chatId)}
            index={index}
          />
        )}
        ListEmptyComponent={
          searchQuery.trim() ? (
            <View className="items-center justify-center pt-20">
              <Text
                className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                No conversations match "{searchQuery}"
              </Text>
            </View>
          ) : (
            renderEmptyState()
          )
        }
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: 120,
          flexGrow: filteredChats.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#fff' : '#000'}
          />
        }
      />
    </SafeAreaView>
  );
}
