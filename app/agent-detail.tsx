import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Star,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Heart,
  Share,
  CheckCircle,
  Award,
  Users,
  Globe,
  MessageCircle,
  Send,
} from '@/components/Icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAgentStore } from '@/src/store/agentStore';
import { useFavorites } from '@/src/hooks/useFavorites';
import { useAuthStore } from '@/src/store/authStore';
import { useChatStore } from '@/src/store/chatStore';
import { fetchAgentReviews, createReview } from '@/src/services/reviews';
import type { Agent, Review } from '@/src/types';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 300;

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// Star Rating Input Component
function StarRatingInput({
  rating,
  onRate,
  size = 28,
}: {
  rating: number;
  onRate: (r: number) => void;
  size?: number;
}) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onRate(star)} activeOpacity={0.7}>
          <Star
            color={star <= rating ? '#f59e0b' : '#333'}
            size={size}
            fill={star <= rating ? '#f59e0b' : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Review Card Component
function ReviewCard({ review, isDark }: { review: Review; isDark: boolean }) {
  const timeAgo = review.createdAt?.toDate
    ? getTimeAgo(review.createdAt.toDate())
    : 'Recently';

  return (
    <View
      className={`rounded-2xl p-5 ${
        isDark ? 'bg-[#141414] border border-[#252525]' : 'bg-white border border-gray-100'
      }`}
      style={{ width: width - 80 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDark ? 'bg-[#252525]' : 'bg-gray-100'
            }`}>
            <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-700'}`}>
              {review.userName?.charAt(0) || '?'}
            </Text>
          </View>
          <View className="ml-3 flex-1">
            <Text
              className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
              numberOfLines={1}>
              {review.userName}
            </Text>
            <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {timeAgo}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              color={i < review.rating ? '#f59e0b' : isDark ? '#333' : '#ddd'}
              size={12}
              fill={i < review.rating ? '#f59e0b' : 'transparent'}
            />
          ))}
        </View>
      </View>
      <Text className={`text-sm leading-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        {review.comment}
      </Text>
    </View>
  );
}

// Helper: time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}

export default function AgentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ agentId: string }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const scrollY = useSharedValue(0);

  // Stores
  const { selectedAgent, loading, fetchAgentById } = useAgentStore();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { firebaseUser, userDoc } = useAuthStore();
  const { createOrOpenChat } = useChatStore();

  // Local state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const agent = selectedAgent;

  // Fetch agent data
  useEffect(() => {
    if (params.agentId) {
      fetchAgentById(params.agentId);
      loadReviews(params.agentId);
    }
  }, [params.agentId]);

  const loadReviews = async (agentId: string) => {
    setReviewsLoading(true);
    try {
      const agentReviews = await fetchAgentReviews(agentId);
      setReviews(agentReviews);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!firebaseUser || !agent) return;
    if (reviewRating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    if (!reviewComment.trim()) {
      Alert.alert('Comment Required', 'Please write a comment for your review.');
      return;
    }

    setSubmittingReview(true);
    try {
      const userName = userDoc?.displayName || firebaseUser.displayName || 'Anonymous';
      await createReview(firebaseUser.uid, userName, {
        agentId: agent.uid,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      // Refresh reviews and reset form
      await loadReviews(agent.uid);
      // Re-fetch agent to get updated avgRating
      await fetchAgentById(agent.uid);
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewComment('');
      Alert.alert('Review Submitted', 'Thank you for your feedback!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleWhatsApp = () => {
    if (agent?.whatsapp) {
      const url = `https://wa.me/${agent.whatsapp.replace(/[^0-9]/g, '')}`;
      Linking.openURL(url);
    }
  };

  const handleCall = () => {
    if (agent?.phone) {
      Linking.openURL(`tel:${agent.phone}`);
    }
  };

  const handleEmail = () => {
    if (agent?.email) {
      Linking.openURL(`mailto:${agent.email}`);
    }
  };

  const handleMessageAgent = async () => {
    if (!firebaseUser || !userDoc || !agent) {
      Alert.alert('Sign In Required', 'Please sign in to message this agent.');
      return;
    }

    setStartingChat(true);
    try {
      const chatId = await createOrOpenChat(
        firebaseUser.uid,
        userDoc.displayName,
        userDoc.photoURL || null,
        userDoc.role,
        {
          otherUserId: agent.uid,
          otherUserName: agent.displayName,
          otherUserPhoto: agent.photoURL || null,
          otherUserRole: 'agent',
        }
      );
      router.push(`/chat/${chatId}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start chat');
    } finally {
      setStartingChat(false);
    }
  };

  // Scroll animations
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -HEADER_HEIGHT * 0.4],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [-100, 0, HEADER_HEIGHT],
      [1.2, 1, 0.9],
      Extrapolation.CLAMP
    );
    return { transform: [{ translateY }, { scale }] };
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT * 0.5],
      [0, 0.7],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const headerBarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HEADER_HEIGHT * 0.5, HEADER_HEIGHT * 0.8],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Loading state
  if (loading || !agent) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
        <Text className={`mt-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Loading agent profile...
        </Text>
      </View>
    );
  }

  const isFav = isFavorite(agent.uid);

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Fixed Header Bar (appears on scroll) */}
      <Animated.View
        style={headerBarStyle}
        className={`absolute top-0 left-0 right-0 z-40 ${
          isDark ? 'bg-black/90' : 'bg-white/90'
        }`}>
        <SafeAreaView edges={['top']}>
          <View className="px-6 py-2">
            <Text
              className={`text-base font-bold text-center ${isDark ? 'text-white' : 'text-black'}`}
              numberOfLines={1}>
              {agent.displayName}
            </Text>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Fixed Header with Back Button */}
      <SafeAreaView className="absolute left-0 right-0 top-0 z-50" edges={['top']}>
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className={`h-10 w-10 items-center justify-center rounded-full ${
              isDark ? 'bg-black/60' : 'bg-white/80'
            }`}
            activeOpacity={0.7}>
            <ArrowLeft color={isDark ? '#fff' : '#000'} size={22} />
          </TouchableOpacity>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => toggleFavorite(agent.uid)}
              className={`h-10 w-10 items-center justify-center rounded-full ${
                isDark ? 'bg-black/60' : 'bg-white/80'
              }`}
              activeOpacity={0.7}>
              <Heart
                color={isFav ? '#ef4444' : isDark ? '#fff' : '#000'}
                size={20}
                fill={isFav ? '#ef4444' : 'transparent'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              className={`h-10 w-10 items-center justify-center rounded-full ${
                isDark ? 'bg-black/60' : 'bg-white/80'
              }`}
              activeOpacity={0.7}>
              <Share color={isDark ? '#fff' : '#000'} size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}>

        {/* Parallax Header Image */}
        <View style={{ height: HEADER_HEIGHT, overflow: 'hidden' }}>
          <Animated.View style={[{ height: HEADER_HEIGHT }, headerAnimatedStyle]}>
            <Image
              source={{ uri: agent.photoURL || 'https://via.placeholder.com/900' }}
              style={{ width: '100%', height: HEADER_HEIGHT }}
              resizeMode="cover"
            />
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: isDark ? '#000' : '#000',
                },
                overlayAnimatedStyle,
              ]}
            />
          </Animated.View>
        </View>

        {/* Profile Info Card - Overlapping the header */}
        <View className="mt-[-40px] px-5">
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className={`rounded-3xl p-5 ${
              isDark
                ? 'bg-[#141414] border border-[#252525]'
                : 'bg-white border border-gray-100'
            }`}>
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 pr-3">
                <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {agent.displayName}
                </Text>
                <View className="flex-row items-center mt-1.5">
                  <MapPin color={isDark ? '#666' : '#999'} size={14} />
                  <Text className={`ml-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {agent.location}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <View className="flex-row items-center">
                  <Star color="#f59e0b" size={18} fill="#f59e0b" />
                  <Text className={`ml-1 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {agent.avgRating?.toFixed(1) || '0.0'}
                  </Text>
                </View>
                <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  ({agent.reviewCount || 0} reviews)
                </Text>
              </View>
            </View>

            {/* Specialties */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {agent.specialty?.map((skill) => (
                <View
                  key={skill}
                  className={`rounded-full px-3 py-1.5 ${
                    isDark ? 'bg-[#1e1e1e] border border-[#2a2a2a]' : 'bg-gray-50 border border-gray-100'
                  }`}>
                  <Text className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {skill}
                  </Text>
                </View>
              ))}
            </View>

            {/* Quick Stats Grid */}
            <View className={`flex-row gap-3 pt-4 border-t ${
              isDark ? 'border-[#222]' : 'border-gray-100'
            }`}>
              <View className="flex-1 items-center">
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {agent.completedProjects || 0}
                </Text>
                <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  Projects
                </Text>
              </View>
              <View className={`w-px ${isDark ? 'bg-[#222]' : 'bg-gray-100'}`} />
              <View className="flex-1 items-center">
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {agent.experience || 0}
                </Text>
                <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  Years Exp
                </Text>
              </View>
              <View className={`w-px ${isDark ? 'bg-[#222]' : 'bg-gray-100'}`} />
              <View className="flex-1 items-center">
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {agent.responseTime || 'N/A'}
                </Text>
                <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  Response
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* About Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mt-4 px-5">
          <View
            className={`rounded-3xl p-5 ${
              isDark
                ? 'bg-[#141414] border border-[#252525]'
                : 'bg-white border border-gray-100'
            }`}>
            <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              About
            </Text>
            <Text className={`text-sm leading-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {agent.bio}
            </Text>

            {/* Languages */}
            {agent.languages && agent.languages.length > 0 && (
              <View className="flex-row items-center mt-4">
                <Globe color={isDark ? '#666' : '#999'} size={16} />
                <Text className={`ml-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Speaks: {agent.languages.join(', ')}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Services Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="mt-4 px-5">
          <View
            className={`rounded-3xl p-5 ${
              isDark
                ? 'bg-[#141414] border border-[#252525]'
                : 'bg-white border border-gray-100'
            }`}>
            <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Services
            </Text>
            <View className="gap-0">
              {agent.services?.map((service, index) => (
                <View
                  key={index}
                  className={`flex-row items-center justify-between py-3.5 ${
                    index < (agent.services?.length || 0) - 1
                      ? `border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-50'}`
                      : ''
                  }`}>
                  <View className="flex-1 pr-3">
                    <Text
                      className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {service.name}
                    </Text>
                    <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      {service.duration}
                    </Text>
                  </View>
                  <Text className={`text-base font-bold ${
                    service.price === 0
                      ? 'text-green-500'
                      : isDark
                      ? 'text-white'
                      : 'text-gray-900'
                  }`}>
                    {service.price === 0 ? 'Free' : `AED ${service.price.toLocaleString()}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Contact Section */}
        <Animated.View entering={FadeInDown.delay(400).springify()} className="mt-4 px-5">
          <View
            className={`rounded-3xl p-5 ${
              isDark
                ? 'bg-[#141414] border border-[#252525]'
                : 'bg-white border border-gray-100'
            }`}>
            <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Contact
            </Text>
            <View className="gap-3">
              {agent.email && (
                <TouchableOpacity
                  onPress={handleEmail}
                  className="flex-row items-center"
                  activeOpacity={0.7}>
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-xl ${
                      isDark ? 'bg-[#1e1e1e]' : 'bg-gray-50'
                    }`}>
                    <Mail color={isDark ? '#888' : '#666'} size={18} />
                  </View>
                  <Text className={`ml-3 flex-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {agent.email}
                  </Text>
                </TouchableOpacity>
              )}
              {agent.phone && (
                <TouchableOpacity
                  onPress={handleCall}
                  className="flex-row items-center"
                  activeOpacity={0.7}>
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-xl ${
                      isDark ? 'bg-[#1e1e1e]' : 'bg-gray-50'
                    }`}>
                    <Phone color={isDark ? '#888' : '#666'} size={18} />
                  </View>
                  <Text className={`ml-3 flex-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {agent.phone}
                  </Text>
                </TouchableOpacity>
              )}
              {agent.whatsapp && (
                <TouchableOpacity
                  onPress={handleWhatsApp}
                  className="flex-row items-center"
                  activeOpacity={0.7}>
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-xl ${
                      isDark ? 'bg-green-900/30' : 'bg-green-50'
                    }`}>
                    <MessageCircle color="#22c55e" size={18} />
                  </View>
                  <Text className={`ml-3 flex-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    WhatsApp
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Availability Badge */}
        {agent.availability && (
          <Animated.View entering={FadeInDown.delay(450).springify()} className="mt-4 px-5">
            <View
              className={`flex-row items-center rounded-3xl p-4 ${
                isDark
                  ? 'bg-green-900/15 border border-green-900/30'
                  : 'bg-green-50 border border-green-100'
              }`}>
              <View className="w-10 h-10 rounded-xl bg-green-500/20 items-center justify-center">
                <CheckCircle color="#22c55e" size={20} />
              </View>
              <View className="ml-3 flex-1">
                <Text className={`font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                  Available Now
                </Text>
                <Text className={`text-xs mt-0.5 ${isDark ? 'text-green-600' : 'text-green-600'}`}>
                  Ready to take on new clients
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Reviews Section */}
        <Animated.View entering={FadeInDown.delay(500).springify()} className="mt-6">
          <View className="flex-row items-center justify-between px-5 mb-4">
            <View>
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Client Reviews
              </Text>
              <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </Text>
            </View>
            {firebaseUser && (
              <TouchableOpacity
                onPress={() => setShowReviewForm(!showReviewForm)}
                className={`rounded-full px-4 py-2 ${
                  isDark ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-gray-50 border border-gray-200'
                }`}
                activeOpacity={0.7}>
                <Text className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {showReviewForm ? 'Cancel' : 'Write Review'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Review Form */}
          {showReviewForm && (
            <Animated.View
              entering={FadeInDown.springify()}
              className="px-5 mb-4">
              <View
                className={`rounded-3xl p-5 ${
                  isDark
                    ? 'bg-[#141414] border border-[#252525]'
                    : 'bg-white border border-gray-100'
                }`}>
                <Text className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Your Rating
                </Text>
                <StarRatingInput rating={reviewRating} onRate={setReviewRating} />

                <Text className={`text-sm font-bold mt-4 mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Your Review
                </Text>
                <TextInput
                  placeholder="Share your experience..."
                  placeholderTextColor={isDark ? '#555' : '#aaa'}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className={`rounded-2xl p-4 text-sm min-h-[100px] ${
                    isDark
                      ? 'bg-[#1e1e1e] border border-[#2a2a2a] text-white'
                      : 'bg-gray-50 border border-gray-200 text-gray-900'
                  }`}
                />

                <TouchableOpacity
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                  className={`mt-4 rounded-2xl py-3.5 items-center ${
                    isDark ? 'bg-white' : 'bg-gray-900'
                  } ${submittingReview ? 'opacity-60' : ''}`}
                  activeOpacity={0.8}>
                  {submittingReview ? (
                    <ActivityIndicator color={isDark ? '#000' : '#fff'} size="small" />
                  ) : (
                    <Text className={`font-bold text-sm ${isDark ? 'text-black' : 'text-white'}`}>
                      Submit Review
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Reviews Carousel */}
          {reviewsLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color={isDark ? '#666' : '#999'} />
            </View>
          ) : reviews.length === 0 ? (
            <View className="mx-5 py-8 items-center">
              <View
                className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${
                  isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                }`}>
                <Star color={isDark ? '#444' : '#ccc'} size={24} />
              </View>
              <Text className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No reviews yet
              </Text>
              <Text className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                Be the first to review this agent
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={width - 60}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {reviews.map((review) => (
                <ReviewCard key={review.reviewId} review={review} isDark={isDark} />
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </AnimatedScrollView>

      {/* Fixed Bottom CTA */}
      <SafeAreaView
        edges={['bottom']}
        className={`absolute bottom-0 left-0 right-0 border-t ${
          isDark ? 'border-[#222] bg-black/95' : 'border-gray-200 bg-white/95'
        }`}>
        <View className="flex-row gap-3 px-5 py-4">
          <TouchableOpacity
            onPress={handleMessageAgent}
            disabled={startingChat}
            className={`flex-1 items-center justify-center rounded-2xl py-4 ${
              isDark ? 'bg-white' : 'bg-gray-900'
            } ${startingChat ? 'opacity-60' : ''}`}
            activeOpacity={0.7}>
            {startingChat ? (
              <ActivityIndicator color={isDark ? '#000' : '#fff'} size="small" />
            ) : (
              <View className="flex-row items-center">
                <Send color={isDark ? '#000' : '#fff'} size={18} />
                <Text className={`ml-2 font-bold text-sm ${isDark ? 'text-black' : 'text-white'}`}>
                  Message
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleWhatsApp}
            className={`items-center justify-center rounded-2xl border px-5 py-4 ${
              isDark
                ? 'border-[#333] bg-[#141414]'
                : 'border-gray-200 bg-gray-50'
            }`}
            activeOpacity={0.7}>
            <MessageCircle color="#22c55e" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCall}
            className={`items-center justify-center rounded-2xl border px-5 py-4 ${
              isDark
                ? 'border-[#333] bg-[#141414]'
                : 'border-gray-200 bg-gray-50'
            }`}
            activeOpacity={0.7}>
            <Phone color={isDark ? '#fff' : '#000'} size={18} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
