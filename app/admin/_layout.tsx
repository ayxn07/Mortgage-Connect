import { Stack } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function AdminLayout() {
  const router = useRouter();
  const userDoc = useAuthStore((s) => s.userDoc);
  const initialized = useAuthStore((s) => s.initialized);

  // Guard: redirect non-admin users
  useEffect(() => {
    if (initialized && userDoc?.role !== 'admin') {
      router.replace('/(tabs)');
    }
  }, [initialized, userDoc, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#000' },
      }}>
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="users" />
      <Stack.Screen name="agents" />
      <Stack.Screen name="applications" />
      <Stack.Screen name="support" />
      <Stack.Screen name="analytics" />
    </Stack>
  );
}
