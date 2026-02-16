import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  Dimensions,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  GiftedChat,
  Bubble,
  InputToolbar,
  Composer,
  Send,
  Day,
  Time,
} from 'react-native-gifted-chat';
import type {
  IMessage,
  BubbleProps,
  SendProps,
  DayProps,
  TimeProps,
} from 'react-native-gifted-chat';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import { Paths, File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useConversation } from '@/src/hooks/useChat';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import { ArrowLeft } from '@/components/Icons';
import { getInitials, formatRelativeTime } from '@/src/utils/formatters';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Custom Attachment Picker ─────────────────────────────────────────────────

function AttachmentPicker({
  visible,
  onClose,
  onCamera,
  onGallery,
  onDocument,
  isDark,
  accentColor,
}: {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
  onDocument: () => void;
  isDark: boolean;
  accentColor: string;
}) {
  const options = [
    { icon: 'camera', label: 'Take Photo', onPress: onCamera },
    { icon: 'image', label: 'Photo Library', onPress: onGallery },
    { icon: 'file-text', label: 'Send File', onPress: onDocument },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
                  backgroundColor: `${accentColor}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                <Feather name={option.icon as any} size={22} color={accentColor} />
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
              <Feather name="chevron-right" size={20} color={isDark ? '#555' : '#aaa'} />
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

function CustomBubble(
  props: BubbleProps<IMessage> & {
    extraData: {
      isDark: boolean;
      accentColor: string;
      accentTextColor: string;
      onLongPress?: (event: any, message: IMessage) => void;
    };
  }
) {
  const isDark = props.extraData?.isDark ?? false;
  const accentColor = props.extraData?.accentColor ?? (isDark ? '#fff' : '#000');
  const accentTextColor = props.extraData?.accentTextColor ?? (isDark ? '#000' : '#fff');
  const currentMessage = props.currentMessage as any;
  const onLongPress = props.extraData?.onLongPress;

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
            Linking.openURL(doc.url).catch(() => Alert.alert('Error', 'Could not open file'));
          }
        }}
        onLongPress={(event) => {
          if (onLongPress && currentMessage) {
            onLongPress(event, currentMessage);
          }
        }}
        delayLongPress={500}
        style={{
          backgroundColor: isMe ? accentColor : isDark ? '#1a1a1a' : '#fff',
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
                ? accentTextColor === '#fff'
                  ? 'rgba(255,255,255,0.15)'
                  : 'rgba(0,0,0,0.15)'
                : isDark
                  ? '#252525'
                  : '#f5f5f5',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}>
            <Feather
              name="file-text"
              size={18}
              color={isMe ? accentTextColor : isDark ? '#888' : '#666'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isMe ? accentTextColor : isDark ? '#e5e5e5' : '#1a1a1a',
              }}>
              {doc.fileName}
            </Text>
            {fileSizeStr ? (
              <Text
                style={{
                  fontSize: 11,
                  marginTop: 2,
                  color: isMe
                    ? accentTextColor === '#fff'
                      ? 'rgba(255,255,255,0.5)'
                      : 'rgba(0,0,0,0.5)'
                    : isDark
                      ? '#666'
                      : '#999',
                }}>
                {fileSizeStr}
              </Text>
            ) : null}
          </View>
          <Feather
            name="download"
            size={16}
            color={
              isMe
                ? accentTextColor === '#fff'
                  ? 'rgba(255,255,255,0.5)'
                  : 'rgba(0,0,0,0.5)'
                : isDark
                  ? '#555'
                  : '#999'
            }
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
          backgroundColor: accentColor,
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
          color: accentTextColor,
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

function CustomTime(
  props: TimeProps<IMessage> & {
    extraData: { isDark: boolean; accentColor: string; accentTextColor: string };
  }
) {
  const isDark = props.extraData?.isDark ?? false;
  const accentColor = props.extraData?.accentColor ?? (isDark ? '#fff' : '#000');
  const accentTextColor = props.extraData?.accentTextColor ?? (isDark ? '#000' : '#fff');
  const currentMessage = props.currentMessage as any;
  const isMe = props.position === 'right';

  // Determine the status icon to show
  const getStatusIcon = () => {
    if (!isMe) return null;

    // Read by other person - blue check-circle (or white for colored themes)
    if (currentMessage?.readByOther) {
      // Use blue for default/black/white themes, white for colored themes
      const isDefaultTheme =
        accentColor === '#1a1a1a' ||
        accentColor === '#ebebeb' ||
        accentColor === '#000' ||
        accentColor === '#fff';
      const readColor = isDefaultTheme ? '#3b82f6' : '#fff';

      return <Feather name="check-circle" size={12} color={readColor} style={{ marginLeft: 3 }} />;
    }

    // Sent but not read - single gray check
    if (currentMessage?.sent) {
      return (
        <Feather
          name="check"
          size={11}
          color={accentTextColor === '#fff' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
          style={{ marginLeft: 3 }}
        />
      );
    }

    // Sending - clock icon
    return (
      <Feather
        name="clock"
        size={10}
        color={accentTextColor === '#fff' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
        style={{ marginLeft: 3 }}
      />
    );
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        marginBottom: 2,
        paddingHorizontal: 4,
      }}>
      {currentMessage?.edited && (
        <Text
          style={{
            fontSize: 10,
            fontStyle: 'italic',
            color: isMe
              ? accentTextColor === '#fff'
                ? 'rgba(255,255,255,0.4)'
                : 'rgba(0,0,0,0.4)'
              : isDark
                ? '#555'
                : '#bbb',
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
            color: accentTextColor === '#fff' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
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

function CustomSend(
  props: SendProps<IMessage> & {
    extraData: { isDark: boolean; accentColor: string; accentTextColor: string };
  }
) {
  const isDark = props.extraData?.isDark ?? false;
  const accentColor = props.extraData?.accentColor ?? (isDark ? '#fff' : '#000');
  const accentTextColor = props.extraData?.accentTextColor ?? (isDark ? '#000' : '#fff');
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
          backgroundColor: hasText ? accentColor : isDark ? '#1a1a1a' : '#e5e5e5',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Feather
          name="send"
          size={16}
          color={hasText ? accentTextColor : isDark ? '#555' : '#aaa'}
          style={{ marginLeft: 1 }}
        />
      </View>
    </Send>
  );
}

// ─── Message Context Menu ─────────────────────────────────────────────────────

function MessageContextMenu({
  visible,
  x,
  y,
  onDelete,
  onClose,
  isDark,
}: {
  visible: boolean;
  x: number;
  y: number;
  onDelete: () => void;
  onClose: () => void;
  isDark: boolean;
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}
        onPress={onClose}>
        <View
          style={{
            position: 'absolute',
            top: y,
            left: x,
            minWidth: 140,
            backgroundColor: isDark ? '#1a1a1a' : '#fff',
            borderRadius: 12,
            paddingVertical: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              setTimeout(onDelete, 100);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}>
            <Feather name="trash-2" size={18} color="#ef4444" />
            <Text
              style={{
                fontSize: 15,
                fontWeight: '500',
                color: '#ef4444',
                marginLeft: 12,
              }}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Image Context Menu ───────────────────────────────────────────────────────

function ImageContextMenu({
  visible,
  x,
  y,
  onSave,
  onView,
  onClose,
  isDark,
}: {
  visible: boolean;
  x: number;
  y: number;
  onSave: () => void;
  onView: () => void;
  onClose: () => void;
  isDark: boolean;
}) {
  if (!visible) return null;

  const menuOptions = [
    { icon: 'eye', label: 'View', onPress: onView },
    { icon: 'download', label: 'Save', onPress: onSave },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}
        onPress={onClose}>
        <View
          style={{
            position: 'absolute',
            top: y,
            left: x,
            minWidth: 140,
            backgroundColor: isDark ? '#1a1a1a' : '#fff',
            borderRadius: 12,
            paddingVertical: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={option.label}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                setTimeout(option.onPress, 100);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: index < menuOptions.length - 1 ? 1 : 0,
                borderBottomColor: isDark ? '#252525' : '#f0f0f0',
              }}>
              <Feather name={option.icon as any} size={18} color={isDark ? '#e5e5e5' : '#1a1a1a'} />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: isDark ? '#e5e5e5' : '#1a1a1a',
                  marginLeft: 12,
                }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Image Preview Modal ──────────────────────────────────────────────────────

function ImagePreviewModal({
  visible,
  imageUri,
  onClose,
  onSave,
}: {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onSave: () => void;
  isDark: boolean;
}) {
  if (!imageUri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.95)',
        }}>
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSave}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}>
              <Feather name="download" size={18} color="#fff" />
              <Text
                style={{
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: '600',
                  marginLeft: 8,
                }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Image */}
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Image
            source={{ uri: imageUri }}
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT * 0.7,
            }}
            resizeMode="contain"
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Custom Message Image ─────────────────────────────────────────────────────

function CustomMessageImage(props: any) {
  const [showPreview, setShowPreview] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const isDark = props.extraData?.isDark ?? false;

  const handleSaveImage = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to save images.'
        );
        return;
      }

      const imageUri = props.currentMessage.image;
      const timestamp = Date.now();
      const file = new File(Paths.cache, `image_${timestamp}.jpg`);

      // Download image to cache
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await file.write(uint8Array);

      // Save to media library
      await MediaLibrary.createAssetAsync(file.uri);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Image saved to gallery');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save image';
      console.error('[Chat] Save image error:', message);
      Alert.alert('Error', message);
    }
  };

  const handleLongPress = (event: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Get touch position
    const { pageX, pageY } = event.nativeEvent;

    // Calculate menu position (offset to appear next to the image)
    const menuX = Math.min(pageX + 10, SCREEN_WIDTH - 160);
    const menuY = Math.max(pageY - 50, 100);

    setMenuPosition({ x: menuX, y: menuY });
    setShowMenu(true);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setShowPreview(true)}
        onLongPress={handleLongPress}
        delayLongPress={500}>
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
      </TouchableOpacity>

      <ImageContextMenu
        visible={showMenu}
        x={menuPosition.x}
        y={menuPosition.y}
        onSave={handleSaveImage}
        onView={() => setShowPreview(true)}
        onClose={() => setShowMenu(false)}
        isDark={isDark}
      />

      <ImagePreviewModal
        visible={showPreview}
        imageUri={props.currentMessage.image}
        onClose={() => setShowPreview(false)}
        onSave={handleSaveImage}
        isDark={isDark}
      />
    </>
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

// ─── Search Results Overlay ───────────────────────────────────────────────────

interface SearchResult {
  id: string;
  text: string;
  senderName: string;
  timestamp: Date;
  isMe: boolean;
}

function SearchResultsOverlay({
  visible,
  query,
  results,
  isDark,
  accentColor,
  onClose,
}: {
  visible: boolean;
  query: string;
  results: SearchResult[];
  isDark: boolean;
  accentColor: string;
  onClose: () => void;
}) {
  if (!visible || !query.trim()) return null;

  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return <Text>{text}</Text>;
    const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <Text>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <Text key={i} style={{ backgroundColor: `${accentColor}40`, fontWeight: '700' }}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isDark ? '#000' : '#f9f9f9',
        zIndex: 50,
      }}>
      {results.length === 0 ? (
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
            <Feather name="search" size={24} color={isDark ? '#444' : '#ccc'} />
          </View>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: isDark ? '#555' : '#999',
            }}>
            No messages found
          </Text>
          <Text
            style={{
              fontSize: 13,
              marginTop: 4,
              color: isDark ? '#444' : '#bbb',
            }}>
            Try a different search term
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? '#1a1a1a' : '#f0f0f0',
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: item.isMe ? accentColor : (isDark ? '#e5e5e5' : '#1a1a1a'),
                  }}>
                  {item.isMe ? 'You' : item.senderName}
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? '#555' : '#aaa' }}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  color: isDark ? '#aaa' : '#555',
                }}>
                {highlightMatch(item.text, query)}
              </Text>
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            <Text
              style={{
                paddingHorizontal: 16,
                paddingBottom: 8,
                fontSize: 12,
                fontWeight: '600',
                color: isDark ? '#555' : '#aaa',
              }}>
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </Text>
          }
        />
      )}
    </View>
  );
}

// ─── Main Conversation Screen ─────────────────────────────────────────────────

export default function ChatConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ chatId: string }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { getAccentColor, getButtonBg, getButtonText } = useThemeColors();

  const chatId = params.chatId;

  const {
    messages,
    otherParticipant,
    otherPresence,
    isOtherTyping,
    loadingMessages,
    hasMoreMessages,
    userId,
    sendMessage,
    sendImage,
    sendDocument,
    loadMore,
    deleteMessage,
  } = useConversation(chatId);

  const [isUploading, setIsUploading] = useState(false);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedMessage, setSelectedMessage] = useState<IMessage | null>(null);

  // Search state
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

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
  const bottomPadding = isKeyboardVisible ? Math.max(insets.bottom * 0.4, 8) : insets.bottom;

  // Online status text
  const statusText = useMemo(() => {
    if (isOtherTyping) return 'typing...';
    if (otherPresence?.isOnline) return 'Online';
    if (otherPresence?.lastSeen?.toDate) {
      return `Last seen ${formatRelativeTime(otherPresence.lastSeen.toDate())}`;
    }
    return '';
  }, [isOtherTyping, otherPresence?.isOnline, otherPresence?.lastSeen]);

  // Search results
  const searchResults: SearchResult[] = useMemo(() => {
    if (!searchQuery.trim() || !userId) return [];

    const q = searchQuery.toLowerCase();
    return messages
      .filter((msg) => {
        const text = msg.text?.toLowerCase() || '';
        return text.includes(q) && !(msg as any).deleted;
      })
      .map((msg) => ({
        id: msg._id as string,
        text: msg.text || '',
        senderName: msg.user?.name || 'Unknown',
        timestamp: msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt),
        isMe: msg.user?._id === userId,
      }));
  }, [searchQuery, messages, userId]);

  // Navigate to profile
  const handleOpenProfile = useCallback(() => {
    if (!otherParticipant || !chatId) return;
    router.push({
      pathname: '/chat/chat-profile',
      params: {
        chatId,
        participantId: otherParticipant.uid,
        participantName: otherParticipant.displayName,
        participantRole: otherParticipant.role,
        participantPhoto: otherParticipant.photoURL || '',
      },
    });
  }, [otherParticipant, chatId, router]);

  // Toggle search
  const handleToggleSearch = useCallback(() => {
    setIsSearchActive((prev) => {
      if (!prev) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      } else {
        setSearchQuery('');
      }
      return !prev;
    });
  }, []);

  const handleCloseSearch = useCallback(() => {
    setIsSearchActive(false);
    setSearchQuery('');
  }, []);

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

  // Handle long press on message
  const handleLongPress = useCallback(
    (event: any, currentMessage?: IMessage) => {
      console.log('[Chat] handleLongPress called', { hasMessage: !!currentMessage, userId });
      if (!currentMessage || !userId) return;
      const msg = currentMessage as IMessage & { deleted?: boolean };
      const isMyMessage = msg.user._id === userId;
      const isDeleted = msg.deleted;

      console.log('[Chat] Message check', { isMyMessage, isDeleted, messageId: msg._id });

      // Only show menu for own messages that aren't deleted
      if (!isMyMessage || isDeleted) {
        console.log('[Chat] Skipping menu - not my message or deleted');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Get touch position from the event
      const { pageX, pageY } = event?.nativeEvent || { pageX: SCREEN_WIDTH / 2, pageY: 200 };

      console.log('[Chat] Showing menu at', { pageX, pageY });

      // Calculate menu position (offset to appear next to the message)
      const menuX = Math.min(pageX + 10, SCREEN_WIDTH - 160);
      const menuY = Math.max(pageY - 50, 100);

      setMenuPosition({ x: menuX, y: menuY });
      setSelectedMessage(msg);
      setShowMessageMenu(true);
    },
    [userId]
  );

  const handleDeleteMessage = useCallback(() => {
    if (!selectedMessage) return;
    setShowMessageMenu(false);

    Alert.alert('Delete Message', 'This message will be deleted for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          deleteMessage(selectedMessage._id as string);
          setSelectedMessage(null);
        },
      },
    ]);
  }, [selectedMessage, deleteMessage]);

  // Pick image from gallery
  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to send images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const fileName = asset.fileName || `photo_${Date.now()}.jpg`;

      setIsUploading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendImage(asset.uri, fileName);
    } catch (err: any) {
      console.error('[Chat] Image picker error:', err);
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
        allowsEditing: false,
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const fileName = asset.fileName || `camera_${Date.now()}.jpg`;

      setIsUploading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendImage(asset.uri, fileName);
    } catch (err: any) {
      console.error('[Chat] Camera error:', err);
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
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? '#000' : '#f9f9f9',
        }}
        edges={['top']}>
        <Text style={{ color: isDark ? '#555' : '#aaa' }}>No chat selected</Text>
      </SafeAreaView>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }} edges={['top']}>
      {/* Attachment Picker Modal */}
      <AttachmentPicker
        visible={showAttachmentPicker}
        onClose={() => setShowAttachmentPicker(false)}
        onCamera={handleTakePhoto}
        onGallery={handlePickImage}
        onDocument={handlePickDocument}
        isDark={isDark}
        accentColor={getAccentColor()}
      />

      {/* Message Context Menu */}
      <MessageContextMenu
        visible={showMessageMenu}
        x={menuPosition.x}
        y={menuPosition.y}
        onDelete={handleDeleteMessage}
        onClose={() => {
          setShowMessageMenu(false);
          setSelectedMessage(null);
        }}
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
        {isSearchActive ? (
          /* ── Search Bar Mode ── */
          <>
            <TouchableOpacity
              onPress={handleCloseSearch}
              style={{
                marginRight: 12,
                padding: 8,
                borderRadius: 20,
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
              }}
              activeOpacity={0.7}>
              <ArrowLeft color={isDark ? '#fff' : '#000'} size={20} />
            </TouchableOpacity>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                borderRadius: 22,
                paddingHorizontal: 14,
                height: 40,
                borderWidth: 1,
                borderColor: isDark ? '#252525' : '#eee',
              }}>
              <Feather
                name="search"
                size={16}
                color={isDark ? '#666' : '#aaa'}
                style={{ marginRight: 8 }}
              />
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search messages..."
                placeholderTextColor={isDark ? '#555' : '#aaa'}
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: isDark ? '#fff' : '#1a1a1a',
                  paddingVertical: 0,
                }}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                  <Feather name="x" size={16} color={isDark ? '#666' : '#aaa'} />
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          /* ── Normal Header Mode ── */
          <>
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

            {/* Tappable Avatar + Name */}
            <TouchableOpacity
              onPress={handleOpenProfile}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {/* Avatar */}
              <View style={{ position: 'relative' }}>
                {otherParticipant?.photoURL ? (
                  <Image
                    source={{ uri: otherParticipant.photoURL }}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                    }}
                  />
                ) : (
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
                      {otherParticipant ? getInitials(otherParticipant.displayName) : '?'}
                    </Text>
                  </View>
                )}
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
                          : isDark
                            ? '#555'
                            : '#aaa',
                      fontWeight: isOtherTyping || otherPresence?.isOnline ? '600' : '400',
                    }}>
                    {statusText}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>

            {/* Search Icon */}
            <TouchableOpacity
              onPress={handleToggleSearch}
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
              }}
              activeOpacity={0.7}>
              <Feather name="search" size={18} color={isDark ? '#aaa' : '#666'} />
            </TouchableOpacity>

            {/* Role badge */}
            {otherParticipant?.role === 'agent' && (
              <View
                style={{
                  marginLeft: 8,
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
                  marginLeft: 8,
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
          </>
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
            renderBubble={(props) => (
              <CustomBubble
                {...props}
                extraData={{
                  isDark,
                  accentColor: getButtonBg(),
                  accentTextColor: getButtonText(),
                  onLongPress: handleLongPress,
                }}
              />
            )}
            renderDay={(props) => <CustomDay {...props} extraData={{ isDark }} />}
            renderTime={(props) => (
              <CustomTime
                {...props}
                extraData={{
                  isDark,
                  accentColor: getAccentColor(),
                  accentTextColor: getButtonText(),
                }}
              />
            )}
            renderMessageImage={(props) => <CustomMessageImage {...props} extraData={{ isDark }} />}
            renderMessageText={(props) => (
              <TouchableOpacity
                activeOpacity={1}
                onLongPress={(event) => {
                  console.log('[Chat] Message text long press');
                  if (props.currentMessage) {
                    handleLongPress(event, props.currentMessage);
                  }
                }}
                delayLongPress={500}>
                <Text
                  style={{
                    color: props.position === 'right' ? getButtonText() : (isDark ? '#e5e5e5' : '#1a1a1a'),
                    fontSize: 15,
                    lineHeight: 21,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}>
                  {props.currentMessage?.text}
                </Text>
              </TouchableOpacity>
            )}
            renderSend={(props) => (
              <CustomSend
                {...props}
                extraData={{ isDark, accentColor: getButtonBg(), accentTextColor: getButtonText() }}
              />
            )}
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
                  paddingBottom: bottomPadding || 6,
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
                    backgroundColor: `${getAccentColor()}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: `${getAccentColor()}30`,
                  }}>
                  <Feather name="plus" size={20} color={getAccentColor()} />
                </View>
              </TouchableOpacity>
            )}
            // Footer - typing indicator
            renderChatFooter={() =>
              isOtherTyping ? (
                <TypingFooter isDark={isDark} name={otherParticipant?.displayName || 'User'} />
              ) : null
            }
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
                  <Feather name="message-circle" size={30} color={isDark ? '#333' : '#ccc'} />
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
        {/* Search Results Overlay */}
        <SearchResultsOverlay
          visible={isSearchActive && searchQuery.trim().length > 0}
          query={searchQuery}
          results={searchResults}
          isDark={isDark}
          accentColor={getAccentColor()}
          onClose={handleCloseSearch}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
