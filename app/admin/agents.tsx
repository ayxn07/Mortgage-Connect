import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Star,
  MapPin,
  Users,
  X,
  Eye,
  Mail,
  Phone,
  Calendar,
  Award,
  Clock,
  Globe,
  ToggleLeft,
  ToggleRight,
} from '@/components/Icons';
import {
  fetchAllAgents,
  toggleAgentAvailability,
  fetchAgentReviews,
} from '@/src/services/adminFirestore';
import type { Agent } from '@/src/types/agent';
import type { Review } from '@/src/types/review';
import { useAuthStore } from '@/src/store/authStore';

export default function AdminAgentsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { userDoc } = useAuthStore();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Detail modal
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const loadAgents = useCallback(async () => {
    try {
      const data = await fetchAllAgents();
      setAgents(data);
    } catch (err) {
      console.error('[AdminAgents] Failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAgents();
  }, [loadAgents]);

  const handleToggleAvailability = async (agent: Agent) => {
    try {
      await toggleAgentAvailability(agent.uid, !agent.availability);
      setAgents((prev) =>
        prev.map((a) =>
          a.uid === agent.uid ? { ...a, availability: !a.availability } : a
        )
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to toggle availability');
    }
  };

  const handleViewDetails = async (agent: Agent) => {
    setSelectedAgent(agent);
    setShowDetailModal(true);
    setReviewsLoading(true);
    try {
      const r = await fetchAgentReviews(agent.uid);
      setReviews(r);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      agent.displayName?.toLowerCase().includes(q) ||
      agent.location?.toLowerCase().includes(q) ||
      agent.specialty?.some((s) => s.toLowerCase().includes(q))
    );
  });

  // Summary stats
  const totalAgents = agents.length;
  const availableCount = agents.filter((a) => a.availability).length;
  const avgRating = agents.length > 0
    ? (agents.reduce((s, a) => s + (a.avgRating || 0), 0) / agents.length).toFixed(1)
    : '0.0';
  const totalProjects = agents.reduce((s, a) => s + (a.completedProjects || 0), 0);

  const formatDate = (ts: any) => {
    if (!ts) return 'N/A';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (userDoc?.role !== 'admin') {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Access Denied</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="px-6 pt-2 pb-4">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
            <ArrowLeft color={isDark ? '#fff' : '#000'} size={20} />
          </Pressable>
          <View>
            <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Admin Panel</Text>
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Agents</Text>
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      <View className="px-6 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { label: 'Total', value: totalAgents, color: isDark ? '#fff' : '#000' },
            { label: 'Available', value: availableCount, color: '#22c55e' },
            { label: 'Avg Rating', value: avgRating, color: '#f59e0b' },
            { label: 'Projects', value: totalProjects, color: '#3b82f6' },
          ].map((item) => (
            <View
              key={item.label}
              className={`mr-3 rounded-2xl border px-4 py-3 min-w-[80px] items-center ${
                isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
              }`}>
              <Text className="text-xl font-bold" style={{ color: item.color }}>
                {item.value}
              </Text>
              <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {item.label}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Search */}
      <View className="px-6 mb-4">
        <View className={`flex-row items-center rounded-2xl border px-4 py-3 ${
          isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
        }`}>
          <Search color={isDark ? '#666' : '#999'} size={18} />
          <TextInput
            className={`flex-1 ml-3 text-sm ${isDark ? 'text-white' : 'text-black'}`}
            placeholder="Search agents..."
            placeholderTextColor={isDark ? '#555' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <X color={isDark ? '#666' : '#999'} size={16} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Agent List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />
          }>
          <Text className={`text-sm mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''}
          </Text>

          {filteredAgents.map((agent) => {
            const initials = (agent.displayName || 'A')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            return (
              <View
                key={agent.uid}
                className={`rounded-2xl border p-4 mb-3 ${
                  isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                }`}>
                <View className="flex-row items-center mb-3">
                  <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-white' : 'bg-black'}`}>
                    <Text className={`font-bold ${isDark ? 'text-black' : 'text-white'}`}>{initials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`} numberOfLines={1}>
                      {agent.displayName}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <MapPin color={isDark ? '#666' : '#999'} size={12} />
                      <Text className={`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {agent.location || 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <View className="flex-row items-center">
                      <Star color="#f59e0b" size={14} />
                      <Text className={`text-sm font-bold ml-1 ${isDark ? 'text-white' : 'text-black'}`}>
                        {agent.avgRating?.toFixed(1) || '0.0'}
                      </Text>
                    </View>
                    <View className={`px-2 py-0.5 rounded-full mt-1 ${
                      agent.availability ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      <Text className={`text-[10px] font-semibold ${
                        agent.availability ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {agent.availability ? 'Available' : 'Unavailable'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Specialties */}
                {agent.specialty && agent.specialty.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                    {agent.specialty.map((spec) => (
                      <View key={spec} className={`mr-2 px-2.5 py-1 rounded-lg ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                        <Text className={`text-[10px] font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{spec}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {/* Actions */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleViewDetails(agent)}
                    className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${
                      isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                    }`}>
                    <Eye color={isDark ? '#aaa' : '#666'} size={14} />
                    <Text className={`text-xs font-medium ml-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Details</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleToggleAvailability(agent)}
                    className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${
                      agent.availability ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                    {agent.availability ? (
                      <ToggleRight color="#22c55e" size={14} />
                    ) : (
                      <ToggleLeft color="#ef4444" size={14} />
                    )}
                    <Text className={`text-xs font-medium ml-1.5 ${agent.availability ? 'text-green-500' : 'text-red-500'}`}>
                      {agent.availability ? 'Available' : 'Unavailable'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Agent Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={() => setShowDetailModal(false)} />
          <View className={`rounded-t-3xl p-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`} style={{ maxHeight: '80%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Agent Details</Text>
              <Pressable onPress={() => setShowDetailModal(false)} className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                <X color={isDark ? '#fff' : '#000'} size={16} />
              </Pressable>
            </View>
            {selectedAgent && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Agent Header */}
                <View className="items-center mb-4">
                  <View className={`w-20 h-20 rounded-full items-center justify-center mb-2 ${isDark ? 'bg-white' : 'bg-black'}`}>
                    <Text className={`text-2xl font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                      {(selectedAgent.displayName || 'A').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </Text>
                  </View>
                  <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>{selectedAgent.displayName}</Text>
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedAgent.email}</Text>
                  <View className="flex-row items-center mt-2">
                    <Star color="#f59e0b" size={16} />
                    <Text className={`text-sm font-bold ml-1 ${isDark ? 'text-white' : 'text-black'}`}>
                      {selectedAgent.avgRating?.toFixed(1) || '0.0'}
                    </Text>
                    <Text className={`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      ({selectedAgent.totalReviews || 0} reviews)
                    </Text>
                  </View>
                </View>

                {/* Info Grid */}
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {[
                    { label: 'Location', value: selectedAgent.location || 'N/A', icon: MapPin },
                    { label: 'Experience', value: `${selectedAgent.experience || 0} yrs`, icon: Award },
                    { label: 'Rate', value: `AED ${selectedAgent.hourlyRate || 0}/hr`, icon: Clock },
                    { label: 'Projects', value: `${selectedAgent.completedProjects || 0}`, icon: Users },
                    { label: 'Response', value: selectedAgent.responseTime || 'N/A', icon: Clock },
                    { label: 'Phone', value: selectedAgent.phone || 'N/A', icon: Phone },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <View key={item.label} style={{ width: '48%' }} className={`p-3 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                        <View className="flex-row items-center mb-1">
                          <Icon color={isDark ? '#666' : '#999'} size={12} />
                          <Text className={`text-[10px] ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</Text>
                        </View>
                        <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`} numberOfLines={1}>{item.value}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Bio */}
                {selectedAgent.bio && (
                  <View className={`p-3 rounded-xl mb-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                    <Text className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Bio</Text>
                    <Text className={`text-sm leading-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selectedAgent.bio}</Text>
                  </View>
                )}

                {/* Specialties */}
                {selectedAgent.specialty && selectedAgent.specialty.length > 0 && (
                  <View className="mb-4">
                    <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Specialties</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedAgent.specialty.map((spec) => (
                        <View key={spec} className={`px-3 py-1.5 rounded-lg ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                          <Text className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{spec}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Languages */}
                {selectedAgent.languages && selectedAgent.languages.length > 0 && (
                  <View className="mb-4">
                    <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Languages</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedAgent.languages.map((lang) => (
                        <View key={lang} className={`px-3 py-1.5 rounded-lg ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                          <Text className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{lang}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Services */}
                {selectedAgent.services && selectedAgent.services.length > 0 && (
                  <View className="mb-4">
                    <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Services</Text>
                    {selectedAgent.services.map((svc, idx) => (
                      <View key={idx} className={`flex-row items-center justify-between p-3 rounded-xl mb-2 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                        <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>{svc.name}</Text>
                        <View className="items-end">
                          <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>AED {svc.price}</Text>
                          <Text className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{svc.duration}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Reviews */}
                <View className="mb-4">
                  <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Reviews</Text>
                  {reviewsLoading ? (
                    <ActivityIndicator color={isDark ? '#fff' : '#000'} />
                  ) : reviews.length === 0 ? (
                    <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No reviews yet</Text>
                  ) : (
                    reviews.slice(0, 5).map((review) => (
                      <View key={review.reviewId} className={`p-3 rounded-xl mb-2 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>{review.userName}</Text>
                          <View className="flex-row items-center">
                            <Star color="#f59e0b" size={12} />
                            <Text className={`text-xs font-bold ml-1 ${isDark ? 'text-white' : 'text-black'}`}>{review.rating}</Text>
                          </View>
                        </View>
                        <Text className={`text-xs leading-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{review.comment}</Text>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
