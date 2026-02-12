import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import {
  Users,
  Award,
  FileText,
  HelpCircle,
  MessageCircle,
  TrendingUp,
  ChevronRight,
  Activity,
  BarChart2,
  ArrowLeft,
} from '@/components/Icons';
import {
  fetchEnhancedDashboardStats,
  fetchRecentUsers,
  fetchActiveAgents,
  type EnhancedDashboardStats,
} from '@/src/services/adminFirestore';
import type { User } from '@/src/types/user';
import type { Agent } from '@/src/types/agent';
import { useAuthStore } from '@/src/store/authStore';
import Animated, { FadeIn } from 'react-native-reanimated';

const STATUS_COLORS: Record<string, string> = {
  submitted: '#f59e0b',
  pre_approval: '#3b82f6',
  property_valuation: '#8b5cf6',
  bank_approval: '#06b6d4',
  offer_letter: '#10b981',
  disbursement: '#22c55e',
  rejected: '#ef4444',
  completed: '#059669',
  draft: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  pre_approval: 'Pre-Approval',
  property_valuation: 'Valuation',
  bank_approval: 'Bank Approval',
  offer_letter: 'Offer Letter',
  disbursement: 'Disbursement',
  rejected: 'Rejected',
  completed: 'Completed',
  draft: 'Draft',
};

export default function AdminDashboard() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { userDoc } = useAuthStore();

  const [stats, setStats] = useState<EnhancedDashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [topAgents, setTopAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsData, usersData, agentsData] = await Promise.all([
        fetchEnhancedDashboardStats(),
        fetchRecentUsers(5),
        fetchActiveAgents(),
      ]);
      setStats(statsData);
      setRecentUsers(usersData);
      // Sort by rating, take top 5
      setTopAgents(
        agentsData
          .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
          .slice(0, 5)
      );
    } catch (err) {
      console.error('[AdminDashboard] Failed to load:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Guard: only admin
  if (userDoc?.role !== 'admin') {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          Access Denied
        </Text>
        <Text className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Admin access required
        </Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
        <Text className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, onPress: () => router.push('/admin/users' as any) },
    { label: 'Active Agents', value: stats?.activeAgents || 0, icon: Award, onPress: () => router.push('/admin/agents' as any) },
    { label: 'Applications', value: stats?.totalApplications || 0, icon: FileText, onPress: () => router.push('/admin/applications' as any) },
    { label: 'Support', value: stats?.openTickets || 0, icon: HelpCircle, onPress: () => router.push('/admin/support' as any) },
  ];

  const quickActions = [
    { label: 'Users', icon: Users, href: '/admin/users' },
    { label: 'Applications', icon: FileText, href: '/admin/applications' },
    { label: 'Chats', icon: MessageCircle, href: '/(tabs)/chats' },
    { label: 'Analytics', icon: BarChart2, href: '/admin/analytics' },
  ];

  // Application pipeline data
  const pipeline = stats?.applicationsByStatus || {};
  const totalApps = stats?.totalApplications || 1;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="px-6 pt-2 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
              <ArrowLeft color={isDark ? '#fff' : '#000'} size={20} />
            </Pressable>
            <View>
              <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Admin Panel
              </Text>
              <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Dashboard
              </Text>
            </View>
          </View>
          <View className={`px-3 py-1.5 rounded-full ${isDark ? 'bg-[#1a1a1a]' : 'bg-black'}`}>
            <Text className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-white'}`}>
              ADMIN
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />
        }>

        {/* Stat Cards Grid */}
        <View className="px-6 mb-6">
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Animated.View key={card.label} entering={FadeIn.delay(100)} style={{ width: '48%' }}>
                  <Pressable
                    onPress={card.onPress}
                    className={`rounded-3xl border-2 p-4 shadow-sm ${
                      isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                    }`}>
                    <View className="flex-row items-center justify-between mb-3">
                      <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isDark ? 'bg-white' : 'bg-black'}`}>
                        <Icon color={isDark ? '#000' : '#fff'} size={20} />
                      </View>
                      <ChevronRight color={isDark ? '#444' : '#ccc'} size={16} />
                    </View>
                    <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                      {card.value}
                    </Text>
                    <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {card.label}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Application Pipeline */}
        <View className="px-6 mb-6">
          <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
            Application Pipeline
          </Text>
          <View className={`rounded-3xl border-2 p-4 ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
            {/* Progress Bar */}
            <View className="h-3 rounded-full overflow-hidden flex-row mb-4" style={{ backgroundColor: isDark ? '#333' : '#e5e7eb' }}>
              {Object.entries(pipeline).map(([status, count]) => {
                const width = ((count as number) / totalApps) * 100;
                if (width === 0) return null;
                return (
                  <View
                    key={status}
                    style={{
                      width: `${width}%`,
                      backgroundColor: STATUS_COLORS[status] || '#6b7280',
                    }}
                  />
                );
              })}
            </View>
            {/* Legend */}
            <View className="flex-row flex-wrap gap-x-4 gap-y-2">
              {Object.entries(pipeline).map(([status, count]) => (
                <View key={status} className="flex-row items-center">
                  <View
                    className="w-2.5 h-2.5 rounded-full mr-1.5"
                    style={{ backgroundColor: STATUS_COLORS[status] || '#6b7280' }}
                  />
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {STATUS_LABELS[status] || status} ({count as number})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Users by Role */}
        <View className="px-6 mb-6">
          <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
            Users by Role
          </Text>
          <View className={`rounded-3xl border-2 p-4 ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
            {Object.entries(stats?.usersByRole || {}).map(([role, count]) => {
              const total = stats?.totalUsers || 1;
              const pct = Math.round(((count as number) / total) * 100);
              return (
                <View key={role} className="mb-3 last:mb-0">
                  <View className="flex-row justify-between mb-1">
                    <Text className={`text-sm font-medium capitalize ${isDark ? 'text-white' : 'text-black'}`}>
                      {role}
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {count as number} ({pct}%)
                    </Text>
                  </View>
                  <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#333' : '#e5e7eb' }}>
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: role === 'admin' ? '#ef4444' : role === 'agent' ? '#3b82f6' : isDark ? '#fff' : '#000',
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Users */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Recent Users
            </Text>
            <Pressable onPress={() => router.push('/admin/users' as any)}>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>See All</Text>
            </Pressable>
          </View>
          {recentUsers.map((user) => {
            const initials = (user.displayName || 'U')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            return (
              <View
                key={user.uid}
                className={`flex-row items-center rounded-2xl border p-3 mb-2 ${
                  isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                }`}>
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-white' : 'bg-black'}`}>
                  <Text className={`text-sm font-bold ${isDark ? 'text-black' : 'text-white'}`}>{initials}</Text>
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`} numberOfLines={1}>
                    {user.displayName}
                  </Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
                <View className={`px-2 py-1 rounded-lg ${
                  user.role === 'admin'
                    ? 'bg-red-500/10'
                    : user.role === 'agent'
                    ? 'bg-blue-500/10'
                    : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                }`}>
                  <Text className={`text-[10px] font-semibold capitalize ${
                    user.role === 'admin'
                      ? 'text-red-500'
                      : user.role === 'agent'
                      ? 'text-blue-500'
                      : isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {user.role}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Top Agents */}
        {topAgents.length > 0 && (
          <View className="px-6 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Top Agents
              </Text>
              <Pressable onPress={() => router.push('/admin/agents' as any)}>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>See All</Text>
              </Pressable>
            </View>
            {topAgents.map((agent, idx) => (
              <View
                key={agent.uid}
                className={`flex-row items-center rounded-2xl border p-3 mb-2 ${
                  isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                }`}>
                <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isDark ? 'bg-white' : 'bg-black'}`}>
                  <Text className={`text-xs font-bold ${isDark ? 'text-black' : 'text-white'}`}>#{idx + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`} numberOfLines={1}>
                    {agent.displayName}
                  </Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`} numberOfLines={1}>
                    {agent.location || 'N/A'} · {agent.completedProjects || 0} projects
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className={`text-sm font-bold mr-1 ${isDark ? 'text-white' : 'text-black'}`}>
                    {agent.avgRating?.toFixed(1) || '0.0'}
                  </Text>
                  <Text className="text-yellow-500 text-xs">★</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Pressable
                  key={action.label}
                  onPress={() => router.push(action.href as any)}
                  style={{ width: '48%' }}
                  className={`rounded-2xl border-2 p-4 items-center ${
                    isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                  }`}>
                  <View className={`w-10 h-10 rounded-xl items-center justify-center mb-2 ${isDark ? 'bg-white' : 'bg-black'}`}>
                    <Icon color={isDark ? '#000' : '#fff'} size={18} />
                  </View>
                  <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
