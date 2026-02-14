import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Image,
  ActionSheetIOS,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { GiftedChat, Bubble, InputToolbar, Composer, Send, Day, Time } from 'react-native-gifted-chat';
import type { IMessage, BubbleProps, SendProps, DayProps, TimeProps } from 'react-native-gifted-chat';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useConversation } from '@/src/hooks/useChat';
import { ArrowLeft } from '@/components/Icons';
import { getInitials, formatRelativeTime } from '@/src/utils/formatters';

// ─── Custom Attachment Picker ─────────────────────────────────────────────────

function AttachmentPicker({
  visible,
  onClose,
  onCamera,
  onGallery,
  onDocument,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
  onDocument: () => void;
  isDark: boolean;
}) {
  const options = [
    { icon: 'camera', label: 'Take Photo', onPress: onCamera, color: '#3b82f6' },
    { icon: 'image', label: 'Photo Library', onPress: onGallery, color: '#8b5cf6' },
    { icon: 'file-text', label: 'Send File', onPress: onDocument, color: '#f59e0b' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}>
        <Pressable
          style={{
            backgroundColor: isDark ? '#1a1a1a' : '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 8,
            paddingBottom: 32,
            paddingHorizontal: 16,
          }}
          onPress={(e) => e.stopPropagation()}>
          {/* Handle bar */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: isDark ? '#333' : '#ddd',
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />

          {/* Title */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: isDark ? '#fff' : '#1a1a1a',
              marginBottom: 16,
              paddingHorizontal: 8,
            }}>
            Send Attachment
          </Text>

          {/* Options */}
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.label}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                setTimeout(option.onPress, 300);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: isDark ? '#0a0a0a' : '#f9f9f9',
                marginBottom: index < options.length - 1 ? 12 : 0,
              }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: `${option.color}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                <Feather name={option.icon as any} size={22} color={option.color} />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: isDark ? '#fff' : '#1a1a1a',
                  flex: 1,
                }}>
                {option.label}
              </Text>
              <Feather
                name="chevron-right"
                size={20}
                color={isDark ? '#555' : '#aaa'}
              />
            </TouchableOpacity>
          ))}

          {/* Cancel button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={{
              marginTop: 16,
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: isDark ? '#0a0a0a' : '#f9f9f9',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: isDark ? '#888' : '#666',
              }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Custom Bubble ────────────────────────────────────────────────────────────

function CustomBubble(props: BubbleProps<IMessage> & { extraData: { isDark: boolean } }) {
  const isDark = props.extraData?.isDark ?? false;
  const currentMessage = props.currentMessage as any;

  // Document message - custom render
  if (currentMessage?.document) {
    const isMe = props.position === 'right';
    const doc = currentMessage.document;
    const fileSizeStr = doc.fileSize
      ? doc.fileSize > 1024 * 1024
        ? `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`
        : `${(doc.fileSize / 1024).toFixed(1)} KB`
      : '';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (doc.url) {
            Linking.openURL(doc.url).catch(() =>
              Alert.alert('Error', 'Could not open file')
            );
          }
        }}
        style={{
          backgroundColor: isMe
            ? isDark ? '#fff' : '#000'
            : isDark ? '#1a1a1a' : '#fff',
          borderRadius: 16,
          borderBottomRightRadius: isMe ? 4 : 16,
          borderBottomLeftRadius: isMe ? 16 : 4,
          padding: 12,
          maxWidth: 260,
          marginBottom: 2,
          borderWidth: isMe ? 0 : 1,
          borderColor: isDark ? '#252525' : '#f0f0f0',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: isMe
                ? isDark ? '#e5e5e5' : '#333'
                : isDark ? '#252525' : '#f5f5f5',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}>
            <Feather
              name="file-text"
              size={18}
              color={isMe
                ? isDark ? '#333' : '#ccc'
                : isDark ? '#888' : '#666'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isMe
                  ? isDark ? '#000' : '#fff'
                  : isDark ? '#e5e5e5' : '#1a1a1a',
              }}>
              {doc.fileName}
            </Text>
            {fileSizeStr ? (
              <Text
                style={{
                  fontSize: 11,
                  marginTop: 2,
                  color: isMe
                    ? isDark ? '#666' : 'rgba(255,255,255,0.5)'
                    : isDark ? '#666' : '#999',
                }}>
                {fileSizeStr}
              </Text>
            ) : null}
          </View>
          <Feather
            name="download"
            size={16}
            color={isMe
              ? isDark ? '#666' : 'rgba(255,255,255,0.5)'
              : isDark ? '#555' : '#999'}
            style={{ marginLeft: 8 }}
          />
        </View>
      </TouchableOpacity>
    );
  }

  // Deleted message style
  if (currentMessage?.deleted) {
    return (
      <View
        style={{
          backgroundColor: isDark ? '#141414' : '#f5f5f5',
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 10,
          maxWidth: 260,
          marginBottom: 2,
          borderWidth: 1,
          borderColor: isDark ? '#1e1e1e' : '#eee',
        }}>
        <Text
          style={{
            fontSize: 13,
            fontStyle: 'italic',
            color: isDark ? '#555' : '#aaa',
          }}>
          This message was deleted
        </Text>
      </View>
    );
  }

  return (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: isDark ? '#fff' : '#000',
          borderRadius: 16,
          borderBottomRightRadius: 4,
          paddingVertical: 2,
          paddingHorizontal: 2,
        },
        left: {
          backgroundColor: isDark ? '#1a1a1a' : '#fff',
          borderRadius: 16,
          borderBottomLeftRadius: 4,
          borderWidth: 1,
          borderColor: isDark ? '#252525' : '#f0f0f0',
          paddingVertical: 2,
          paddingHorizontal: 2,
        },
      }}
      textStyle={{
        right: {
          color: isDark ? '#000' : '#fff',
          fontSize: 15,
          lineHeight: 21,
        },
        left: {
          color: isDark ? '#e5e5e5' : '#1a1a1a',
          fontSize: 15,
          lineHeight: 21,
        },
      }}
      renderTicks={() => null}
    />
  );
}

// ─── Custom Day ───────────────────────────────────────────────────────────────

function CustomDay(props: DayProps & { extraData: { isDark: boolean } }) {
  const isDark = props.extraData?.isDark ?? false;
  return (
    <Day
      {...props}
      textProps={{
        style: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.5,
          color: isDark ? '#555' : '#aaa',
        },
      }}
      containerStyle={{
        marginTop: 16,
        marginBottom: 16,
      }}
      wrapperStyle={{
        backgroundColor: isDark ? '#141414' : '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: isDark ? '#1e1e1e' : '#eee',
      }}
    />
  );
}

// ─── Custom Time ──────────────────────────────────────────────────────────────

function CustomTime(props: TimeProps<IMessage> & { extraData: { isDark: boolean } }) {
  const isDark = props.extraData?.isDark ?? false;
  const currentMessage = props.currentMessage as any;
  const isMe = props.position === 'right';

  // Determine the status icon to show
  const getStatusIcon = () => {
    if (!isMe) return null;
    
    // Read by other person - blue double check
    if (currentMessage?.readByOther) {
      return (
        <Feather
          name="check-circle"
          size={11}
          color="#3b82f6"
          style={{ marginLeft: 3 }}
        />
      );
    }
    
    // Sent but not read - single gray check
    if (currentMessage?.sent) {
      return (
        <Feather
          name="check"
          size={11}
          color={isDark ? '#666' : 'rgba(255,255,255,0.4)'}
          style={{ marginLeft: 3 }}
        />
      );
    }
    
    // Sending - clock icon
    return (
      <Feather
        name="clock"
        size={10}
        color={isDark ? '#666' : 'rgba(255,255,255,0.4)'}
        style={{ marginLeft: 3 }}
      />
    );
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 2, paddingHorizontal: 4 }}>
      {currentMessage?.edited && (
        <Text
          style={{
            fontSize: 10,
            fontStyle: 'italic',
            color: isMe
              ? isDark ? '#666' : 'rgba(255,255,255,0.4)'
              : isDark ? '#555' : '#bbb',
            marginRight: 4,
          }}>
          edited
        </Text>
      )}
      <Time
        {...props}
        timeTextStyle={{
          right: {
            fontSize: 10,
            color: isDark ? '#666' : 'rgba(255,255,255,0.4)',
          },
          left: {
            fontSize: 10,
            color: isDark ? '#555' : '#bbb',
          },
        }}
      />
      {getStatusIcon()}
    </View>
  );
}

// ─── Custom Send Button ───────────────────────────────────────────────────────

function CustomSend(props: SendProps<IMessage> & { extraData: { isDark: boolean } }) {
  const isDark = props.extraData?.isDark ?? false;
  const hasText = props.text && props.text.trim().length > 0;

  return (
    <Send
      {...props}
      containerStyle={{
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 4,
      }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: hasText
            ? isDark ? '#fff' : '#000'
            : isDark ? '#1a1a1a' : '#e5e5e5',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Feather
          name="send"
          size={16}
          color={hasText
            ? isDark ? '#000' : '#fff'
            : isDark ? '#555' : '#aaa'}
          style={{ marginLeft: 1 }}
        />
      </View>
    </Send>
  );
}

// ─── Custom Message Image ─────────────────────────────────────────────────────

function CustomMessageImage(props: any) {
  return (
    <View style={{ borderRadius: 12, overflow: 'hidden', margin: 3 }}>
      <Image
        source={{ uri: props.currentMessage.image }}
        style={{
          width: 200,
          height: 200,
          borderRadius: 12,
        }}
        resizeMode="cover"
      />
    </View>
  );
}

// ─── Typing Indicator Footer ──────────────────────────────────────────────────

function TypingFooter({ isDark, name }: { isDark: boolean; name: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 16,
        marginBottom: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: isDark ? '#252525' : '#eee',
      }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: isDark ? '#555' : '#bbb',
              opacity: 0.6 + i * 0.2,
            }}
          />
        ))}
      </View>
      <Text
        style={{
          fontSize: 11,
          marginLeft: 8,
          color: isDark ? '#555' : '#aaa',
          fontStyle: 'italic',
        }}>
        {name} is typing...
      </Text>
    </View>
  );
}

// ─── Attachment Action Sheet ──────────────────────────────────────────────────

function showAttachmentOptions(
  isDark: boolean,
  onCamera: () => void,
  onGallery: () => void,
  onDocument: () => void
) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Take Photo', 'Photo Library', 'Send File'],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) onCamera();
        else if (buttonIndex === 2) onGallery();
        else if (buttonIndex === 3) onDocument();
      }
    );
  } else {
    Alert.alert(
      'Send Attachment',
      undefined,
      [
        { text: 'Take Photo', onPress: onCamera },
        { text: 'Photo Library', onPress: onGallery },
        { text: 'Send File', onPress: onDocument },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }
}

// ─── Main Conversation Screen ─────────────────────────────────────────────────

export default function ChatConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ chatId: string }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const chatId = params.chatId;

  const {
    messages,
    activeChat,
    otherParticipant,
    otherPresence,
    isOtherTyping,
    loadingMessages,
    sendingMessage,
    hasMoreMessages,
    userId,
    sendMessage,
    sendImage,
    sendDocument,
    loadMore,
    onTyping,
    deleteMessage,
  } = useConversation(chatId);

  const [isUploading, setIsUploading] = useState(false);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);

  // Track keyboard visibility
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Calculate conditional bottom padding
  const bottomPadding = isKeyboardVisible
    ? Math.max(insets.bottom * 0.4, 8)
    : insets.bottom;

  // Online status text
  const statusText = useMemo(() => {
    if (isOtherTyping) return 'typing...';
    if (otherPresence?.isOnline) return 'Online';
    if (otherPresence?.lastSeen?.toDate) {
      return `Last seen ${formatRelativeTime(otherPresence.lastSeen.toDate())}`;
    }
    return '';
  }, [isOtherTyping, otherPresence]);

  // Handle sending text messages via GiftedChat
  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      if (newMessages.length === 0) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const msg = newMessages[0];
      sendMessage(msg.text).catch(() => {});
    },
    [sendMessage]
  );

  // Pick image from gallery
  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to send images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const fileName = asset.fileName || `photo_${Date.now()}.jpg`;

      setIsUploading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendImage(asset.uri, fileName);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send image');
    } finally {
      setIsUploading(false);
    }
  }, [sendImage]);

  // Take photo with camera
  const handleTakePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const fileName = asset.fileName || `camera_${Date.now()}.jpg`;

      setIsUploading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendImage(asset.uri, fileName);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send photo');
    } finally {
      setIsUploading(false);
    }
  }, [sendImage]);

  // Pick a document/file
  const handlePickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      setIsUploading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendDocument(
        asset.uri,
        asset.name || `file_${Date.now()}`,
        asset.size || 0,
        asset.mimeType || 'application/octet-stream'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send file');
    } finally {
      setIsUploading(false);
    }
  }, [sendDocument]);

  // Handle long press on message for delete
  const handleLongPress = useCallback(
    (_context: unknown, currentMessage?: unknown) => {
      const msg = currentMessage as IMessage & { deleted?: boolean } | undefined;
      if (!msg || !userId) return;
      const isMyMessage = msg.user._id === userId;
      const isDeleted = msg.deleted;

      const options: any[] = [
        ...(isMyMessage && !isDeleted
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
                        onPress: () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          deleteMessage(msg._id as string);
                        },
                      },
                    ]
                  );
                },
              },
            ]
          : []),
        { text: 'Cancel', style: 'cancel' as const },
      ];

      if (options.length > 1) {
        Alert.alert('Message', undefined, options);
      }
    },
    [userId, deleteMessage]
  );

  // Attachment button press
  const handleAttachmentPress = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Photo Library', 'Send File'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleTakePhoto();
          else if (buttonIndex === 2) handlePickImage();
          else if (buttonIndex === 3) handlePickDocument();
        }
      );
    } else {
      setShowAttachmentPicker(true);
    }
  }, [handleTakePhoto, handlePickImage, handlePickDocument]);

  // ─── Loading State ────────────────────────────────────────────────────────

  if (!chatId) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#000' : '#f9f9f9'}}
        edges={['top']}>
        <Text style={{ color: isDark ? '#555' : '#aaa' }}>
          No chat selected
        </Text>
      </SafeAreaView>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}
      edges={['top']}>
      {/* Attachment Picker Modal */}
      <AttachmentPicker
        visible={showAttachmentPicker}
        onClose={() => setShowAttachmentPicker(false)}
        onCamera={handleTakePhoto}
        onGallery={handlePickImage}
        onDocument={handlePickDocument}
        isDark={isDark}
      />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: isDark ? '#000' : '#fff',
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#1e1e1e' : '#f0f0f0',
        }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginRight: 12,
            padding: 8,
            borderRadius: 20,
            backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
          }}
          activeOpacity={0.7}>
          <ArrowLeft color={isDark ? '#fff' : '#000'} size={20} />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={{ position: 'relative' }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
            }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: isDark ? '#fff' : '#333',
              }}>
              {otherParticipant
                ? getInitials(otherParticipant.displayName)
                : '?'}
            </Text>
          </View>
          {otherPresence?.isOnline && (
            <View
              style={{
                position: 'absolute',
                bottom: -1,
                right: -1,
                width: 13,
                height: 13,
                borderRadius: 6.5,
                backgroundColor: '#22c55e',
                borderWidth: 2.5,
                borderColor: isDark ? '#000' : '#fff',
              }}
            />
          )}
        </View>

        {/* Name & Status */}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: isDark ? '#fff' : '#1a1a1a',
            }}
            numberOfLines={1}>
            {otherParticipant?.displayName || 'Chat'}
          </Text>
          {statusText ? (
            <Text
              style={{
                fontSize: 12,
                marginTop: 1,
                color: isOtherTyping
                  ? '#22c55e'
                  : otherPresence?.isOnline
                    ? '#22c55e'
                    : isDark ? '#555' : '#aaa',
                fontWeight: isOtherTyping || otherPresence?.isOnline ? '600' : '400',
              }}>
              {statusText}
            </Text>
          ) : null}
        </View>

        {/* Role badge */}
        {otherParticipant?.role === 'agent' && (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff',
            }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.5,
                color: isDark ? '#60a5fa' : '#2563eb',
              }}>
              AGENT
            </Text>
          </View>
        )}
        {otherParticipant?.role === 'admin' && (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : '#fffbeb',
            }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.5,
                color: isDark ? '#fbbf24' : '#d97706',
              }}>
              ADMIN
            </Text>
          </View>
        )}
      </View>

      {/* Upload indicator */}
      {isUploading && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            backgroundColor: isDark ? '#0a0a0a' : '#fafafa',
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#1e1e1e' : '#f0f0f0',
          }}>
          <ActivityIndicator size="small" color={isDark ? '#fff' : '#000'} />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 12,
              color: isDark ? '#888' : '#666',
              fontWeight: '500',
            }}>
            Uploading...
          </Text>
        </View>
      )}

      {/* Loading state */}
      <KeyboardAvoidingView
        style={{ flex: 1, marginBottom: 8 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        {loadingMessages && messages.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                marginBottom: 12,
              }}>
              <ActivityIndicator color={isDark ? '#fff' : '#000'} size="large" />
            </View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: isDark ? '#555' : '#aaa',
              }}>
              Loading messages...
            </Text>
          </View>
        ) : (
          <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: userId || '',
          }}
          // Custom renders
          renderBubble={(props) => <CustomBubble {...props} extraData={{ isDark }} />}
          renderDay={(props) => <CustomDay {...props} extraData={{ isDark }} />}
          renderTime={(props) => <CustomTime {...props} extraData={{ isDark }} />}
          
          renderMessageImage={(props) => <CustomMessageImage {...props} />}
          renderSend={(props) => <CustomSend {...props} extraData={{ isDark }} />}
          // Custom input toolbar
          renderInputToolbar={(props) => (
            <InputToolbar
              {...props}
              containerStyle={{
                backgroundColor: isDark ? '#000' : '#fff',
                borderTopWidth: 1,
                borderTopColor: isDark ? '#1e1e1e' : '#f0f0f0',
                paddingTop: 6,
                paddingHorizontal: 4,
                paddingBottom: bottomPadding || 6
              }}
              primaryStyle={{
                alignItems: 'center',
              }}
            />
          )}
          // Custom composer
          renderComposer={(props) => (
            <Composer
              {...props}
              textInputProps={{
                ...(props.textInputProps || {}),
                placeholder: 'Type a message...',
                placeholderTextColor: isDark ? '#555' : '#aaa',
                style: {
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  borderRadius: 22,
                  paddingHorizontal: 16,
                  paddingTop: Platform.OS === 'ios' ? 10 : 8,
                  paddingBottom: Platform.OS === 'ios' ? 10 : 8,
                  
                  marginLeft: 4,
                  marginRight: 4,
                  fontSize: 15,
                  lineHeight: 20,
                  color: isDark ? '#fff' : '#1a1a1a',
                  borderWidth: 1,
                  borderColor: isDark ? '#252525' : '#eee',
                  maxHeight: 100,
                  flex: 1,
                },
              }}
            />
          )}
          // Custom actions (attachment button)
          renderActions={() => (
            <TouchableOpacity
              onPress={handleAttachmentPress}
              activeOpacity={0.7}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 8,
                marginBottom: 4,
              }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? '#252525' : '#eee',
                }}>
                <Feather name="plus" size={20} color={isDark ? '#888' : '#666'} />
              </View>
            </TouchableOpacity>
          )}
          // Footer - typing indicator
          renderChatFooter={() =>
            isOtherTyping ? (
              <TypingFooter
                isDark={isDark}
                name={otherParticipant?.displayName || 'User'}
              />
            ) : null
          }
          // Long press on message
          onLongPressMessage={handleLongPress}
          // Load earlier
          loadEarlierMessagesProps={{
            isAvailable: hasMoreMessages && messages.length >= 30,
            isLoading: loadingMessages,
            onPress: loadMore,
            wrapperStyle: {
              backgroundColor: isDark ? '#141414' : '#f5f5f5',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isDark ? '#1e1e1e' : '#eee',
              paddingVertical: 8,
              paddingHorizontal: 20,
            },
            textStyle: {
              color: isDark ? '#888' : '#666',
              fontSize: 12,
              fontWeight: '600',
            },
            activityIndicatorColor: isDark ? '#fff' : '#000',
          }}
          // Scroll to bottom
          isScrollToBottomEnabled
          scrollToBottomComponent={() => (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDark ? '#252525' : '#eee',
              }}>
              <Feather name="chevron-down" size={20} color={isDark ? '#888' : '#666'} />
            </View>
          )}
          // Force send button always visible
          isSendButtonAlwaysVisible
          // List/container styling
          listProps={{
            style: {
              backgroundColor: isDark ? '#000' : '#fafafa',
            },
            keyboardShouldPersistTaps: 'handled',
          }}
          maxComposerHeight={100}
          minInputToolbarHeight={Platform.OS === 'ios' ? 44 : 56}
          // Empty state — GiftedChat uses an inverted FlatList, so
          // ListEmptyComponent renders upside-down. We rotate the
          // wrapper 180deg to compensate.
          renderChatEmpty={() => (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ rotate: '180deg' }],
              }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? '#141414' : '#f5f5f5',
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: isDark ? '#1e1e1e' : '#eee',
                }}>
                <Feather
                  name="message-circle"
                  size={30}
                  color={isDark ? '#333' : '#ccc'}
                />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: isDark ? '#555' : '#999',
                  marginBottom: 4,
                }}>
                No messages yet
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? '#444' : '#bbb',
                  marginBottom: 16,
                }}>
                Say hello to start the conversation
              </Text>
            </View>
          )}
        />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
