import { useEffect } from 'react';
import { Stack } from 'expo-router';
import '@/global.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeColorProvider } from '@/src/contexts/ThemeColorContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DynamicStatusBar } from '@/components/DynamicStatusBar';
import { ThemeTransitionProvider } from '@/components/ThemeTransition';
import { LogBox, I18nManager } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { seedTestAgents } from '@/src/services/seedAgents';
import { configureGoogleSignIn } from '@/src/services/googleSignInConfig';
import { useNotifications } from '@/src/hooks/useNotifications';

// Register Notifee background event handler at module scope.
// This must be imported before any React component renders so that
// notification actions (Mark as Read, Reply) work even when the app
// is in the background or killed.
import '@/src/services/notifeeEvents';

// Force LTR layout
if (I18nManager.isRTL) {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
}

// Suppress SafeAreaView deprecation warning from third-party libraries
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  'statusBarTranslucent and navigationBarTranslucent',
]);

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  // Initialize push notifications
  useNotifications();

  // Bootstrap Firebase auth listener once on mount
  useEffect(() => {
    console.log('[RootLayout] Initializing auth listener');
    const unsubscribe = initialize();

    // Configure Google Sign-In
    configureGoogleSignIn();

    return () => {
      console.log('[RootLayout] Cleaning up auth listener');
      unsubscribe();
    };
  }, [initialize]);

  // Seed test agents on first load (only when user is logged in)
  const initialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (initialized && user) {
      seedTestAgents();
    }
  }, [initialized, user]);

  return (
    <ThemeProvider>
      <ThemeColorProvider>
        <SafeAreaProvider>
          <ThemeTransitionProvider>
            <DynamicStatusBar />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#000' },
                animation: 'fade',
              }}>
              <Stack.Screen
                name="index"
                options={{
                  animation: 'fade',
                }}
              />
              <Stack.Screen
                name="auth"
                options={{
                  animation: 'fade',
                }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{
                  animation: 'fade',
                }}
              />
              <Stack.Screen
                name="chat"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="agent-detail"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="support"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="test-firebase"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="calculator"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="application"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="my-applications"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="calc-emi"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="calc-afford"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="calc-costs"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="calc-compare"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="calc-prepay"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="calc-rentvsbuy"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="ai-assistant"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="admin"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="edit-profile"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="edit-agent-profile"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="theme-selector"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
            </Stack>
          </ThemeTransitionProvider>
        </SafeAreaProvider>
      </ThemeColorProvider>
    </ThemeProvider>
  );
}
