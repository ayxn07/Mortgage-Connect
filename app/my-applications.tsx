import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';
import { useApplicationStore } from '@/src/store/applicationStore';
import { loadDraftsLocally, deleteDraftLocally, type ApplicationDraft } from '@/src/utils/draftStorage';
import type { MortgageApplication, ApplicationStatus } from '@/src/types';

// ---------- Draft Card ----------
function DraftCard({
  draft,
  isDark,
  onContinue,
  onDelete,
}: {
  draft: ApplicationDraft;
  isDark: boolean;
  onContinue: () => void;
  onDelete: () => void;
}) {
  const lastSavedDate = new Date(draft.lastSaved);
  const timeAgo = getTimeAgo(lastSavedDate);
  const progressPercent = Math.round((draft.currentStep / 9) * 100);

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <View
        className={`rounded-3xl border mb-4 overflow-hidden ${
          isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-100'
        }`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}>
        {/* Header */}
        <View className="p-5">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center mb-1">
                <Feather name="edit-3" size={16} color={isDark ? '#888' : '#666'} />
                <Text className={`text-base font-bold ml-2 ${isDark ? 'text-white' : 'text-black'}`}>
                  Draft Application
                </Text>
              </View>
              <Text className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                Last saved {timeAgo}
              </Text>
            </View>

            {/* Draft Badge */}
            <View className="px-3 py-1.5 rounded-xl bg-gray-500/10">
              <Text className="text-xs font-semibold text-gray-500">
                Draft
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Progress
              </Text>
              <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {progressPercent}%
              </Text>
            </View>
            <View className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
              <View 
                className={`h-full ${isDark ? 'bg-white' : 'bg-black'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={onContinue}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-2xl ${
                isDark ? 'bg-white' : 'bg-black'
              }`}>
              <Feather name="arrow-right" size={16} color={isDark ? '#000' : '#fff'} />
              <Text className={`text-sm font-bold ml-2 ${isDark ? 'text-black' : 'text-white'}`}>
                Continue
              </Text>
            </Pressable>
            <Pressable
              onPress={onDelete}
              className={`px-4 py-3 rounded-2xl border ${
                isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
              }`}>
              <Feather name="trash-2" size={16} color="#ef4444" />
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------- Status helpers ----------
const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  draft: {
    label: 'Draft',
    color: '#6b7280',
    bgColor: 'bg-gray-500/10',
    icon: 'edit-3',
  },
  submitted: {
    label: 'Submitted',
    color: '#3b82f6',
    bgColor: 'bg-blue-500/10',
    icon: 'send',
  },
  pre_approval: {
    label: 'Pre-Approval',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/10',
    icon: 'file-text',
  },
  property_valuation: {
    label: 'Valuation',
    color: '#8b5cf6',
    bgColor: 'bg-purple-500/10',
    icon: 'search',
  },
  bank_approval: {
    label: 'Bank Approval',
    color: '#06b6d4',
    bgColor: 'bg-cyan-500/10',
    icon: 'shield',
  },
  offer_letter: {
    label: 'Offer Letter',
    color: '#10b981',
    bgColor: 'bg-emerald-500/10',
    icon: 'mail',
  },
  disbursement: {
    label: 'Disbursement',
    color: '#f97316',
    bgColor: 'bg-orange-500/10',
    icon: 'dollar-sign',
  },
  rejected: {
    label: 'Rejected',
    color: '#ef4444',
    bgColor: 'bg-red-500/10',
    icon: 'x-circle',
  },
  completed: {
    label: 'Completed',
    color: '#22c55e',
    bgColor: 'bg-green-500/10',
    icon: 'award',
  },
};

const STATUS_FLOW: ApplicationStatus[] = [
  'draft',
  'submitted',
  'pre_approval',
  'property_valuation',
  'bank_approval',
  'offer_letter',
  'disbursement',
  'completed',
];

function getStatusIndex(status: ApplicationStatus): number {
  if (status === 'rejected') return STATUS_FLOW.indexOf('bank_approval'); // rejected shown at bank approval level
  return STATUS_FLOW.indexOf(status);
}

function formatDate(timestamp: any): string {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(val: number): string {
  return val > 0 ? `AED ${val.toLocaleString('en-US')}` : '—';
}

// ---------- Timeline Step ----------
function TimelineStep({
  step,
  index,
  currentIndex,
  isLast,
  isDark,
  isRejected,
}: {
  step: { label: string; icon: string };
  index: number;
  currentIndex: number;
  isLast: boolean;
  isDark: boolean;
  isRejected: boolean;
}) {
  const isCompleted = index < currentIndex;
  const isCurrent = index === currentIndex;

  return (
    <View className="flex-row">
      {/* Dot and line */}
      <View className="items-center mr-4">
        <View
          className={`w-8 h-8 rounded-full items-center justify-center ${
            isCompleted
              ? 'bg-green-500'
              : isCurrent
              ? isRejected
                ? 'bg-red-500'
                : isDark
                ? 'bg-white'
                : 'bg-black'
              : isDark
              ? 'bg-[#1a1a1a]'
              : 'bg-gray-200'
          }`}>
          <Feather
            name={
              isCompleted
                ? 'check'
                : isCurrent && isRejected
                ? 'x'
                : (step.icon as any)
            }
            size={14}
            color={
              isCompleted || (isCurrent && isRejected)
                ? '#fff'
                : isCurrent
                ? isDark
                  ? '#000'
                  : '#fff'
                : isDark
                ? '#555'
                : '#999'
            }
          />
        </View>
        {!isLast && (
          <View
            className={`w-0.5 flex-1 min-h-[32px] ${
              isCompleted ? 'bg-green-500' : isDark ? 'bg-[#222]' : 'bg-gray-200'
            }`}
          />
        )}
      </View>

      {/* Label */}
      <View className={`pb-6 flex-1`}>
        <Text
          className={`text-sm font-medium ${
            isCurrent
              ? isRejected
                ? 'text-red-500'
                : isDark
                ? 'text-white'
                : 'text-black'
              : isCompleted
              ? 'text-green-500'
              : isDark
              ? 'text-gray-600'
              : 'text-gray-400'
          }`}>
          {step.label}
        </Text>
        {isCurrent && (
          <Text
            className={`text-xs mt-0.5 ${
              isRejected ? 'text-red-400' : isDark ? 'text-gray-500' : 'text-gray-500'
            }`}>
            {isRejected ? 'Application was rejected' : 'Current step'}
          </Text>
        )}
      </View>
    </View>
  );
}

// ---------- Application Card ----------
function ApplicationCard({
  application,
  isDark,
  onPress,
}: {
  application: MortgageApplication;
  isDark: boolean;
  onPress: () => void;
}) {
  const status = STATUS_CONFIG[application.status] || STATUS_CONFIG.draft;
  const isRejected = application.status === 'rejected';
  const currentIndex = getStatusIndex(application.status);

  const timelineSteps = isRejected
    ? [
        ...STATUS_FLOW.slice(0, currentIndex).map((s) => ({
          label: STATUS_CONFIG[s].label,
          icon: STATUS_CONFIG[s].icon,
        })),
        { label: 'Rejected', icon: 'x-circle' },
      ]
    : STATUS_FLOW.map((s) => ({
        label: STATUS_CONFIG[s].label,
        icon: STATUS_CONFIG[s].icon,
      }));

  // Derive display info from new data shape
  const propertyLabel = application.propertyDetails?.propertyType
    ? application.propertyDetails.propertyType.charAt(0).toUpperCase() +
      application.propertyDetails.propertyType.slice(1)
    : 'Property';
  const locationLabel = application.propertyDetails?.locationArea || 'TBD';
  const loanAmount = application.mortgagePreferences?.preferredLoanAmount || 0;

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <Pressable
        onPress={onPress}
        className={`rounded-3xl border mb-4 overflow-hidden ${
          isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-100'
        }`}>
        {/* Header */}
        <View className="p-5 pb-3">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1 mr-3">
              <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {propertyLabel} — {locationLabel}
              </Text>
              <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                ID: {application.applicationId.slice(0, 12)}...
              </Text>
            </View>

            {/* Status Badge */}
            <View className={`px-3 py-1.5 rounded-xl ${status.bgColor}`}>
              <Text className="text-xs font-semibold" style={{ color: status.color }}>
                {status.label}
              </Text>
            </View>
          </View>

          {/* Quick Info Row */}
          <View className="flex-row items-center gap-4 mb-3">
            <View className="flex-row items-center">
              <Feather name="dollar-sign" size={12} color={isDark ? '#888' : '#666'} />
              <Text className={`ml-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatCurrency(loanAmount)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Feather name="calendar" size={12} color={isDark ? '#888' : '#666'} />
              <Text className={`ml-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatDate(application.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View className={`px-5 py-4 border-t ${isDark ? 'border-[#1a1a1a]' : 'border-gray-50'}`}>
          {timelineSteps.map((step, index) => (
            <TimelineStep
              key={step.label}
              step={step}
              index={index}
              currentIndex={currentIndex}
              isLast={index === timelineSteps.length - 1}
              isDark={isDark}
              isRejected={isRejected && index === timelineSteps.length - 1}
            />
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------- Empty State ----------
function EmptyState({ isDark, onApply }: { isDark: boolean; onApply: () => void }) {
  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      className="flex-1 items-center justify-center px-8 ">
      <View
        className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${
          isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
        }`}>
        <Feather name="file-text" size={32} color={isDark ? '#555' : '#999'} />
      </View>
      <Text
        className={`text-xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-black'}`}>
        No Applications Yet
      </Text>
      <Text
        className={`text-sm text-center mb-8 leading-5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        Start your mortgage journey by submitting your first application
      </Text>
      <Pressable
        onPress={onApply}
        className={`px-8 py-4 rounded-2xl ${isDark ? 'bg-white' : 'bg-black'}`}>
        <Text className={`text-base font-bold ${isDark ? 'text-black' : 'text-white'}`}>
          Apply Now
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ========== Main Screen ==========
export default function MyApplicationsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const { firebaseUser } = useAuthStore();
  const { applications, loading, fetchAll } = useApplicationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [localDrafts, setLocalDrafts] = useState<ApplicationDraft[]>([]);
  const [loadingDraft, setLoadingDraft] = useState(true);

  // Fetch on mount
  useEffect(() => {
    if (firebaseUser?.uid) {
      fetchAll(firebaseUser.uid);
      loadDraft();
    }
  }, [firebaseUser?.uid]);

  const loadDraft = async () => {
    if (!firebaseUser?.uid) {
      setLoadingDraft(false);
      return;
    }

    try {
      const drafts = await loadDraftsLocally(firebaseUser.uid);
      setLocalDrafts(drafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoadingDraft(false);
    }
  };

  const handleRefresh = async () => {
    if (!firebaseUser?.uid) return;
    setRefreshing(true);
    await fetchAll(firebaseUser.uid);
    await loadDraft();
    setRefreshing(false);
  };

  const handleContinueDraft = (draftId: string) => {
    router.push(`/application?continueDraft=true&draftId=${draftId}` as any);
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await deleteDraftLocally(draftId);
      setLocalDrafts(prev => prev.filter(d => d.id !== draftId));
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  // Filter counts
  const statusCounts = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Filter state
  const [filter, setFilter] = useState<'all' | 'draft' | ApplicationStatus>('all');

  const filteredApps =
    filter === 'all' 
      ? applications 
      : filter === 'draft'
      ? []
      : applications.filter((a) => a.status === filter);

  const filteredDrafts = filter === 'all' || filter === 'draft' ? localDrafts : [];

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="px-6 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Pressable
              onPress={() => router.back()}
              className={`w-9 h-9 rounded-full items-center justify-center mr-2.5 ${
                isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
              }`}>
              <Feather name="arrow-left" size={18} color={isDark ? '#fff' : '#000'} />
            </Pressable>
            <View className="flex-1">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                My Applications
              </Text>
              <Text className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {applications.length + localDrafts.length} application{(applications.length + localDrafts.length) !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* New application button */}
          <Pressable
            onPress={() => router.push('/application' as any)}
            className={`w-9 h-9 rounded-full items-center justify-center ${
              isDark ? 'bg-white' : 'bg-black'
            }`}>
            <Feather name="plus" size={18} color={isDark ? '#000' : '#fff'} />
          </Pressable>
        </View>
      </View>

      {/* Filter chips */}
      {(applications.length > 0 || localDrafts.length > 0) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
          className="max-h-[42px]">
          {[
            { key: 'all' as const, label: 'All', count: applications.length + localDrafts.length },
            { key: 'draft' as const, label: 'Draft', count: localDrafts.length },
            ...Object.entries(STATUS_CONFIG)
              .filter(([key]) => key !== 'draft')
              .map(([key, val]) => ({
                key: key as ApplicationStatus,
                label: val.label,
                count: statusCounts[key] || 0,
              })),
          ]
            .filter((f) => f.key === 'all' || f.count > 0)
            .map((f) => (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                className={`flex-row items-center px-4 py-2.5 rounded-3xl mr-2.5 overflow-hidden ${
                  filter === f.key
                    ? isDark
                      ? 'bg-white'
                      : 'bg-black'
                    : isDark
                    ? 'bg-[#111]'
                    : 'bg-white'
                }`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.08,
                  shadowRadius: 8,
                  elevation: 3,
                }}>
                <Text
                  className={`text-xs font-semibold ${
                    filter === f.key
                      ? isDark
                        ? 'text-black'
                        : 'text-white'
                      : isDark
                      ? 'text-gray-400'
                      : 'text-gray-600'
                  }`}>
                  {f.label}
                </Text>
                <View
                  className={`ml-2 px-2 py-0.5 rounded-full ${
                    filter === f.key
                      ? isDark
                        ? 'bg-black/10'
                        : 'bg-white/20'
                      : isDark
                      ? 'bg-[#1a1a1a]'
                      : 'bg-gray-100'
                  }`}>
                  <Text
                    className={`text-[10px] font-bold ${
                      filter === f.key
                        ? isDark
                          ? 'text-black'
                          : 'text-white'
                        : isDark
                        ? 'text-gray-500'
                        : 'text-gray-500'
                    }`}>
                    {f.count}
                  </Text>
                </View>
              </Pressable>
            ))}
        </ScrollView>
      )}

      {/* Content */}
      {loading && applications.length === 0 && localDrafts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
          <Text className={`mt-3 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Loading applications...
          </Text>
        </View>
      ) : applications.length === 0 && localDrafts.length === 0 ? (
        <EmptyState isDark={isDark} onApply={() => router.push('/application' as any)} />
      ) : (
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? '#fff' : '#000'}
            />
          }>
          {/* Show draft cards first if exists */}
          {filteredDrafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              isDark={isDark}
              onContinue={() => handleContinueDraft(draft.id)}
              onDelete={() => handleDeleteDraft(draft.id)}
            />
          ))}

          {filteredApps.length === 0 && filteredDrafts.length === 0 && filter !== 'all' ? (
            <View className="items-center py-16">
              <Feather name="filter" size={28} color={isDark ? '#555' : '#999'} />
              <Text
                className={`text-sm mt-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                No applications with this status
              </Text>
              <Pressable onPress={() => setFilter('all')} className="mt-2">
                <Text className="text-blue-500 text-sm font-medium">Show all</Text>
              </Pressable>
            </View>
          ) : filteredApps.length === 0 && filter === 'draft' && filteredDrafts.length === 0 ? (
            <View className="items-center py-16">
              <Feather name="edit-3" size={28} color={isDark ? '#555' : '#999'} />
              <Text
                className={`text-sm mt-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                No draft applications
              </Text>
              <Pressable onPress={() => setFilter('all')} className="mt-2">
                <Text className="text-blue-500 text-sm font-medium">Show all</Text>
              </Pressable>
            </View>
          ) : (
            filteredApps.map((app) => (
              <ApplicationCard
                key={app.applicationId}
                application={app}
                isDark={isDark}
                onPress={() => {
                  // Could navigate to detail view in future
                }}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
