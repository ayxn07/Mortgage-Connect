import { useEffect } from 'react';
import { Stack } from 'expo-router';
import '@/global.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DynamicStatusBar } from '@/components/DynamicStatusBar';
import { ThemeTransitionProvider } from '@/components/ThemeTransition';
import { LogBox } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { seedTestAgents } from '@/src/services/seedAgents';

// Suppress SafeAreaView deprecation warning from third-party libraries
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
]);

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  // Bootstrap Firebase auth listener once on mount
  useEffect(() => {
    console.log('[RootLayout] Initializing auth listener');
    const unsubscribe = initialize();
    return () => {
      console.log('[RootLayout] Cleaning up auth listener');
      unsubscribe();
    };
  }, [initialize]);

  // Seed test agents on first load
  const initialized = useAuthStore((s) => s.initialized);
  
  useEffect(() => {
    if (initialized) {
      seedTestAgents();
    }
  }, [initialized]);

  return (
    <ThemeProvider>
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
          </Stack>
        </ThemeTransitionProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
