import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Star,
  ChevronRight,
  TrendingUp,
  Award,
  Users,
  CreditCard,
  FileText,
  Shield,
} from '@/components/Icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Link, useRouter } from 'expo-router';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/src/store/authStore';
import { useAgentStore } from '@/src/store/agentStore';
import { useFavoritesStore } from '@/src/store/favoritesStore';
import type { Agent } from '@/src/types';

const { width } = Dimensions.get('window');

// Quick actions with theme-aware colors
const quickActions = [
  {
    id: 1,
    icon: Search,
    label: 'Find Agents',
    description: 'Browse all',
    href: '/(tabs)/agents' as const,
  },
  {
    id: 2,
    icon: CreditCard,
    label: 'Calculator',
    description: 'EMI & eligibility',
    href: '/calculator' as const,
  },
  {
    id: 3,
    icon: FileText,
    label: 'Apply Now',
    description: 'Mortgage form',
    href: '/application' as const,
  },
  {
    id: 4,
    icon: TrendingUp,
    label: 'My Apps',
    description: 'Track status',
    href: '/my-applications' as const,
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Quick Action Card Component
function QuickActionCard({ item, index }: { item: (typeof quickActions)[0]; index: number }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const Icon = item.icon;

  return (
    <AnimatedPressable
      style={[animatedStyle, { width: '48%' }]}
      className={`relative overflow-hidden rounded-3xl border-2 p-4 shadow-sm ${
        isDark ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
      }`}
      onPress={() => router.push(item.href as any)}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 150 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150 });
      }}>
      {/* Decorative Circle Overlay */}
      <View className={`absolute -right-8 -top-8 ${isDark ? 'opacity-[0.03]' : 'opacity-[0.08]'}`}>
        <View className={`h-28 w-28 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />
      </View>

      <View
        className={`mb-3 h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${
          isDark ? 'bg-white' : 'bg-black'
        }`}>
        <Icon color={isDark ? '#000' : '#fff'} size={24} strokeWidth={2.5} />
      </View>
      <Text className={`mb-1 text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>
        {item.label}
      </Text>
      <Text className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {item.description}
      </Text>
    </AnimatedPressable>
  );
}

// Featured Agent Card Component - Connected to Firestore
function FeaturedAgentCard({ agent }: { agent: Agent }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Determine tag based on rating/experience
  const tag = agent.avgRating >= 4.9 ? 'Top Agent' : agent.experience >= 12 ? 'Expert' : 'Featured';

  return (
    <AnimatedPressable
      style={animatedStyle}
      className={`mr-4 w-[180px] overflow-hidden rounded-2xl ${
        isDark ? 'border border-[#222] bg-[#111]' : 'border border-gray-100 bg-white'
      }`}
      onPress={() => router.push({ pathname: '/agent-detail', params: { agentId: agent.uid } })}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 150 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150 });
      }}>
      {/* Agent Photo with Gradient Overlay */}
      <View className="relative h-52">
        <Image
          source={{ uri: agent.photoURL || 'https://via.placeholder.com/400' }}
          className="h-full w-full"
          resizeMode="cover"
        />

        {/* Full Dark Overlay for better text contrast */}
        <View className="absolute bottom-0 left-0 right-0 top-0 bg-black/30" />

        {/* Top Badge */}
        <View className="absolute left-2 top-2">
          <View className="overflow-hidden rounded-xl border border-white/30 bg-white/20 px-2.5 py-1.5">
            <Text className="text-[10px] font-bold text-white">{tag}</Text>
          </View>
        </View>

        {/* Availability Dot */}
        {agent.availability && (
          <View className="absolute right-2.5 top-2.5">
            <View className="h-3 w-3 rounded-full border-2 border-white/40 bg-green-400" />
          </View>
        )}

        {/* Agent Info Overlay */}
        <View className="absolute bottom-0 left-0 right-0 p-3">
          <Text className="mb-0.5 text-base font-bold text-white" numberOfLines={1}>
            {agent.displayName}
          </Text>
          <Text className="mb-2 text-[10px] text-white/90" numberOfLines={1}>
            {agent.specialty?.[0] || 'Mortgage Specialist'}
          </Text>

          {/* Stats Row */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center overflow-hidden rounded-xl border border-white/30 bg-white/20 px-2.5 py-1.5">
              <Star color="#fff" size={10} fill="#fff" />
              <Text className="ml-1 text-[10px] font-bold text-white">
                {agent.avgRating?.toFixed(1) || '0.0'}
              </Text>
            </View>

            <View className="flex-row items-center overflow-hidden rounded-xl border border-white/30 bg-white/20 px-2.5 py-1.5">
              <Users color="#fff" size={10} />
              <Text className="ml-1 text-[10px] font-semibold text-white">
                {agent.completedProjects || 0}+
              </Text>
            </View>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

// Skeleton loader for featured agents
function FeaturedAgentSkeleton() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className={`mr-4 h-52 w-[180px] overflow-hidden rounded-2xl ${
        isDark ? 'bg-[#1a1a1a]' : 'bg-gray-200'
      }`}>
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={isDark ? '#fff' : '#000'} />
      </View>
    </View>
  );
}

// Stat Card Component
function StatCard({
  stat,
  agentCount,
}: {
  stat: { label: string; value: string; icon: any; dynamicValue?: string };
  agentCount: number;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const Icon = stat.icon;

  // Use dynamic value if available
  const displayValue = stat.dynamicValue || stat.value;

  return (
    <View
      className={`flex-1 items-center rounded-3xl border-2 p-4 shadow-sm ${
        isDark ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
      }`}>
      <View
        className={`mb-3 h-12 w-12 items-center justify-center rounded-2xl shadow-lg ${
          isDark ? 'bg-white' : 'bg-black'
        }`}>
        <Icon color={isDark ? '#000' : '#fff'} size={20} strokeWidth={2.5} />
      </View>
      <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
        {displayValue}
      </Text>
      <Text className={`mt-1 text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {stat.label}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { userDoc, firebaseUser } = useAuthStore();
  const { featuredAgents, featuredLoading, agents, fetchFeaturedAgents, subscribe } =
    useAgentStore();
  const { favoriteIds } = useFavoritesStore();
  const isAdmin = userDoc?.role === 'admin';

  // Show first name only
  const fullName = userDoc?.displayName ?? firebaseUser?.displayName ?? 'User';
  const firstName = fullName.split(' ')[0];

  // Fetch featured agents and subscribe to real-time updates
  useEffect(() => {
    fetchFeaturedAgents(5);
    const unsubscribe = subscribe();
    return unsubscribe;
  }, []);

  // Compute dynamic stats from real data
  const agentCount = agents.length || featuredAgents.length;
  const avgRating =
    featuredAgents.length > 0
      ? (
          featuredAgents.reduce((sum, a) => sum + (a.avgRating || 0), 0) / featuredAgents.length
        ).toFixed(1)
      : '0.0';
  const totalProjects =
    agents.reduce((sum, a) => sum + (a.completedProjects || 0), 0) ||
    featuredAgents.reduce((sum, a) => sum + (a.completedProjects || 0), 0);

  // Get favorite agents
  const favoriteAgents = agents.filter((agent) => favoriteIds.includes(agent.uid));

  const platformStats = [
    { label: 'Active Agents', value: `${agentCount || '0'}`, icon: Users },
    { label: 'Projects Done', value: `${totalProjects}+`, icon: Award },
    { label: 'Avg Rating', value: avgRating, icon: Star },
  ];

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="px-6 pb-6 pt-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`mb-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Welcome back,
            </Text>
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {firstName}
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        {/* Admin Dashboard Banner */}
        {isAdmin && (
          <Pressable
            onPress={() => router.push('/admin' as any)}
            className={`mx-6 mb-6 flex-row items-center rounded-3xl border-2 p-4 ${
              isDark ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-black bg-black'
            }`}>
            <View
              className={`mr-4 h-12 w-12 items-center justify-center rounded-2xl ${
                isDark ? 'bg-white' : 'bg-white'
              }`}>
              <Shield color="#000" size={22} strokeWidth={2.5} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-white">Admin Dashboard</Text>
              <Text className="mt-0.5 text-xs text-gray-400">
                Manage users, apps, support & analytics
              </Text>
            </View>
            <ChevronRight color="#666" size={20} />
          </Pressable>
        )}

        {/* Quick Actions Grid */}
        <View className="mb-8 px-6">
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {quickActions.map((item, index) => (
              <QuickActionCard key={item.id} item={item} index={index} />
            ))}
          </View>
        </View>

        {/* Featured Agents Section */}
        <View className="mb-8">
          <View className="mb-4 flex-row items-center justify-between px-6">
            <View>
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Featured Agents
              </Text>
              <Text className={`mt-0.5 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Top-rated professionals
              </Text>
            </View>
            <Link href="/(tabs)/agents" asChild>
              <Pressable className="flex-row items-center rounded-full bg-transparent px-3 py-2">
                <Text
                  className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  See All
                </Text>
                <ChevronRight color={isDark ? '#666' : '#999'} size={16} />
              </Pressable>
            </Link>
          </View>

          {featuredLoading ? (
            // Loading skeleton
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}>
              {[1, 2, 3].map((i) => (
                <FeaturedAgentSkeleton key={i} />
              ))}
            </ScrollView>
          ) : featuredAgents.length === 0 ? (
            // Empty state
            <View className="mx-6 items-center py-8">
              <View
                className={`mb-3 h-16 w-16 items-center justify-center rounded-full ${
                  isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                }`}>
                <Users color={isDark ? '#555' : '#999'} size={28} />
              </View>
              <Text
                className={`mb-1 text-base font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No agents yet
              </Text>
              <Text className={`text-center text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                Agents will appear here once they join the platform
              </Text>
            </View>
          ) : (
            // Real agent cards
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
              decelerationRate="fast"
              snapToInterval={196}>
              {featuredAgents.map((agent) => (
                <FeaturedAgentCard key={agent.uid} agent={agent} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Your Favorite Agents Section */}
        {favoriteAgents.length > 0 && (
          <View className="mb-8">
            <View className="mb-4 flex-row items-center justify-between px-6">
              <View>
                <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  Your Favorite Agents
                </Text>
                <Text className={`mt-0.5 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {favoriteAgents.length} {favoriteAgents.length === 1 ? 'agent' : 'agents'} saved
                </Text>
              </View>
              <Link href="/(tabs)/agents" asChild>
                <Pressable className="flex-row items-center rounded-full bg-transparent px-3 py-2">
                  <Text
                    className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    See All
                  </Text>
                  <ChevronRight color={isDark ? '#666' : '#999'} size={16} />
                </Pressable>
              </Link>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
              decelerationRate="fast"
              snapToInterval={196}>
              {favoriteAgents.map((agent) => (
                <FeaturedAgentCard key={agent.uid} agent={agent} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Platform Stats */}
        <View className="px-6">
          <Text className={`mb-4 text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Platform Stats
          </Text>
          <View className="flex-row gap-3">
            {platformStats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} agentCount={agentCount} />
            ))}
          </View>
        </View>

        {/* CTA Banner */}
        <View className="mt-8 px-6">
          <View className={`rounded-3xl p-6 ${isDark ? 'bg-white' : 'bg-black'}`}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text className={`text-xl font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                  Ready to Apply?
                </Text>
                <Text
                  className={`mt-2 text-sm leading-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  Calculate your EMI, check eligibility, and submit your mortgage application
                </Text>
              </View>
              <View
                className={`h-12 w-12 items-center justify-center rounded-2xl ${
                  isDark ? 'bg-black' : 'bg-white'
                }`}>
                <CreditCard color={isDark ? '#fff' : '#000'} size={24} />
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/calculator' as any)}
              className={`mt-5 items-center rounded-xl py-3.5 ${isDark ? 'bg-black' : 'bg-white'}`}>
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                Open Calculator
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
