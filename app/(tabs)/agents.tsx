import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  FadeInDown,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { Search, Star, MapPin, ChevronDown, ChevronUp, Heart, Users, Award, CheckCircle } from '@/components/Icons';
import { useRouter } from 'expo-router';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useColorScheme } from 'nativewind';
import { useAgents } from '@/src/hooks/useAgents';
import { useFavorites } from '@/src/hooks/useFavorites';
import { AGENT_CATEGORIES } from '@/src/types/agent';
import type { Agent } from '@/src/types';

// Agent Card Component - Premium Redesign
function AgentCard({
  agent,
  index,
  isFavorite,
  onToggleFavorite,
}: {
  agent: Agent;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <TouchableOpacity
        className={`overflow-hidden rounded-3xl border ${
          isDark
            ? 'bg-[#141414] border-[#252525]'
            : 'bg-white border-gray-100'
        }`}
        activeOpacity={0.92}
        onPress={() =>
          router.push({ pathname: '/agent-detail', params: { agentId: agent.uid } })
        }>

        {/* Top Section: Photo + Info side by side */}
        <View className="flex-row p-4">
          {/* Agent Avatar */}
          <View className="relative">
            <Image
              source={{ uri: agent.photoURL || 'https://via.placeholder.com/120' }}
              className="w-20 h-20 rounded-2xl"
              resizeMode="cover"
            />
            {/* Online indicator */}
            {agent.availability && (
              <View className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center ${
                isDark ? 'bg-[#141414]' : 'bg-white'
              }`}>
                <View className="w-3.5 h-3.5 rounded-full bg-green-500" />
              </View>
            )}
          </View>

          {/* Agent Info */}
          <View className="flex-1 ml-4 justify-center">
            <View className="flex-row items-center justify-between">
              <Text
                className={`text-lg font-bold flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
                numberOfLines={1}>
                {agent.displayName}
              </Text>
              <TouchableOpacity
                onPress={() => onToggleFavorite(agent.uid)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}>
                <Heart
                  color={isFavorite ? '#ef4444' : isDark ? '#555' : '#ccc'}
                  size={20}
                  fill={isFavorite ? '#ef4444' : 'transparent'}
                />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center mt-1">
              <MapPin color={isDark ? '#666' : '#999'} size={13} />
              <Text className={`ml-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {agent.location}
              </Text>
            </View>

            {/* Rating + Experience row */}
            <View className="flex-row items-center mt-2 gap-3">
              <View className="flex-row items-center">
                <Star color="#f59e0b" size={14} fill="#f59e0b" />
                <Text className={`ml-1 text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {agent.avgRating?.toFixed(1) || '0.0'}
                </Text>
                <Text className={`ml-1 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  ({agent.reviewCount || 0})
                </Text>
              </View>
              <View className={`w-px h-3 ${isDark ? 'bg-[#333]' : 'bg-gray-200'}`} />
              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {agent.experience} yrs exp
              </Text>
            </View>
          </View>
        </View>

        {/* Specialties */}
        <View className="px-4 pb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {agent.specialty?.slice(0, 3).map((skill) => (
                <View
                  key={skill}
                  className={`rounded-full px-3 py-1.5 ${
                    isDark ? 'bg-[#1e1e1e] border border-[#2a2a2a]' : 'bg-gray-50 border border-gray-100'
                  }`}>
                  <Text
                    className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {skill}
                  </Text>
                </View>
              ))}
              {agent.languages && agent.languages.length > 0 && (
                <View
                  className={`rounded-full px-3 py-1.5 ${
                    isDark ? 'bg-[#1e1e1e] border border-[#2a2a2a]' : 'bg-gray-50 border border-gray-100'
                  }`}>
                  <Text className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {agent.languages.slice(0, 2).join(' / ')}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Bottom Stats Bar */}
        <View className={`flex-row items-center justify-between px-4 py-3 border-t ${
          isDark ? 'border-[#222] bg-[#0d0d0d]' : 'border-gray-50 bg-gray-50/50'
        }`}>
          {/* Quick Stats */}
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center">
              <Award color={isDark ? '#666' : '#999'} size={14} />
              <Text className={`ml-1 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {agent.completedProjects || 0} projects
              </Text>
            </View>
            <View className="flex-row items-center">
              <CheckCircle color={isDark ? '#666' : '#999'} size={14} />
              <Text className={`ml-1 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {agent.responseTime || 'N/A'}
              </Text>
            </View>
          </View>

          {/* View Profile Button */}
          <TouchableOpacity
            className={`rounded-full px-4 py-2 ${
              isDark ? 'bg-white' : 'bg-gray-900'
            }`}
            activeOpacity={0.8}
            onPress={() =>
              router.push({ pathname: '/agent-detail', params: { agentId: agent.uid } })
            }>
            <Text className={`text-xs font-bold ${isDark ? 'text-black' : 'text-white'}`}>
              View Profile
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Loading Skeleton Card
function SkeletonCard() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className={`rounded-3xl border p-4 ${
      isDark ? 'bg-[#141414] border-[#252525]' : 'bg-white border-gray-100'
    }`}>
      <View className="flex-row">
        <View className={`w-20 h-20 rounded-2xl ${isDark ? 'bg-[#222]' : 'bg-gray-200'}`} />
        <View className="flex-1 ml-4 justify-center gap-2">
          <View className={`h-5 w-3/4 rounded-lg ${isDark ? 'bg-[#222]' : 'bg-gray-200'}`} />
          <View className={`h-3 w-1/2 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`} />
          <View className={`h-3 w-2/3 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`} />
        </View>
      </View>
      <View className="flex-row gap-2 mt-3">
        <View className={`h-7 w-24 rounded-full ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`} />
        <View className={`h-7 w-20 rounded-full ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`} />
        <View className={`h-7 w-16 rounded-full ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`} />
      </View>
    </View>
  );
}

export default function AgentsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation
  const filterHeight = useSharedValue(0);

  // Zustand stores
  const {
    filteredAgents,
    loading,
    error,
    filters,
    fetchAgents,
    setFilters,
    resetFilters,
    subscribe,
  } = useAgents();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Fetch agents on mount + subscribe to real-time
  useEffect(() => {
    fetchAgents();
    const unsubscribe = subscribe();
    return unsubscribe;
  }, []);

  useEffect(() => {
    filterHeight.value = withTiming(filterExpanded ? 1 : 0, {
      duration: 300,
    });
  }, [filterExpanded]);

  const filterAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: filterHeight.value * 160,
      opacity: filterHeight.value,
      overflow: 'hidden',
    };
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAgents();
    setRefreshing(false);
  }, [fetchAgents]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setFilters({ searchQuery: text });
    },
    [setFilters]
  );

  const handleCategorySelect = useCallback(
    (category: string) => {
      setFilters({ category });
    },
    [setFilters]
  );

  const handleAvailableToggle = useCallback(() => {
    setFilters({ availableOnly: !filters.availableOnly });
    fetchAgents({ availableOnly: !filters.availableOnly });
  }, [filters.availableOnly, setFilters, fetchAgents]);

  const activeFilterCount =
    (filters.category !== 'All' ? 1 : 0) +
    (filters.availableOnly ? 1 : 0) +
    (filters.minRating ? 1 : 0);

  const toggleFilters = () => {
    setFilterExpanded(!filterExpanded);
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="px-6 pt-2 pb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`text-sm mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Explore mortgage professionals
            </Text>
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Find Agents
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      <View className="px-6 pb-3">
        {/* Search Bar */}
        <View
          className={`mb-3 flex-row items-center rounded-2xl px-4 py-3 ${
            isDark ? 'bg-[#141414] border border-[#252525]' : 'bg-white border border-gray-200'
          }`}>
          <Search color={isDark ? '#666' : '#999'} size={20} />
          <TextInput
            placeholder="Search by name, specialty, or location..."
            placeholderTextColor={isDark ? '#555' : '#aaa'}
            value={filters.searchQuery}
            onChangeText={handleSearchChange}
            className={`ml-3 flex-1 text-base ${isDark ? 'text-white' : 'text-black'}`}
          />
          {filters.searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')} activeOpacity={0.7}>
              <Text className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Toggle */}
        <TouchableOpacity
          onPress={toggleFilters}
          className={`flex-row items-center justify-between rounded-2xl border px-4 py-3 ${
            isDark
              ? 'bg-[#141414] border-[#252525]'
              : 'bg-white border-gray-200'
          }`}
          activeOpacity={0.7}>
          <View className="flex-row items-center">
            <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Filters
            </Text>
            {activeFilterCount > 0 && (
              <View className={`ml-2 w-5 h-5 rounded-full items-center justify-center ${
                isDark ? 'bg-white' : 'bg-black'
              }`}>
                <Text className={`text-[10px] font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </View>
          {filterExpanded ? (
            <ChevronUp color={isDark ? '#888' : '#666'} size={20} />
          ) : (
            <ChevronDown color={isDark ? '#888' : '#666'} size={20} />
          )}
        </TouchableOpacity>

        {/* Collapsible Filter Section */}
        <Animated.View style={filterAnimatedStyle}>
          <View className="pt-3">
            <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Specialty
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-2">
                {AGENT_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    onPress={() => handleCategorySelect(category)}
                    className={`rounded-full border px-4 py-2 ${
                      filters.category === category
                        ? isDark
                          ? 'border-white bg-white'
                          : 'border-black bg-black'
                        : isDark
                        ? 'border-[#333] bg-transparent'
                        : 'border-gray-200 bg-transparent'
                    }`}
                    activeOpacity={0.7}>
                    <Text
                      className={`text-sm font-medium ${
                        filters.category === category
                          ? isDark
                            ? 'text-black'
                            : 'text-white'
                          : isDark
                          ? 'text-gray-300'
                          : 'text-gray-700'
                      }`}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Availability Toggle */}
            <View className="mt-3 flex-row items-center justify-between">
              <Text className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Availability
              </Text>
              <TouchableOpacity
                onPress={handleAvailableToggle}
                className={`rounded-full border px-4 py-2 ${
                  filters.availableOnly
                    ? isDark
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-green-600 bg-green-50'
                    : isDark
                    ? 'border-[#333] bg-transparent'
                    : 'border-gray-200 bg-transparent'
                }`}
                activeOpacity={0.7}>
                <Text
                  className={`text-sm font-medium ${
                    filters.availableOnly
                      ? isDark
                        ? 'text-green-400'
                        : 'text-green-700'
                      : isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                  }`}>
                  Available Now
                </Text>
              </TouchableOpacity>
            </View>

            {/* Reset Filters */}
            {activeFilterCount > 0 && (
              <TouchableOpacity
                onPress={() => {
                  resetFilters();
                  fetchAgents();
                }}
                className="mt-2"
                activeOpacity={0.7}>
                <Text className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Reset all filters
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Results Count */}
      <View className="px-6 pb-2">
        <Text className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          {loading ? 'Searching...' : `${filteredAgents.length} agent${filteredAgents.length !== 1 ? 's' : ''} found`}
        </Text>
      </View>

      {/* Agent Cards */}
      {loading && filteredAgents.length === 0 ? (
        // Loading skeletons
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128, gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </ScrollView>
      ) : filteredAgents.length === 0 ? (
        // Empty state
        <View className="flex-1 items-center justify-center px-6 pb-32">
          <View
            className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${
              isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
            }`}>
            <Users color={isDark ? '#444' : '#bbb'} size={36} />
          </View>
          <Text className={`text-lg font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            No agents found
          </Text>
          <Text className={`text-sm text-center leading-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            {filters.searchQuery
              ? 'Try adjusting your search or filters'
              : 'No mortgage agents available at this time'}
          </Text>
          {(filters.searchQuery || filters.category !== 'All' || filters.availableOnly) && (
            <TouchableOpacity
              onPress={() => {
                resetFilters();
                fetchAgents();
              }}
              className={`mt-4 rounded-full px-6 py-3 ${isDark ? 'bg-white' : 'bg-black'}`}
              activeOpacity={0.8}>
              <Text className={`font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                Clear Filters
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Agent list
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128, gap: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#fff' : '#000'}
            />
          }>
          {filteredAgents.map((agent, index) => (
            <AgentCard
              key={agent.uid}
              agent={agent}
              index={index}
              isFavorite={isFavorite(agent.uid)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
