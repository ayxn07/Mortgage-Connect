import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { CustomTabBar } from '@/components/CustomTabBar';
import { useAuthStore } from '@/src/store/authStore';

export default function TabsLayout() {
  const router = useRouter();
  const pendingGoogleRegistration = useAuthStore((s) => s.pendingGoogleRegistration);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const userDoc = useAuthStore((s) => s.userDoc);
  const initialized = useAuthStore((s) => s.initialized);

  // Guard: redirect to complete-google-registration if profile is incomplete
  useEffect(() => {
    if (!initialized) return;

    if (pendingGoogleRegistration && firebaseUser && !userDoc) {
      console.log('[TabsLayout] Pending Google registration detected, redirecting...');
      router.replace('/auth/complete-google-registration');
    }
  }, [initialized, pendingGoogleRegistration, firebaseUser, userDoc, router]);

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: 'Agents',
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
