import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Bell,
  Lock,
  CreditCard,
  Globe,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Mail,
  Smartphone,
  Shield,
} from '@/components/Icons';
import { useRouter } from 'expo-router';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useColorScheme } from 'nativewind';

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
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
      className="mb-3 flex-row items-center rounded-[16px] border border-border bg-card p-4">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-foreground">{title}</Text>
        {subtitle && <Text className="mt-1 text-sm text-muted-foreground">{subtitle}</Text>}
      </View>
      {rightElement ||
        (showChevron && <ChevronRight className="text-muted-foreground" size={20} />)}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text className="mb-3 px-1 text-lg font-bold text-foreground">{title}</Text>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Success', 'You have been logged out');
          // In real app: clear auth state and navigate to login
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
          onPress: () => Alert.alert('Account Deleted', 'Your account has been deleted'),
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border px-6 py-4">
        <Text className="text-2xl font-bold text-foreground">Settings</Text>
        <ThemeToggle />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 128,
          gap: 24,
        }}>
        {/* Profile Section */}
        <View>
          <SectionHeader title="Profile" />
          <View className="mb-3 flex-row items-center gap-4 rounded-[20px] border border-border bg-card p-5">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Text className="text-xl font-bold text-primary-foreground">JD</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">John Doe</Text>
              <Text className="text-muted-foreground">john.doe@email.com</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="font-semibold text-primary">Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View>
          <SectionHeader title="Account" />
          <SettingItem
            icon={<User className="text-primary" size={20} />}
            title="Personal Information"
            subtitle="Update your details"
            onPress={() => Alert.alert('Personal Info', 'Edit personal information')}
          />
          <SettingItem
            icon={<CreditCard className="text-primary" size={20} />}
            title="Payment Methods"
            subtitle="Manage cards and billing"
            onPress={() => Alert.alert('Payment', 'Manage payment methods')}
          />
          <SettingItem
            icon={<Lock className="text-primary" size={20} />}
            title="Password & Security"
            subtitle="Change password, 2FA"
            onPress={() => Alert.alert('Security', 'Update security settings')}
          />
        </View>

        {/* Notifications Section */}
        <View>
          <SectionHeader title="Notifications" />
          <SettingItem
            icon={<Bell className="text-primary" size={20} />}
            title="Push Notifications"
            subtitle="Booking updates and messages"
            showChevron={false}
            rightElement={
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#e5e5e5', true: colorScheme === 'dark' ? '#fff' : '#000' }}
                thumbColor="#fff"
              />
            }
          />
          <SettingItem
            icon={<Mail className="text-primary" size={20} />}
            title="Email Notifications"
            subtitle="Promotional emails and updates"
            showChevron={false}
            rightElement={
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: '#e5e5e5', true: colorScheme === 'dark' ? '#fff' : '#000' }}
                thumbColor="#fff"
              />
            }
          />
          <SettingItem
            icon={<Smartphone className="text-primary" size={20} />}
            title="SMS Notifications"
            subtitle="Important booking alerts"
            showChevron={false}
            rightElement={
              <Switch
                value={smsEnabled}
                onValueChange={setSmsEnabled}
                trackColor={{ false: '#e5e5e5', true: colorScheme === 'dark' ? '#fff' : '#000' }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* Preferences Section */}
        <View>
          <SectionHeader title="Preferences" />
          <SettingItem
            icon={<Globe className="text-primary" size={20} />}
            title="Language"
            subtitle="English"
            onPress={() => Alert.alert('Language', 'Select your language')}
          />
        </View>

        {/* Support Section */}
        <View>
          <SectionHeader title="Support" />
          <SettingItem
            icon={<HelpCircle className="text-primary" size={20} />}
            title="Help Center"
            subtitle="FAQs and support"
            onPress={() => router.push('/(tabs)/support')}
          />
          <SettingItem
            icon={<FileText className="text-primary" size={20} />}
            title="Terms & Privacy"
            subtitle="Legal information"
            onPress={() => Alert.alert('Legal', 'View terms and privacy policy')}
          />
        </View>

        {/* Danger Zone */}
        <View>
          <SectionHeader title="Account Actions" />
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            className="mb-3 flex-row items-center rounded-[16px] border border-border bg-card p-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <LogOut className="text-destructive" size={20} />
            </View>
            <Text className="flex-1 font-semibold text-destructive">Logout</Text>
            <ChevronRight className="text-destructive" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
            className="mb-3 flex-row items-center rounded-[16px] border border-destructive/20 bg-card p-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <Shield className="text-destructive" size={20} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-destructive">Delete Account</Text>
              <Text className="mt-1 text-sm text-destructive/70">
                Permanently delete your account
              </Text>
            </View>
            <ChevronRight className="text-destructive" size={20} />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View className="items-center py-4">
          <Text className="text-sm text-muted-foreground">LUXE App v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
