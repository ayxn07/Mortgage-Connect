import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Linking,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { db } from '@/src/services/firebase';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { fetchChatMedia } from '@/src/services/chat';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import { getInitials, formatRelativeTime } from '@/src/utils/formatters';
import type { User } from '@/src/types/user';
import type { Agent } from '@/src/types/agent';
import type { Message } from '@/src/types/chat';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEDIA_ITEM_SIZE = (SCREEN_WIDTH - 48 - 8) / 3; // 3 columns, 16px padding each side + gaps

// ─── Media Tab Type ──────────────────────────────────────────────────────────

type MediaTab = 'images' | 'documents';

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ChatProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    chatId: string;
    participantId: string;
    participantName: string;
    participantRole: string;
    participantPhoto: string;
  }>();

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {
    getAccentColor,
    getButtonBg,
    getButtonText,
    getCardBg,
    getCardBorder,
    getPrimaryText,
    getSecondaryText,
    getMutedText,
  } = useThemeColors();

  const accentColor = getAccentColor();

  // State
  const [userProfile, setUserProfile] = useState<User | Agent | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [mediaMessages, setMediaMessages] = useState<Message[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [activeMediaTab, setActiveMediaTab] = useState<MediaTab>('images');

  const chatId = params.chatId;
  const participantId = params.participantId;
  const participantName = params.participantName || 'User';
  const participantRole = params.participantRole || 'user';
  const participantPhoto = params.participantPhoto;

  // Fetch full user profile from Firestore
  useEffect(() => {
    if (!participantId) return;

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const userSnap = await getDoc(doc(db, 'users', participantId));
        if (userSnap.exists()) {
          setUserProfile(userSnap.data() as User | Agent);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[ChatProfile] Error loading profile:', message);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [participantId]);

  // Fetch shared media
  useEffect(() => {
    if (!chatId) return;

    const loadMedia = async () => {
      setLoadingMedia(true);
      try {
        const media = await fetchChatMedia(chatId);
        setMediaMessages(media);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[ChatProfile] Error loading media:', message);
      } finally {
        setLoadingMedia(false);
      }
    };

    loadMedia();
  }, [chatId]);

  // Split media into images and documents
  const imageMessages = useMemo(
    () => mediaMessages.filter((m) => m.type === 'image'),
    [mediaMessages]
  );
  const documentMessages = useMemo(
    () => mediaMessages.filter((m) => m.type === 'document'),
    [mediaMessages]
  );

  const activeMedia = activeMediaTab === 'images' ? imageMessages : documentMessages;

  // Member since date
  const memberSince = useMemo(() => {
    if (!userProfile?.createdAt?.toDate) return null;
    const date = userProfile.createdAt.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [userProfile]);

  // Agent-specific data
  const isAgent = participantRole === 'agent' && userProfile;
  const agentData = isAgent ? (userProfile as Agent) : null;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleEmail = () => {
    if (userProfile?.email) {
      Linking.openURL(`mailto:${userProfile.email}`);
    }
  };

  const handleCall = () => {
    if (userProfile?.phone) {
      Linking.openURL(`tel:${userProfile.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (agentData?.whatsapp) {
      const url = `https://wa.me/${agentData.whatsapp.replace(/[^0-9]/g, '')}`;
      Linking.openURL(url);
    }
  };

  const handleOpenDocument = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open file'));
  };

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (loadingProfile) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDark ? '#000' : '#f9f9f9' }}
        edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#1e1e1e' : '#f0f0f0',
          }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
            }}
            activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text
            style={{
              marginLeft: 12,
              fontSize: 16,
              fontWeight: '700',
              color: getPrimaryText(),
            }}>
            Profile
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={{ marginTop: 12, fontSize: 13, color: getMutedText() }}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000' : '#f9f9f9' }} edges={['top']}>
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
            padding: 8,
            borderRadius: 20,
            backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
          }}
          activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text
          style={{
            marginLeft: 12,
            fontSize: 16,
            fontWeight: '700',
            color: getPrimaryText(),
          }}>
          Contact Info
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Card */}
        <View
          style={{
            alignItems: 'center',
            paddingTop: 32,
            paddingBottom: 24,
            paddingHorizontal: 16,
            backgroundColor: isDark ? '#000' : '#fff',
          }}>
          {/* Avatar */}
          {participantPhoto && participantPhoto !== 'null' ? (
            <Image
              source={{ uri: participantPhoto }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 3,
                borderColor: `${accentColor}30`,
              }}
            />
          ) : (
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${accentColor}15`,
                borderWidth: 3,
                borderColor: `${accentColor}30`,
              }}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '700',
                  color: accentColor,
                }}>
                {getInitials(participantName)}
              </Text>
            </View>
          )}

          {/* Name */}
          <Text
            style={{
              marginTop: 16,
              fontSize: 22,
              fontWeight: '800',
              color: getPrimaryText(),
            }}>
            {userProfile?.displayName || participantName}
          </Text>

          {/* Role Badge */}
          <View
            style={{
              marginTop: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
            {participantRole === 'agent' && (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff',
                }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.5,
                    color: isDark ? '#60a5fa' : '#2563eb',
                  }}>
                  MORTGAGE AGENT
                </Text>
              </View>
            )}
            {participantRole === 'admin' && (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : '#fffbeb',
                }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.5,
                    color: isDark ? '#fbbf24' : '#d97706',
                  }}>
                  ADMIN
                </Text>
              </View>
            )}
            {participantRole === 'user' && (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: isDark ? 'rgba(34,197,94,0.12)' : '#f0fdf4',
                }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.5,
                    color: isDark ? '#4ade80' : '#16a34a',
                  }}>
                  CLIENT
                </Text>
              </View>
            )}
          </View>

          {/* Agent Rating */}
          {agentData && agentData.avgRating > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 12,
                gap: 4,
              }}>
              <Feather name="star" size={16} color="#f59e0b" />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: getPrimaryText(),
                }}>
                {agentData.avgRating.toFixed(1)}
              </Text>
              <Text style={{ fontSize: 13, color: getSecondaryText() }}>
                ({agentData.reviewCount || 0} reviews)
              </Text>
            </View>
          )}
        </View>

        {/* Agent Quick Stats */}
        {agentData && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 8,
              borderRadius: 20,
              padding: 16,
              backgroundColor: getCardBg(),
              borderWidth: 1,
              borderColor: getCardBorder(),
            }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: getPrimaryText() }}>
                  {agentData.completedProjects || 0}
                </Text>
                <Text style={{ fontSize: 11, marginTop: 2, color: getSecondaryText() }}>
                  Projects
                </Text>
              </View>
              <View
                style={{
                  width: 1,
                  backgroundColor: isDark ? '#252525' : '#f0f0f0',
                }}
              />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: getPrimaryText() }}>
                  {agentData.experience || 0}
                </Text>
                <Text style={{ fontSize: 11, marginTop: 2, color: getSecondaryText() }}>
                  Years Exp
                </Text>
              </View>
              <View
                style={{
                  width: 1,
                  backgroundColor: isDark ? '#252525' : '#f0f0f0',
                }}
              />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: getPrimaryText() }}>
                  {agentData.responseTime || 'N/A'}
                </Text>
                <Text style={{ fontSize: 11, marginTop: 2, color: getSecondaryText() }}>
                  Response
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Agent Specialties */}
        {agentData?.specialty && agentData.specialty.length > 0 && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              borderRadius: 20,
              padding: 16,
              backgroundColor: getCardBg(),
              borderWidth: 1,
              borderColor: getCardBorder(),
            }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: getPrimaryText(),
                marginBottom: 12,
              }}>
              Specialties
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {agentData.specialty.map((s) => (
                <View
                  key={s}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: `${accentColor}12`,
                    borderWidth: 1,
                    borderColor: `${accentColor}20`,
                  }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: accentColor,
                    }}>
                    {s}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* About (Agent) */}
        {agentData?.bio && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              borderRadius: 20,
              padding: 16,
              backgroundColor: getCardBg(),
              borderWidth: 1,
              borderColor: getCardBorder(),
            }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: getPrimaryText(),
                marginBottom: 8,
              }}>
              About
            </Text>
            <Text
              style={{
                fontSize: 13,
                lineHeight: 20,
                color: getSecondaryText(),
              }}>
              {agentData.bio}
            </Text>
            {agentData.languages && agentData.languages.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 12,
                }}>
                <Feather name="globe" size={14} color={getSecondaryText()} />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: getSecondaryText(),
                  }}>
                  Speaks: {agentData.languages.join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Contact Info */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            borderRadius: 20,
            padding: 16,
            backgroundColor: getCardBg(),
            borderWidth: 1,
            borderColor: getCardBorder(),
          }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: getPrimaryText(),
              marginBottom: 12,
            }}>
            Contact Information
          </Text>

          {/* Email */}
          {userProfile?.email && (
            <TouchableOpacity
              onPress={handleEmail}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? '#1e1e1e' : '#f5f5f5',
              }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: `${accentColor}12`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Feather name="mail" size={18} color={accentColor} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 11, color: getSecondaryText() }}>Email</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: getPrimaryText() }}>
                  {userProfile.email}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={getMutedText()} />
            </TouchableOpacity>
          )}

          {/* Phone */}
          {userProfile?.phone && (
            <TouchableOpacity
              onPress={handleCall}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: agentData?.whatsapp ? 1 : 0,
                borderBottomColor: isDark ? '#1e1e1e' : '#f5f5f5',
              }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: `${accentColor}12`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Feather name="phone" size={18} color={accentColor} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 11, color: getSecondaryText() }}>Phone</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: getPrimaryText() }}>
                  {userProfile.phone}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={getMutedText()} />
            </TouchableOpacity>
          )}

          {/* WhatsApp (Agent only) */}
          {agentData?.whatsapp && (
            <TouchableOpacity
              onPress={handleWhatsApp}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
              }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(34,197,94,0.12)' : '#f0fdf4',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Feather name="message-circle" size={18} color="#22c55e" />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 11, color: getSecondaryText() }}>WhatsApp</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: getPrimaryText() }}>
                  {agentData.whatsapp}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={getMutedText()} />
            </TouchableOpacity>
          )}

          {/* Member Since */}
          {memberSince && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: isDark ? '#1e1e1e' : '#f5f5f5',
              }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: `${accentColor}12`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Feather name="calendar" size={18} color={accentColor} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 11, color: getSecondaryText() }}>Member Since</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: getPrimaryText() }}>
                  {memberSince}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Agent Services */}
        {agentData?.services && agentData.services.length > 0 && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              borderRadius: 20,
              padding: 16,
              backgroundColor: getCardBg(),
              borderWidth: 1,
              borderColor: getCardBorder(),
            }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: getPrimaryText(),
                marginBottom: 12,
              }}>
              Services
            </Text>
            {agentData.services.map((service, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  borderBottomWidth: index < agentData.services.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? '#1e1e1e' : '#f5f5f5',
                }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: getPrimaryText() }}>
                    {service.name}
                  </Text>
                  <Text style={{ fontSize: 11, marginTop: 2, color: getSecondaryText() }}>
                    {service.duration}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: service.price === 0 ? '#22c55e' : getPrimaryText(),
                  }}>
                  {service.price === 0 ? 'Free' : `AED ${service.price.toLocaleString()}`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Shared Media Section */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 20,
          }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: getPrimaryText(),
              marginBottom: 12,
            }}>
            Shared Media & Files
          </Text>

          {/* Media Tabs */}
          <View
            style={{
              flexDirection: 'row',
              borderRadius: 14,
              padding: 4,
              backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
              marginBottom: 12,
            }}>
            <TouchableOpacity
              onPress={() => setActiveMediaTab('images')}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor:
                  activeMediaTab === 'images'
                    ? accentColor
                    : 'transparent',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather
                  name="image"
                  size={14}
                  color={
                    activeMediaTab === 'images'
                      ? getButtonText()
                      : getSecondaryText()
                  }
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color:
                      activeMediaTab === 'images'
                        ? getButtonText()
                        : getSecondaryText(),
                  }}>
                  Photos ({imageMessages.length})
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveMediaTab('documents')}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor:
                  activeMediaTab === 'documents'
                    ? accentColor
                    : 'transparent',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather
                  name="file-text"
                  size={14}
                  color={
                    activeMediaTab === 'documents'
                      ? getButtonText()
                      : getSecondaryText()
                  }
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color:
                      activeMediaTab === 'documents'
                        ? getButtonText()
                        : getSecondaryText(),
                  }}>
                  Files ({documentMessages.length})
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Media Content */}
          {loadingMedia ? (
            <View
              style={{
                paddingVertical: 40,
                alignItems: 'center',
                borderRadius: 20,
                backgroundColor: getCardBg(),
                borderWidth: 1,
                borderColor: getCardBorder(),
              }}>
              <ActivityIndicator color={accentColor} />
              <Text style={{ marginTop: 8, fontSize: 12, color: getMutedText() }}>
                Loading media...
              </Text>
            </View>
          ) : activeMedia.length === 0 ? (
            <View
              style={{
                paddingVertical: 40,
                alignItems: 'center',
                borderRadius: 20,
                backgroundColor: getCardBg(),
                borderWidth: 1,
                borderColor: getCardBorder(),
              }}>
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
                <Feather
                  name={activeMediaTab === 'images' ? 'image' : 'file-text'}
                  size={24}
                  color={getMutedText()}
                />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: getSecondaryText() }}>
                {activeMediaTab === 'images' ? 'No shared photos' : 'No shared files'}
              </Text>
              <Text style={{ fontSize: 12, marginTop: 4, color: getMutedText() }}>
                {activeMediaTab === 'images'
                  ? 'Photos shared in this chat will appear here'
                  : 'Files shared in this chat will appear here'}
              </Text>
            </View>
          ) : activeMediaTab === 'images' ? (
            /* Image Grid */
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 4,
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: getCardBg(),
                borderWidth: 1,
                borderColor: getCardBorder(),
                padding: 4,
              }}>
              {imageMessages.map((msg) => (
                <TouchableOpacity
                  key={msg.messageId}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (msg.content?.mediaUrl) {
                      // Could open image preview here
                    }
                  }}
                  style={{
                    width: MEDIA_ITEM_SIZE,
                    height: MEDIA_ITEM_SIZE,
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}>
                  <Image
                    source={{ uri: msg.content?.mediaUrl }}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            /* Document List */
            <View
              style={{
                borderRadius: 20,
                backgroundColor: getCardBg(),
                borderWidth: 1,
                borderColor: getCardBorder(),
                overflow: 'hidden',
              }}>
              {documentMessages.map((msg, index) => {
                const fileSizeStr = msg.content?.fileSize
                  ? msg.content.fileSize > 1024 * 1024
                    ? `${(msg.content.fileSize / (1024 * 1024)).toFixed(1)} MB`
                    : `${(msg.content.fileSize / 1024).toFixed(1)} KB`
                  : '';
                const date = msg.timestamp?.toDate?.()
                  ? formatRelativeTime(msg.timestamp.toDate())
                  : '';

                return (
                  <TouchableOpacity
                    key={msg.messageId}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (msg.content?.mediaUrl) {
                        handleOpenDocument(msg.content.mediaUrl);
                      }
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 14,
                      borderBottomWidth: index < documentMessages.length - 1 ? 1 : 0,
                      borderBottomColor: isDark ? '#1e1e1e' : '#f5f5f5',
                    }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: `${accentColor}12`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Feather name="file-text" size={20} color={accentColor} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: getPrimaryText(),
                        }}>
                        {msg.content?.fileName || 'File'}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          marginTop: 2,
                        }}>
                        {fileSizeStr ? (
                          <Text style={{ fontSize: 11, color: getSecondaryText() }}>
                            {fileSizeStr}
                          </Text>
                        ) : null}
                        {date ? (
                          <Text style={{ fontSize: 11, color: getMutedText() }}>{date}</Text>
                        ) : null}
                      </View>
                    </View>
                    <Feather name="download" size={18} color={getMutedText()} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
