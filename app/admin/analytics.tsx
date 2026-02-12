import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Award, FileText, Star, TrendingUp, MapPin } from '@/components/Icons';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import {
  fetchEnhancedDashboardStats,
  fetchAllAgents,
  fetchAllSupportQueries,
  type EnhancedDashboardStats,
} from '@/src/services/adminFirestore';
import type { Agent } from '@/src/types/agent';
import type { SupportQuery } from '@/src/types/support';
import { useAuthStore } from '@/src/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUS_COLORS: Record<string, string> = {
  draft: '#6b7280',
  submitted: '#f59e0b',
  pre_approval: '#3b82f6',
  property_valuation: '#8b5cf6',
  bank_approval: '#06b6d4',
  offer_letter: '#10b981',
  disbursement: '#22c55e',
  rejected: '#ef4444',
  completed: '#059669',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  pre_approval: 'Pre-Approval',
  property_valuation: 'Valuation',
  bank_approval: 'Bank Approval',
  offer_letter: 'Offer Letter',
  disbursement: 'Disbursement',
  rejected: 'Rejected',
  completed: 'Completed',
};

const ROLE_COLORS: Record<string, string> = {
  user: '#6b7280',
  agent: '#3b82f6',
  admin: '#ef4444',
};

const CATEGORY_COLORS: Record<string, string> = {
  general: '#3b82f6',
  technical: '#8b5cf6',
  billing: '#22c55e',
  feedback: '#f59e0b',
};

export default function AdminAnalyticsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { userDoc } = useAuthStore();

  const [stats, setStats] = useState<EnhancedDashboardStats | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [supportQueries, setSupportQueries] = useState<SupportQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsData, agentsData, supportData] = await Promise.all([
        fetchEnhancedDashboardStats(),
        fetchAllAgents(),
        fetchAllSupportQueries(),
      ]);
      setStats(statsData);
      setAgents(agentsData);
      setSupportQueries(supportData);
    } catch (err) {
      console.error('[AdminAnalytics] Failed:', err);
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

  if (userDoc?.role !== 'admin') {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Access Denied</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
        <Text className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading analytics...</Text>
      </SafeAreaView>
    );
  }

  // Prepare pie chart data for application statuses
  const appStatusPieData = Object.entries(stats?.applicationsByStatus || {})
    .filter(([_, count]) => (count as number) > 0)
    .map(([status, count]) => ({
      value: count as number,
      color: STATUS_COLORS[status] || '#6b7280',
      text: `${count}`,
      label: STATUS_LABELS[status] || status,
    }));

  // Prepare pie chart data for user roles
  const rolePieData = Object.entries(stats?.usersByRole || {})
    .filter(([_, count]) => (count as number) > 0)
    .map(([role, count]) => ({
      value: count as number,
      color: ROLE_COLORS[role] || '#6b7280',
      text: `${count}`,
      label: role,
    }));

  // Support categories bar chart
  const categoryCounts: Record<string, number> = {};
  supportQueries.forEach((q) => {
    categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
  });
  const categoryBarData = Object.entries(categoryCounts).map(([cat, count]) => ({
    value: count,
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    frontColor: CATEGORY_COLORS[cat] || '#6b7280',
  }));

  // Top agents
  const topAgents = [...agents]
    .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
    .slice(0, 5);

  // Compute total property value
  // This is an approximation based on applications
  const totalPropertyValue = stats?.totalApplications
    ? (stats.totalApplications * 1500000) / 1000000
    : 0;

  const chartWidth = SCREEN_WIDTH - 80;

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
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Analytics</Text>
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

        {/* Key Metrics */}
        <View className="px-6 mb-6">
          <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>Key Metrics</Text>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {[
              { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users },
              { label: 'Active Agents', value: stats?.activeAgents || 0, icon: Award },
              { label: 'Applications', value: stats?.totalApplications || 0, icon: FileText },
              { label: 'Total Chats', value: stats?.totalChats || 0, icon: TrendingUp },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <View
                  key={item.label}
                  style={{ width: '48%' }}
                  className={`rounded-2xl border-2 p-4 ${
                    isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                  }`}>
                  <View className={`w-10 h-10 rounded-xl items-center justify-center mb-2 ${isDark ? 'bg-white' : 'bg-black'}`}>
                    <Icon color={isDark ? '#000' : '#fff'} size={18} />
                  </View>
                  <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{item.value}</Text>
                  <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Application Status Pie Chart */}
        {appStatusPieData.length > 0 && (
          <View className="px-6 mb-6">
            <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>Application Status</Text>
            <View className={`rounded-3xl border-2 p-4 ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
              <View className="items-center mb-4">
                <PieChart
                  data={appStatusPieData}
                  donut
                  radius={80}
                  innerRadius={50}
                  innerCircleColor={isDark ? '#1a1a1a' : '#fff'}
                  centerLabelComponent={() => (
                    <View className="items-center">
                      <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                        {stats?.totalApplications || 0}
                      </Text>
                      <Text className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total</Text>
                    </View>
                  )}
                />
              </View>
              <View className="flex-row flex-wrap gap-x-4 gap-y-2">
                {appStatusPieData.map((item) => (
                  <View key={item.label} className="flex-row items-center">
                    <View className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: item.color }} />
                    <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.label} ({item.value})
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* User Roles Pie Chart */}
        {rolePieData.length > 0 && (
          <View className="px-6 mb-6">
            <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>User Roles</Text>
            <View className={`rounded-3xl border-2 p-4 ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
              <View className="items-center mb-4">
                <PieChart
                  data={rolePieData}
                  donut
                  radius={80}
                  innerRadius={50}
                  innerCircleColor={isDark ? '#1a1a1a' : '#fff'}
                  centerLabelComponent={() => (
                    <View className="items-center">
                      <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                        {stats?.totalUsers || 0}
                      </Text>
                      <Text className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Users</Text>
                    </View>
                  )}
                />
              </View>
              <View className="flex-row flex-wrap gap-x-4 gap-y-2">
                {rolePieData.map((item) => (
                  <View key={item.label} className="flex-row items-center">
                    <View className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: item.color }} />
                    <Text className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.label} ({item.value})
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Support Categories Bar Chart */}
        {categoryBarData.length > 0 && (
          <View className="px-6 mb-6">
            <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>Support Categories</Text>
            <View className={`rounded-3xl border-2 p-4 ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
              <BarChart
                data={categoryBarData}
                barWidth={40}
                spacing={24}
                noOfSections={4}
                barBorderRadius={8}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor={isDark ? '#333' : '#e5e7eb'}
                yAxisTextStyle={{ color: isDark ? '#666' : '#999', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: isDark ? '#666' : '#999', fontSize: 10 }}
                width={chartWidth - 40}
                height={150}
                isAnimated
              />
            </View>
          </View>
        )}

        {/* Top Rated Agents */}
        {topAgents.length > 0 && (
          <View className="px-6 mb-6">
            <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>Top Rated Agents</Text>
            <View className={`rounded-3xl border-2 p-4 ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
              {topAgents.map((agent, idx) => (
                <View
                  key={agent.uid}
                  className={`flex-row items-center py-3 ${
                    idx < topAgents.length - 1 ? `border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}` : ''
                  }`}>
                  <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${
                    idx === 0 ? 'bg-yellow-500/20' : idx === 1 ? 'bg-gray-300/20' : idx === 2 ? 'bg-orange-500/20' : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                  }`}>
                    <Text className={`text-xs font-bold ${
                      idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-500' : isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>#{idx + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`} numberOfLines={1}>
                      {agent.displayName}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <MapPin color={isDark ? '#666' : '#999'} size={10} />
                      <Text className={`text-[10px] ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {agent.location || 'N/A'} · {agent.completedProjects || 0} projects
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Star color="#f59e0b" size={14} />
                    <Text className={`text-sm font-bold ml-1 ${isDark ? 'text-white' : 'text-black'}`}>
                      {agent.avgRating?.toFixed(1) || '0.0'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
