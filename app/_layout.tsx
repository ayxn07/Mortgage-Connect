import { Stack } from 'expo-router';
import '@/global.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DynamicStatusBar } from '@/components/DynamicStatusBar';
import { ThemeTransitionProvider } from '@/components/ThemeTransition';

export default function RootLayout() {
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
          </Stack>
        </ThemeTransitionProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
