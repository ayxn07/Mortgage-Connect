import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Globe,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Shield,
  Edit3,
  Palette,
  Bell,
} from '@/components/Icons';
import { useRouter } from 'expo-router';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/src/store/authStore';
import { useNotificationStore } from '@/src/store/notificationStore';
import { AuthorizationStatus } from '@react-native-firebase/messaging';
import { useThemeColor } from '@/src/contexts/ThemeColorContext';
import { useThemeColors } from '@/src/hooks/useThemeColors';

type SettingItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  useAccentColor?: boolean;
};

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  rightElement,
  useAccentColor = false,
}: SettingItemProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { primaryColor, getIconColor } = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
      className={`mb-3 flex-row items-center rounded-2xl border p-4 ${
        isDark ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
      }`}>
      <View
        className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
        style={
          useAccentColor
            ? { backgroundColor: primaryColor }
            : { backgroundColor: isDark ? '#fff' : '#000' }
        }>
        {icon}
      </View>
      <View className="flex-1">
        <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{title}</Text>
        {subtitle && (
          <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (showChevron && <ChevronRight color={isDark ? '#666' : '#999'} size={20} />)}
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
  const { themeColor } = useThemeColor();
  const { primaryColor, getIconColor, getButtonBg, getButtonText } = useThemeColors();

  // Notification store
  const notificationEnabled = useNotificationStore((s) => s.enabled);
  const setNotificationEnabled = useNotificationStore((s) => s.setEnabled);
  const checkSystemPermission = useNotificationStore((s) => s.checkSystemPermission);

  // Handle notification toggle with system permission check
  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      // Turning on - setEnabled will request system permission
      await setNotificationEnabled(true);

      // Check if actually enabled (might be denied by system)
      const status = await checkSystemPermission();
      const hasPermission =
        status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;

      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications for MortgageConnect in your device settings to receive push notifications.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                // Open app settings
                Linking.openSettings();
              },
            },
          ]
        );
      }
    } else {
      // Turning off - just disable
      await setNotificationEnabled(false);
    }
  };

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
    userDoc?.role === 'admin' ? 'Admin' : userDoc?.role === 'agent' ? 'Agent' : 'User';

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
                const { db } = require('@/src/services/firebase');
                const { doc, deleteDoc } = require('@react-native-firebase/firestore');
                await deleteDoc(doc(db, 'users', firebaseUser.uid));
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
      <View className="px-6 pb-6 pt-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`mb-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
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
            className={`overflow-hidden rounded-3xl border ${
              isDark ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
            }`}>
            {/* Background Gradient Effect */}
            <View className={`h-24 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              <View
                className="absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br opacity-10"
                style={{
                  backgroundColor: isAdmin
                    ? '#a855f7'
                    : isAgent
                      ? '#3b82f6'
                      : isDark
                        ? '#fff'
                        : '#000',
                  transform: [{ translateX: 40 }, { translateY: -40 }],
                }}
              />
            </View>

            {/* Profile Content */}
            <View className="px-5 pb-5" style={{ marginTop: -40 }}>
              {/* Profile Photo with Border */}
              <View className="relative mb-4">
                <View
                  className={`h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 ${
                    isDark ? 'border-[#1a1a1a]' : 'border-white'
                  }`}
                  style={{
                    backgroundColor: photoURL ? 'transparent' : getButtonBg(),
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 8,
                  }}>
                  {photoURL ? (
                    <Image
                      source={{ uri: photoURL }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ color: getButtonText() }} className="text-2xl font-bold">
                      {initials}
                    </Text>
                  )}
                </View>
              </View>

              {/* User Info */}
              <View className="mb-3">
                <Text className={`mb-1 text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  {displayName}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {displayEmail}
                </Text>
              </View>

              {/* Role Badge & Edit Icon Row */}
              <View className="flex-row items-center justify-between">
                <View
                  className={`rounded-full px-4 py-2 ${
                    isAdmin
                      ? 'bg-purple-500/20'
                      : isAgent
                        ? 'bg-blue-500/20'
                        : isDark
                          ? 'bg-[#2a2a2a]'
                          : 'bg-gray-100'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
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

                {/* Edit Icon */}
                <View
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: primaryColor }}>
                  <Edit3 color={getIconColor()} size={16} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Admin Section */}
        {isAdmin && (
          <View className="mb-6">
            <SectionHeader title="Administration" />
            <SettingItem
              icon={<Shield color={getIconColor()} size={20} />}
              title="Admin Dashboard"
              subtitle="Manage users, apps & analytics"
              onPress={() => router.push('/admin' as any)}
              useAccentColor={true}
            />
          </View>
        )}

        {/* Preferences Section */}
        <View className="mb-6">
          <SectionHeader title="Preferences" />
          <SettingItem
            icon={<Bell color={getIconColor()} size={20} />}
            title="Push Notifications"
            subtitle={notificationEnabled ? 'Enabled' : 'Disabled'}
            onPress={undefined}
            showChevron={false}
            useAccentColor={true}
            rightElement={
              <Switch
                value={notificationEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{
                  false: isDark ? '#3a3a3a' : '#d1d5db',
                  true: primaryColor,
                }}
                thumbColor={notificationEnabled ? '#fff' : isDark ? '#666' : '#f3f4f6'}
                ios_backgroundColor={isDark ? '#3a3a3a' : '#d1d5db'}
              />
            }
          />
          <SettingItem
            icon={<Palette color={getIconColor()} size={20} />}
            title="Theme Colors"
            subtitle={`Current: ${themeColor.charAt(0).toUpperCase() + themeColor.slice(1)}`}
            onPress={() => router.push('/theme-selector' as any)}
            useAccentColor={true}
          />
          <SettingItem
            icon={<Globe color={getIconColor()} size={20} />}
            title="Language"
            subtitle="English"
            onPress={() => Alert.alert('Language', 'Select your language')}
            useAccentColor={true}
          />
        </View>

        {/* Support Section */}
        <View className="mb-6">
          <SectionHeader title="Support" />
          <SettingItem
            icon={<HelpCircle color={getIconColor()} size={20} />}
            title="Help Center"
            subtitle="FAQs and support"
            onPress={() => router.push('/support')}
            useAccentColor={true}
          />
          <SettingItem
            icon={<FileText color={getIconColor()} size={20} />}
            title="Terms & Privacy"
            subtitle="Legal information"
            onPress={() => Alert.alert('Legal', 'View terms and privacy policy')}
            useAccentColor={true}
          />
        </View>

        {/* Danger Zone */}
        <View className="mb-6">
          <SectionHeader title="Account Actions" />
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            className={`mb-3 flex-row items-center rounded-2xl border p-4 ${
              isDark ? 'border-red-500/30 bg-[#1a1a1a]' : 'border-red-500/30 bg-white'
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
            className={`mb-3 flex-row items-center rounded-2xl border p-4 ${
              isDark ? 'border-red-500/30 bg-[#1a1a1a]' : 'border-red-500/30 bg-white'
            }`}>
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <Shield color="#ef4444" size={20} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-red-500">Delete Account</Text>
              <Text className="mt-1 text-sm text-red-500/70">Permanently delete your account</Text>
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
