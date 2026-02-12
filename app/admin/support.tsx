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
  X,
  Eye,
  Edit3,
  Send,
  HelpCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  Calendar,
} from '@/components/Icons';
import {
  subscribeToSupportQueries,
  updateSupportStatus,
  addAdminResponse,
} from '@/src/services/adminFirestore';
import type { SupportQuery, SupportStatus } from '@/src/types/support';
import { useAuthStore } from '@/src/store/authStore';

const STATUS_COLORS: Record<string, string> = {
  open: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#22c55e',
  closed: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_ICONS: Record<string, any> = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle,
  closed: X,
};

const CATEGORY_COLORS: Record<string, string> = {
  general: '#3b82f6',
  technical: '#8b5cf6',
  billing: '#22c55e',
  feedback: '#f59e0b',
};

export default function AdminSupportScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { userDoc } = useAuthStore();

  const [tickets, setTickets] = useState<SupportQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [selectedTicket, setSelectedTicket] = useState<SupportQuery | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSupportQueries((data) => {
      setTickets(data);
      setLoading(false);
      setRefreshing(false);
    });
    return () => unsubscribe();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Counts
  const counts = {
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };

  const formatDate = (ts: any) => {
    if (!ts) return 'N/A';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseText.trim()) return;
    setActionLoading(true);
    try {
      await addAdminResponse(selectedTicket.queryId, responseText.trim());
      setShowResponseModal(false);
      setResponseText('');
      Alert.alert('Success', 'Response sent');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send response');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (ticket: SupportQuery, status: SupportStatus) => {
    try {
      await updateSupportStatus(ticket.queryId, status);
      Alert.alert('Success', `Status updated to ${STATUS_LABELS[status]}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    }
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
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Support</Text>
          </View>
        </View>
      </View>

      {/* Status Summary */}
      <View className="px-6 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(counts).map(([status, count]) => {
            const Icon = STATUS_ICONS[status] || HelpCircle;
            return (
              <Pressable
                key={status}
                onPress={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                className={`mr-3 rounded-2xl border px-4 py-3 min-w-[80px] items-center ${
                  statusFilter === status
                    ? isDark ? 'bg-[#2a2a2a] border-white/20' : 'bg-gray-50 border-black/20'
                    : isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                }`}>
                <Icon color={STATUS_COLORS[status]} size={16} />
                <Text className="text-lg font-bold mt-1" style={{ color: STATUS_COLORS[status] }}>{count}</Text>
                <Text className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{STATUS_LABELS[status]}</Text>
              </Pressable>
            );
          })}
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
            placeholder="Search tickets..."
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

      {/* Ticket List */}
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
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
          </Text>

          {filteredTickets.map((ticket) => (
            <View
              key={ticket.queryId}
              className={`rounded-2xl border p-4 mb-3 ${
                isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
              }`}>
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1 mr-2">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`} numberOfLines={1}>
                    {ticket.subject}
                  </Text>
                  <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {ticket.name} · {ticket.email}
                  </Text>
                </View>
                <View className="flex-row gap-1.5">
                  <View className="px-2 py-1 rounded-lg" style={{ backgroundColor: `${CATEGORY_COLORS[ticket.category]}15` }}>
                    <Text className="text-[10px] font-semibold capitalize" style={{ color: CATEGORY_COLORS[ticket.category] }}>
                      {ticket.category}
                    </Text>
                  </View>
                  <View className="px-2 py-1 rounded-lg" style={{ backgroundColor: `${STATUS_COLORS[ticket.status]}15` }}>
                    <Text className="text-[10px] font-semibold" style={{ color: STATUS_COLORS[ticket.status] }}>
                      {STATUS_LABELS[ticket.status]}
                    </Text>
                  </View>
                </View>
              </View>

              <Text className={`text-xs leading-4 mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} numberOfLines={2}>
                {ticket.message}
              </Text>

              <Text className={`text-[10px] mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                {formatDate(ticket.createdAt)}
              </Text>

              {/* Actions */}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => { setSelectedTicket(ticket); setShowDetailModal(true); }}
                  className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${
                    isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                  }`}>
                  <Eye color={isDark ? '#aaa' : '#666'} size={14} />
                  <Text className={`text-xs font-medium ml-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>View</Text>
                </Pressable>
                <Pressable
                  onPress={() => { setSelectedTicket(ticket); setResponseText(''); setShowResponseModal(true); }}
                  className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${
                    isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                  }`}>
                  <Send color={isDark ? '#aaa' : '#666'} size={14} />
                  <Text className={`text-xs font-medium ml-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Respond</Text>
                </Pressable>
                {ticket.status === 'open' || ticket.status === 'in_progress' ? (
                  <Pressable
                    onPress={() => handleUpdateStatus(ticket, 'resolved')}
                    className="flex-1 flex-row items-center justify-center py-2 rounded-xl bg-green-500/10">
                    <CheckCircle color="#22c55e" size={14} />
                    <Text className="text-xs font-medium ml-1.5 text-green-500">Resolve</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => handleUpdateStatus(ticket, 'closed')}
                    className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${
                      isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                    }`}>
                    <X color={isDark ? '#aaa' : '#666'} size={14} />
                    <Text className={`text-xs font-medium ml-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Close</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={() => setShowDetailModal(false)} />
          <View className={`rounded-t-3xl p-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`} style={{ maxHeight: '75%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Ticket Details</Text>
              <Pressable onPress={() => setShowDetailModal(false)} className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                <X color={isDark ? '#fff' : '#000'} size={16} />
              </Pressable>
            </View>
            {selectedTicket && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status and Category badges */}
                <View className="flex-row gap-2 mb-4">
                  <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: `${CATEGORY_COLORS[selectedTicket.category]}15` }}>
                    <Text className="text-xs font-semibold capitalize" style={{ color: CATEGORY_COLORS[selectedTicket.category] }}>
                      {selectedTicket.category}
                    </Text>
                  </View>
                  <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[selectedTicket.status]}15` }}>
                    <Text className="text-xs font-semibold" style={{ color: STATUS_COLORS[selectedTicket.status] }}>
                      {STATUS_LABELS[selectedTicket.status]}
                    </Text>
                  </View>
                </View>

                {/* Subject */}
                <Text className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                  {selectedTicket.subject}
                </Text>

                {/* Submitter Info */}
                <View className={`flex-row items-center mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Mail color={isDark ? '#666' : '#999'} size={12} />
                  <Text className={`text-xs ml-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {selectedTicket.name} · {selectedTicket.email}
                  </Text>
                </View>
                <View className="flex-row items-center mb-4">
                  <Calendar color={isDark ? '#666' : '#999'} size={12} />
                  <Text className={`text-xs ml-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatDate(selectedTicket.createdAt)}
                  </Text>
                </View>

                {/* Message */}
                <Text className={`text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Message</Text>
                <View className={`p-4 rounded-2xl mb-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                  <Text className={`text-sm leading-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedTicket.message}
                  </Text>
                </View>

                {/* Admin Response */}
                {selectedTicket.adminResponse && (
                  <>
                    <Text className={`text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Admin Response</Text>
                    <View className={`p-4 rounded-2xl mb-4 border ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-black/5 border-black/10'}`}>
                      <Text className={`text-sm leading-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedTicket.adminResponse}
                      </Text>
                    </View>
                  </>
                )}

                {/* IDs */}
                <View className={`p-3 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                  <View className="flex-row justify-between mb-1">
                    <Text className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Ticket ID</Text>
                    <Text className={`text-[10px] font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selectedTicket.queryId}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>User ID</Text>
                    <Text className={`text-[10px] font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selectedTicket.uid}</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Response Modal */}
      <Modal visible={showResponseModal} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={() => setShowResponseModal(false)} />
          <View className={`rounded-t-3xl p-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Send Response</Text>
              <Pressable onPress={() => setShowResponseModal(false)} className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                <X color={isDark ? '#fff' : '#000'} size={16} />
              </Pressable>
            </View>
            {selectedTicket && (
              <View>
                <View className={`p-3 rounded-xl mb-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                  <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Replying to</Text>
                  <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>{selectedTicket.subject}</Text>
                </View>
                <TextInput
                  className={`rounded-xl border p-4 text-sm min-h-[120px] ${
                    isDark ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-black'
                  }`}
                  placeholder="Type your response..."
                  placeholderTextColor={isDark ? '#555' : '#999'}
                  multiline
                  value={responseText}
                  onChangeText={setResponseText}
                  textAlignVertical="top"
                />
                <Pressable
                  onPress={handleSendResponse}
                  disabled={actionLoading || !responseText.trim()}
                  className={`mt-4 py-4 rounded-2xl items-center ${
                    actionLoading || !responseText.trim() ? 'bg-gray-500/30' : isDark ? 'bg-white' : 'bg-black'
                  }`}>
                  {actionLoading ? (
                    <ActivityIndicator color={isDark ? '#000' : '#fff'} />
                  ) : (
                    <Text className={`font-bold ${
                      !responseText.trim() ? 'text-gray-400' : isDark ? 'text-black' : 'text-white'
                    }`}>Send Response</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
