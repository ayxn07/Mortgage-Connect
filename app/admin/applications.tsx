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
  FileText,
  Users,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  Home,
  CreditCard,
  ChevronDown,
} from '@/components/Icons';
import {
  subscribeToApplications,
  updateApplicationStatus,
  assignAgentToApplication,
  fetchAllAgents,
} from '@/src/services/adminFirestore';
import type { MortgageApplication, ApplicationStatus } from '@/src/types/application';
import type { Agent } from '@/src/types/agent';
import { useAuthStore } from '@/src/store/authStore';

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

const ALL_STATUSES: ApplicationStatus[] = [
  'draft', 'submitted', 'pre_approval', 'property_valuation',
  'bank_approval', 'offer_letter', 'disbursement', 'rejected', 'completed',
];

export default function AdminApplicationsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { userDoc } = useAuthStore();

  const [applications, setApplications] = useState<MortgageApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [selectedApp, setSelectedApp] = useState<MortgageApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [detailTab, setDetailTab] = useState<'personal' | 'employment' | 'property' | 'financial' | 'docs'>('personal');
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('submitted');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToApplications((data) => {
      setApplications(data);
      setLoading(false);
      setRefreshing(false);
    });
    return () => unsubscribe();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      !searchQuery ||
      app.applicantIdentity?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicationId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Summary
  const counts = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'submitted' || a.status === 'pre_approval').length,
    approved: applications.filter((a) => ['offer_letter', 'disbursement', 'completed'].includes(a.status)).length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const formatDate = (ts: any) => {
    if (!ts) return 'N/A';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (val: number) => {
    if (!val) return 'AED 0';
    return `AED ${val.toLocaleString()}`;
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await updateApplicationStatus(selectedApp.applicationId, newStatus, adminNotes || undefined);
      setShowStatusModal(false);
      setAdminNotes('');
      Alert.alert('Success', 'Status updated');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const openAssignModal = async (app: MortgageApplication) => {
    setSelectedApp(app);
    setSelectedAgentId(app.agentId || '');
    setShowAssignModal(true);
    try {
      const agents = await fetchAllAgents();
      setAgentList(agents);
    } catch (err) {
      console.error('Failed to load agents:', err);
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedApp || !selectedAgentId) return;
    setActionLoading(true);
    try {
      await assignAgentToApplication(selectedApp.applicationId, selectedAgentId);
      setShowAssignModal(false);
      Alert.alert('Success', 'Agent assigned');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to assign agent');
    } finally {
      setActionLoading(false);
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
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Applications</Text>
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      <View className="px-6 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { label: 'Total', count: counts.total, color: isDark ? '#fff' : '#000' },
            { label: 'Pending', count: counts.pending, color: '#f59e0b' },
            { label: 'Approved', count: counts.approved, color: '#22c55e' },
            { label: 'Rejected', count: counts.rejected, color: '#ef4444' },
          ].map((item) => (
            <View
              key={item.label}
              className={`mr-3 rounded-2xl border px-4 py-3 min-w-[80px] items-center ${
                isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
              }`}>
              <Text className="text-xl font-bold" style={{ color: item.color }}>{item.count}</Text>
              <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</Text>
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
            placeholder="Search by name or ID..."
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

      {/* Status Filter */}
      <View className="px-6 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Pressable
            onPress={() => setStatusFilter('all')}
            className={`mr-2 px-4 py-2 rounded-full ${
              statusFilter === 'all'
                ? isDark ? 'bg-white' : 'bg-black'
                : isDark ? 'bg-[#1a1a1a]' : 'bg-white'
            }`}>
            <Text className={`text-xs font-semibold ${
              statusFilter === 'all'
                ? isDark ? 'text-black' : 'text-white'
                : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>All</Text>
          </Pressable>
          {ALL_STATUSES.map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatusFilter(s)}
              className={`mr-2 px-3 py-2 rounded-full ${
                statusFilter === s
                  ? isDark ? 'bg-white' : 'bg-black'
                  : isDark ? 'bg-[#1a1a1a]' : 'bg-white'
              }`}>
              <Text className={`text-xs font-semibold ${
                statusFilter === s
                  ? isDark ? 'text-black' : 'text-white'
                  : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>{STATUS_LABELS[s]}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Application List */}
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
            {filteredApps.length} application{filteredApps.length !== 1 ? 's' : ''}
          </Text>

          {filteredApps.map((app) => (
            <View
              key={app.applicationId}
              className={`rounded-2xl border p-4 mb-3 ${
                isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
              }`}>
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`} numberOfLines={1}>
                    {app.applicantIdentity?.fullName || 'Unknown'}
                  </Text>
                  <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {app.propertyDetails?.propertyType || 'N/A'} · {app.propertyDetails?.locationArea || 'N/A'}
                  </Text>
                </View>
                <View className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: `${STATUS_COLORS[app.status]}15` }}>
                  <Text className="text-[10px] font-semibold" style={{ color: STATUS_COLORS[app.status] }}>
                    {STATUS_LABELS[app.status] || app.status}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-3">
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  {formatCurrency(app.mortgagePreferences?.propertyValue || app.propertyDetails?.purchasePrice || 0)}
                </Text>
                <Text className={`text-xs ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {formatDate(app.createdAt)}
                </Text>
              </View>

              {/* Actions */}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => { setSelectedApp(app); setDetailTab('personal'); setShowDetailModal(true); }}
                  className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${
                    isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                  }`}>
                  <Eye color={isDark ? '#aaa' : '#666'} size={14} />
                  <Text className={`text-xs font-medium ml-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>View</Text>
                </Pressable>
                <Pressable
                  onPress={() => { setSelectedApp(app); setNewStatus(app.status); setShowStatusModal(true); }}
                  className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${
                    isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                  }`}>
                  <Edit3 color={isDark ? '#aaa' : '#666'} size={14} />
                  <Text className={`text-xs font-medium ml-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Status</Text>
                </Pressable>
                <Pressable
                  onPress={() => openAssignModal(app)}
                  className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${
                    isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                  }`}>
                  <Users color={isDark ? '#aaa' : '#666'} size={14} />
                  <Text className={`text-xs font-medium ml-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Assign</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={() => setShowDetailModal(false)} />
          <View className={`rounded-t-3xl p-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`} style={{ maxHeight: '85%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Application Details</Text>
              <Pressable onPress={() => setShowDetailModal(false)} className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                <X color={isDark ? '#fff' : '#000'} size={16} />
              </Pressable>
            </View>

            {selectedApp && (
              <>
                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  {[
                    { key: 'personal' as const, label: 'Personal' },
                    { key: 'employment' as const, label: 'Employment' },
                    { key: 'property' as const, label: 'Property' },
                    { key: 'financial' as const, label: 'Financial' },
                    { key: 'docs' as const, label: 'Documents' },
                  ].map((tab) => (
                    <Pressable
                      key={tab.key}
                      onPress={() => setDetailTab(tab.key)}
                      className={`mr-2 px-4 py-2 rounded-full ${
                        detailTab === tab.key
                          ? isDark ? 'bg-white' : 'bg-black'
                          : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                      }`}>
                      <Text className={`text-xs font-semibold ${
                        detailTab === tab.key
                          ? isDark ? 'text-black' : 'text-white'
                          : isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>{tab.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                  {/* Personal Tab */}
                  {detailTab === 'personal' && (
                    <View>
                      {[
                        { label: 'Full Name', value: selectedApp.applicantIdentity?.fullName },
                        { label: 'Nationality', value: selectedApp.applicantIdentity?.nationality },
                        { label: 'Date of Birth', value: selectedApp.applicantIdentity?.dateOfBirth },
                        { label: 'Gender', value: selectedApp.applicantIdentity?.gender },
                        { label: 'Emirates ID', value: selectedApp.applicantIdentity?.emiratesIdNumber },
                        { label: 'Passport', value: selectedApp.applicantIdentity?.passportNumber },
                        { label: 'Email', value: selectedApp.contactResidency?.email },
                        { label: 'Mobile', value: selectedApp.contactResidency?.mobileNumber },
                        { label: 'Address', value: selectedApp.contactResidency?.currentAddress },
                        { label: 'Emirate', value: selectedApp.contactResidency?.emirate },
                        { label: 'Years in UAE', value: selectedApp.contactResidency?.yearsInUAE?.toString() },
                      ].map((item) => (
                        <View key={item.label} className={`flex-row justify-between py-2.5 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                          <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</Text>
                          <Text className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>{item.value || 'N/A'}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Employment Tab */}
                  {detailTab === 'employment' && (
                    <View>
                      <View className={`flex-row justify-between py-2.5 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                        <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Type</Text>
                        <Text className={`text-xs font-medium capitalize ${isDark ? 'text-white' : 'text-black'}`}>
                          {selectedApp.employmentIncome?.employmentType || 'N/A'}
                        </Text>
                      </View>
                      {selectedApp.employmentIncome?.employmentType === 'salaried' && selectedApp.employmentIncome?.salaried && (
                        <>
                          {[
                            { label: 'Company', value: selectedApp.employmentIncome.salaried.employerName },
                            { label: 'Job Title', value: selectedApp.employmentIncome.salaried.jobTitle },
                            { label: 'Gross Salary', value: formatCurrency(selectedApp.employmentIncome.salaried.monthlyGrossSalary) },
                            { label: 'Net Salary', value: formatCurrency(selectedApp.employmentIncome.salaried.monthlyNetSalary) },
                            { label: 'Bank', value: selectedApp.employmentIncome.salaried.salaryTransferBank },
                          ].map((item) => (
                            <View key={item.label} className={`flex-row justify-between py-2.5 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</Text>
                              <Text className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>{item.value || 'N/A'}</Text>
                            </View>
                          ))}
                        </>
                      )}
                      {selectedApp.employmentIncome?.employmentType === 'self_employed' && selectedApp.employmentIncome?.selfEmployed && (
                        <>
                          {[
                            { label: 'Company', value: selectedApp.employmentIncome.selfEmployed.companyName },
                            { label: 'Trade License', value: selectedApp.employmentIncome.selfEmployed.tradeLicenseNumber },
                            { label: 'Monthly Income', value: formatCurrency(selectedApp.employmentIncome.selfEmployed.monthlyAverageIncome) },
                            { label: 'Years', value: selectedApp.employmentIncome.selfEmployed.companyAgeYears?.toString() },
                          ].map((item) => (
                            <View key={item.label} className={`flex-row justify-between py-2.5 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</Text>
                              <Text className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>{item.value || 'N/A'}</Text>
                            </View>
                          ))}
                        </>
                      )}
                    </View>
                  )}

                  {/* Property Tab */}
                  {detailTab === 'property' && (
                    <View>
                      {[
                        { label: 'Type', value: selectedApp.propertyDetails?.propertyType },
                        { label: 'Developer', value: selectedApp.propertyDetails?.developerName },
                        { label: 'Project', value: selectedApp.propertyDetails?.projectName },
                        { label: 'Area', value: selectedApp.propertyDetails?.locationArea },
                        { label: 'Price', value: formatCurrency(selectedApp.propertyDetails?.purchasePrice || 0) },
                        { label: 'Size', value: `${selectedApp.propertyDetails?.unitSizeSqft || 0} sqft` },
                        { label: 'Bedrooms', value: selectedApp.propertyDetails?.numberOfBedrooms?.toString() },
                        { label: 'Loan Amount', value: formatCurrency(selectedApp.mortgagePreferences?.preferredLoanAmount || 0) },
                        { label: 'Down Payment', value: `${selectedApp.mortgagePreferences?.downPaymentPercent || 0}%` },
                        { label: 'Tenure', value: `${selectedApp.mortgagePreferences?.loanTenureYears || 0} years` },
                        { label: 'Interest Type', value: selectedApp.mortgagePreferences?.interestType },
                      ].map((item) => (
                        <View key={item.label} className={`flex-row justify-between py-2.5 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                          <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</Text>
                          <Text className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>{item.value || 'N/A'}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Financial Tab */}
                  {detailTab === 'financial' && (
                    <View>
                      <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Eligibility</Text>
                      {[
                        { label: 'Eligible Amount', value: formatCurrency(selectedApp.eligibilityResults?.eligibleLoanAmount || 0) },
                        { label: 'Estimated EMI', value: formatCurrency(selectedApp.eligibilityResults?.estimatedEMI || 0) },
                        { label: 'DBR', value: `${selectedApp.eligibilityResults?.dbrPercent?.toFixed(1) || 0}%` },
                        { label: 'LTV', value: `${selectedApp.eligibilityResults?.ltvPercent?.toFixed(1) || 0}%` },
                      ].map((item) => (
                        <View key={item.label} className={`flex-row justify-between py-2.5 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                          <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</Text>
                          <Text className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>{item.value}</Text>
                        </View>
                      ))}

                      <Text className={`text-sm font-semibold mt-4 mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Obligations</Text>
                      <View className={`flex-row justify-between py-2.5 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                        <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total Monthly EMI</Text>
                        <Text className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                          {formatCurrency(selectedApp.financialObligations?.totalMonthlyEMI || 0)}
                        </Text>
                      </View>

                      {selectedApp.notes && (
                        <View className="mt-4">
                          <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Admin Notes</Text>
                          <View className={`p-3 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                            <Text className={`text-xs leading-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selectedApp.notes}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Documents Tab */}
                  {detailTab === 'docs' && (
                    <View>
                      {selectedApp.documentUploads?.documents?.length > 0 ? (
                        selectedApp.documentUploads.documents.map((doc) => (
                          <View key={doc.id} className={`flex-row items-center p-3 rounded-xl mb-2 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                            <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`}>
                              <FileText color={isDark ? '#aaa' : '#666'} size={14} />
                            </View>
                            <View className="flex-1">
                              <Text className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`} numberOfLines={1}>{doc.fileName}</Text>
                              <Text className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {doc.category} · {(doc.fileSize / 1024).toFixed(0)} KB
                              </Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No documents uploaded</Text>
                      )}
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Update Status Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={() => setShowStatusModal(false)} />
          <View className={`rounded-t-3xl p-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`} style={{ maxHeight: '70%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Update Status</Text>
              <Pressable onPress={() => setShowStatusModal(false)} className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                <X color={isDark ? '#fff' : '#000'} size={16} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {ALL_STATUSES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setNewStatus(s)}
                  className={`flex-row items-center p-3 rounded-xl mb-2 border ${
                    newStatus === s
                      ? isDark ? 'border-white bg-[#2a2a2a]' : 'border-black bg-gray-50'
                      : isDark ? 'border-[#2a2a2a] bg-[#0a0a0a]' : 'border-gray-200'
                  }`}>
                  <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: STATUS_COLORS[s] }} />
                  <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>{STATUS_LABELS[s]}</Text>
                  {newStatus === s && (
                    <View className={`ml-auto w-5 h-5 rounded-full items-center justify-center ${isDark ? 'bg-white' : 'bg-black'}`}>
                      <Text className={`text-xs font-bold ${isDark ? 'text-black' : 'text-white'}`}>✓</Text>
                    </View>
                  )}
                </Pressable>
              ))}

              {/* Admin Notes */}
              <Text className={`text-sm font-semibold mt-2 mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Admin Notes (optional)</Text>
              <TextInput
                className={`rounded-xl border p-3 text-sm min-h-[80px] ${
                  isDark ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-black'
                }`}
                placeholder="Add notes..."
                placeholderTextColor={isDark ? '#555' : '#999'}
                multiline
                value={adminNotes}
                onChangeText={setAdminNotes}
              />

              <Pressable
                onPress={handleUpdateStatus}
                disabled={actionLoading}
                className={`mt-4 py-4 rounded-2xl items-center ${isDark ? 'bg-white' : 'bg-black'}`}>
                {actionLoading ? (
                  <ActivityIndicator color={isDark ? '#000' : '#fff'} />
                ) : (
                  <Text className={`font-bold ${isDark ? 'text-black' : 'text-white'}`}>Update Status</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Assign Agent Modal */}
      <Modal visible={showAssignModal} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={() => setShowAssignModal(false)} />
          <View className={`rounded-t-3xl p-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`} style={{ maxHeight: '60%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Assign Agent</Text>
              <Pressable onPress={() => setShowAssignModal(false)} className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                <X color={isDark ? '#fff' : '#000'} size={16} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {agentList.length === 0 ? (
                <ActivityIndicator color={isDark ? '#fff' : '#000'} />
              ) : (
                agentList.map((agent) => (
                  <Pressable
                    key={agent.uid}
                    onPress={() => setSelectedAgentId(agent.uid)}
                    className={`flex-row items-center p-3 rounded-xl mb-2 border ${
                      selectedAgentId === agent.uid
                        ? isDark ? 'border-white bg-[#2a2a2a]' : 'border-black bg-gray-50'
                        : isDark ? 'border-[#2a2a2a] bg-[#0a0a0a]' : 'border-gray-200'
                    }`}>
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-white' : 'bg-black'}`}>
                      <Text className={`text-xs font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                        {(agent.displayName || 'A')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>{agent.displayName}</Text>
                      <Text className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{agent.location || 'N/A'}</Text>
                    </View>
                    {selectedAgentId === agent.uid && (
                      <View className={`w-5 h-5 rounded-full items-center justify-center ${isDark ? 'bg-white' : 'bg-black'}`}>
                        <Text className={`text-xs font-bold ${isDark ? 'text-black' : 'text-white'}`}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                ))
              )}
              <Pressable
                onPress={handleAssignAgent}
                disabled={actionLoading || !selectedAgentId}
                className={`mt-4 py-4 rounded-2xl items-center ${
                  actionLoading || !selectedAgentId ? 'bg-gray-500/30' : isDark ? 'bg-white' : 'bg-black'
                }`}>
                {actionLoading ? (
                  <ActivityIndicator color={isDark ? '#000' : '#fff'} />
                ) : (
                  <Text className={`font-bold ${
                    !selectedAgentId ? 'text-gray-400' : isDark ? 'text-black' : 'text-white'
                  }`}>Assign Agent</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
