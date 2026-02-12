import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Globe,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Shield,
  Edit3,
  Briefcase,
  MapPin,
  Star,
  Camera,
} from '@/components/Icons';
import { useRouter } from 'expo-router';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/src/store/authStore';

type SettingItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
};

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  rightElement,
}: SettingItemProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
      className={`mb-3 flex-row items-center rounded-2xl border p-4 ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
        }`}>
      <View className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${isDark ? 'bg-white' : 'bg-black'
        }`}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
          {title}
        </Text>
        {subtitle && (
          <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement ||
        (showChevron && (
          <ChevronRight color={isDark ? '#666' : '#999'} size={20} />
        ))}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Text className={`mb-3 px-1 text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
      {title}
    </Text>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Auth store — real user data
  const { userDoc, firebaseUser, signOut } = useAuthStore();
  const isAdmin = userDoc?.role === 'admin';
  const isAgent = userDoc?.role === 'agent';

  // Derive display values from auth
  const displayName = userDoc?.displayName ?? firebaseUser?.displayName ?? 'User';
  const displayEmail = userDoc?.email ?? firebaseUser?.email ?? '';
  const photoURL = userDoc?.photoURL ?? firebaseUser?.photoURL ?? null;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleBadgeText =
    userDoc?.role === 'admin'
      ? 'Admin'
      : userDoc?.role === 'agent'
      ? 'Agent'
      : 'User';

  const handleEditProfile = () => {
    if (isAgent) {
      router.push('/edit-agent-profile' as any);
    } else {
      // Both user and admin go to the same basic profile editor
      router.push('/edit-profile' as any);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/auth/login');
          } catch {
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete Firestore doc first, then Firebase Auth user
              if (firebaseUser) {
                const { firestore } = require('@/src/services/firebase');
                await firestore().collection('users').doc(firebaseUser.uid).delete();
                await firebaseUser.delete();
              }
              router.replace('/auth/login');
            } catch (err: any) {
              if (err?.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Re-authentication Required',
                  'Please log out and log back in before deleting your account.'
                );
              } else {
                Alert.alert('Error', 'Failed to delete account. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="px-6 pt-2 pb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`text-sm mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Manage your account
            </Text>
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Settings
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View className="mb-6">
          <SectionHeader title="Profile" />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleEditProfile}
            className={`mb-3 rounded-2xl border p-5 ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
              }`}>
            <View className="flex-row items-center gap-4">
              {/* Profile Photo */}
              <View className="relative">
                <View
                  className={`h-16 w-16 items-center justify-center rounded-full overflow-hidden ${
                    isDark ? 'bg-white' : 'bg-black'
                  }`}>
                  {photoURL ? (
                    <Image
                      source={{ uri: photoURL }}
                      className="h-16 w-16 rounded-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className={`text-xl font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                      {initials}
                    </Text>
                  )}
                </View>
                {/* Small camera badge */}
                <View
                  className={`absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 ${
                    isDark ? 'bg-[#2a2a2a] border-[#1a1a1a]' : 'bg-gray-200 border-white'
                  }`}>
                  <Camera color={isDark ? '#fff' : '#000'} size={10} />
                </View>
              </View>

              <View className="flex-1">
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  {displayName}
                </Text>
                <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {displayEmail}
                </Text>
                {/* Role badge */}
                <View className="flex-row mt-2">
                  <View
                    className={`rounded-full px-3 py-1 ${
                      isAdmin
                        ? 'bg-purple-500/20'
                        : isAgent
                        ? 'bg-blue-500/20'
                        : isDark
                        ? 'bg-[#2a2a2a]'
                        : 'bg-gray-100'
                    }`}>
                    <Text
                      className={`text-xs font-semibold ${
                        isAdmin
                          ? 'text-purple-500'
                          : isAgent
                          ? 'text-blue-500'
                          : isDark
                          ? 'text-gray-400'
                          : 'text-gray-600'
                      }`}>
                      {roleBadgeText}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                }`}>
                <Edit3 color={isDark ? '#fff' : '#000'} size={16} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Admin Section */}
        {isAdmin && (
          <View className="mb-6">
            <SectionHeader title="Administration" />
            <SettingItem
              icon={<Shield color={isDark ? '#000' : '#fff'} size={20} />}
              title="Admin Dashboard"
              subtitle="Manage users, apps & analytics"
              onPress={() => router.push('/admin' as any)}
            />
          </View>
        )}

        {/* Account Section */}
        <View className="mb-6">
          <SectionHeader title="Account" />
          <SettingItem
            icon={<User color={isDark ? '#000' : '#fff'} size={20} />}
            title="Personal Information"
            subtitle="Name, phone, profile photo"
            onPress={handleEditProfile}
          />
          {isAgent && (
            <>
              <SettingItem
                icon={<Briefcase color={isDark ? '#000' : '#fff'} size={20} />}
                title="Professional Details"
                subtitle="Bio, experience, services & rates"
                onPress={() => router.push('/edit-agent-profile' as any)}
              />
              <SettingItem
                icon={<Star color={isDark ? '#000' : '#fff'} size={20} />}
                title="Availability & Specialties"
                subtitle="Manage availability, specialties & languages"
                onPress={() => router.push('/edit-agent-profile' as any)}
              />
            </>
          )}
        </View>

        {/* Preferences Section */}
        <View className="mb-6">
          <SectionHeader title="Preferences" />
          <SettingItem
            icon={<Globe color={isDark ? '#000' : '#fff'} size={20} />}
            title="Language"
            subtitle="English"
            onPress={() => Alert.alert('Language', 'Select your language')}
          />
        </View>

        {/* Support Section */}
        <View className="mb-6">
          <SectionHeader title="Support" />
          <SettingItem
            icon={<HelpCircle color={isDark ? '#000' : '#fff'} size={20} />}
            title="Help Center"
            subtitle="FAQs and support"
            onPress={() => router.push('/support')}
          />
          <SettingItem
            icon={<FileText color={isDark ? '#000' : '#fff'} size={20} />}
            title="Terms & Privacy"
            subtitle="Legal information"
            onPress={() => Alert.alert('Legal', 'View terms and privacy policy')}
          />
        </View>

        {/* Danger Zone */}
        <View className="mb-6">
          <SectionHeader title="Account Actions" />
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            className={`mb-3 flex-row items-center rounded-2xl border p-4 ${isDark ? 'bg-[#1a1a1a] border-red-500/30' : 'bg-white border-red-500/30'
              }`}>
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <LogOut color="#ef4444" size={20} />
            </View>
            <Text className="flex-1 font-semibold text-red-500">Logout</Text>
            <ChevronRight color="#ef4444" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
            className={`mb-3 flex-row items-center rounded-2xl border p-4 ${isDark ? 'bg-[#1a1a1a] border-red-500/30' : 'bg-white border-red-500/30'
              }`}>
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <Shield color="#ef4444" size={20} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-red-500">Delete Account</Text>
              <Text className="mt-1 text-sm text-red-500/70">
                Permanently delete your account
              </Text>
            </View>
            <ChevronRight color="#ef4444" size={20} />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View className="items-center py-4">
          <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            MortgageConnect v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
