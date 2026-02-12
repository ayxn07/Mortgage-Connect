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
  Users,
  Search,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit3,
  Trash2,
  X,
  Mail,
  Phone,
  Calendar,
  Shield,
} from '@/components/Icons';
import {
  subscribeToUsers,
  updateUserRole,
  deleteUser,
} from '@/src/services/adminFirestore';
import type { User } from '@/src/types/user';
import type { UserRole } from '@/src/types/user';
import { useAuthStore } from '@/src/store/authStore';

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: 'bg-red-500/10', text: 'text-red-500' },
  agent: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  user: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
};

export default function AdminUsersScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { userDoc } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToUsers((data) => {
      setUsers(data);
      setLoading(false);
      setRefreshing(false);
    });
    return () => unsubscribe();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Counts
  const counts = {
    total: users.length,
    user: users.filter((u) => u.role === 'user').length,
    agent: users.filter((u) => u.role === 'agent').length,
    admin: users.filter((u) => u.role === 'admin').length,
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await updateUserRole(selectedUser.uid, newRole);
      setShowRoleModal(false);
      Alert.alert('Success', `Role updated to ${newRole}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await deleteUser(selectedUser.uid);
      setShowDeleteModal(false);
      Alert.alert('Success', 'User deleted');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

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
            <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Admin Panel
            </Text>
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Users
            </Text>
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      <View className="px-6 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { label: 'Total', count: counts.total, color: isDark ? '#fff' : '#000' },
            { label: 'Users', count: counts.user, color: '#6b7280' },
            { label: 'Agents', count: counts.agent, color: '#3b82f6' },
            { label: 'Admins', count: counts.admin, color: '#ef4444' },
          ].map((item) => (
            <View
              key={item.label}
              className={`mr-3 rounded-2xl border px-4 py-3 min-w-[80px] items-center ${
                isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
              }`}>
              <Text className="text-xl font-bold" style={{ color: item.color }}>
                {item.count}
              </Text>
              <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {item.label}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Search */}
      <View className="px-6 mb-3">
        <View className={`flex-row items-center rounded-2xl border px-4 py-3 ${
          isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
        }`}>
          <Search color={isDark ? '#666' : '#999'} size={18} />
          <TextInput
            className={`flex-1 ml-3 text-sm ${isDark ? 'text-white' : 'text-black'}`}
            placeholder="Search by name or email..."
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

      {/* Role Filter */}
      <View className="px-6 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'user', 'agent', 'admin'].map((role) => (
            <Pressable
              key={role}
              onPress={() => setRoleFilter(role)}
              className={`mr-2 px-4 py-2 rounded-full ${
                roleFilter === role
                  ? isDark ? 'bg-white' : 'bg-black'
                  : isDark ? 'bg-[#1a1a1a]' : 'bg-white'
              }`}>
              <Text className={`text-sm font-semibold capitalize ${
                roleFilter === role
                  ? isDark ? 'text-black' : 'text-white'
                  : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {role === 'all' ? 'All' : role}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* User List */}
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
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </Text>
          {filteredUsers.map((user) => {
            const initials = (user.displayName || 'U')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            const roleStyle = ROLE_COLORS[user.role] || ROLE_COLORS.user;
            return (
              <View
                key={user.uid}
                className={`rounded-2xl border p-4 mb-3 ${
                  isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                }`}>
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-white' : 'bg-black'}`}>
                    <Text className={`font-bold ${isDark ? 'text-black' : 'text-white'}`}>{initials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`} numberOfLines={1}>
                      {user.displayName}
                    </Text>
                    <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                  <View className={`px-2.5 py-1 rounded-lg ${roleStyle.bg}`}>
                    <Text className={`text-[10px] font-semibold capitalize ${roleStyle.text}`}>
                      {user.role}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row mt-3 gap-2">
                  <Pressable
                    onPress={() => { setSelectedUser(user); setShowDetailModal(true); }}
                    className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${
                      isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                    }`}>
                    <Eye color={isDark ? '#aaa' : '#666'} size={14} />
                    <Text className={`text-xs font-medium ml-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>View</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { setSelectedUser(user); setNewRole(user.role); setShowRoleModal(true); }}
                    className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${
                      isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                    }`}>
                    <Edit3 color={isDark ? '#aaa' : '#666'} size={14} />
                    <Text className={`text-xs font-medium ml-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Role</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                    className="flex-1 flex-row items-center justify-center py-2 rounded-xl bg-red-500/10">
                    <Trash2 color="#ef4444" size={14} />
                    <Text className="text-xs font-medium ml-1.5 text-red-500">Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* View Details Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={() => setShowDetailModal(false)} />
          <View className={`rounded-t-3xl p-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`} style={{ maxHeight: '70%' }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>User Details</Text>
              <Pressable onPress={() => setShowDetailModal(false)} className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                <X color={isDark ? '#fff' : '#000'} size={16} />
              </Pressable>
            </View>
            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* User Avatar */}
                <View className="items-center mb-6">
                  <View className={`w-20 h-20 rounded-full items-center justify-center mb-3 ${isDark ? 'bg-white' : 'bg-black'}`}>
                    <Text className={`text-2xl font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                      {(selectedUser.displayName || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </Text>
                  </View>
                  <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>{selectedUser.displayName}</Text>
                  <View className={`px-3 py-1 rounded-full mt-1.5 ${ROLE_COLORS[selectedUser.role]?.bg}`}>
                    <Text className={`text-xs font-semibold capitalize ${ROLE_COLORS[selectedUser.role]?.text}`}>{selectedUser.role}</Text>
                  </View>
                </View>

                {/* Details */}
                {[
                  { icon: Mail, label: 'Email', value: selectedUser.email },
                  { icon: Phone, label: 'Phone', value: selectedUser.phone || 'Not provided' },
                  { icon: Calendar, label: 'Joined', value: formatDate(selectedUser.createdAt) },
                  { icon: Shield, label: 'UID', value: selectedUser.uid },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <View key={item.label} className={`flex-row items-center p-3 rounded-xl mb-2 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                      <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`}>
                        <Icon color={isDark ? '#aaa' : '#666'} size={14} />
                      </View>
                      <View className="flex-1">
                        <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</Text>
                        <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`} numberOfLines={1}>{item.value}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Change Role Modal */}
      <Modal visible={showRoleModal} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={() => setShowRoleModal(false)} />
          <View className={`rounded-t-3xl p-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Change Role</Text>
              <Pressable onPress={() => setShowRoleModal(false)} className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                <X color={isDark ? '#fff' : '#000'} size={16} />
              </Pressable>
            </View>
            {selectedUser && (
              <View>
                <Text className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Changing role for {selectedUser.displayName}
                </Text>
                {(['user', 'agent', 'admin'] as UserRole[]).map((role) => (
                  <Pressable
                    key={role}
                    onPress={() => setNewRole(role)}
                    className={`flex-row items-center p-4 rounded-2xl mb-2 border ${
                      newRole === role
                        ? isDark ? 'border-white bg-[#2a2a2a]' : 'border-black bg-gray-50'
                        : isDark ? 'border-[#2a2a2a] bg-[#0a0a0a]' : 'border-gray-200 bg-white'
                    }`}>
                    <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      newRole === role
                        ? isDark ? 'border-white' : 'border-black'
                        : isDark ? 'border-[#444]' : 'border-gray-300'
                    }`}>
                      {newRole === role && (
                        <View className={`w-3 h-3 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />
                      )}
                    </View>
                    <Text className={`capitalize font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{role}</Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={handleChangeRole}
                  disabled={actionLoading || newRole === selectedUser.role}
                  className={`mt-4 py-4 rounded-2xl items-center ${
                    actionLoading || newRole === selectedUser.role
                      ? 'bg-gray-500/30'
                      : isDark ? 'bg-white' : 'bg-black'
                  }`}>
                  {actionLoading ? (
                    <ActivityIndicator color={isDark ? '#000' : '#fff'} />
                  ) : (
                    <Text className={`font-bold ${
                      actionLoading || newRole === selectedUser.role
                        ? 'text-gray-400'
                        : isDark ? 'text-black' : 'text-white'
                    }`}>
                      Update Role
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal visible={showDeleteModal} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={() => setShowDeleteModal(false)} />
          <View className={`rounded-t-3xl p-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Delete User</Text>
              <Pressable onPress={() => setShowDeleteModal(false)} className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                <X color={isDark ? '#fff' : '#000'} size={16} />
              </Pressable>
            </View>
            {selectedUser && (
              <View>
                <Text className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Are you sure you want to delete this user?
                </Text>
                <View className={`p-4 rounded-2xl mb-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{selectedUser.displayName}</Text>
                  <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{selectedUser.email}</Text>
                </View>
                <Text className="text-sm text-red-500 mb-4">This action cannot be undone.</Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setShowDeleteModal(false)}
                    className={`flex-1 py-4 rounded-2xl items-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                    <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleDeleteUser}
                    disabled={actionLoading}
                    className="flex-1 py-4 rounded-2xl items-center bg-red-500">
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="font-bold text-white">Delete</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
