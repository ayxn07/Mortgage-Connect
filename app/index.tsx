import React, { useEffect, useRef } from 'react';
import { View, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';

export default function SplashScreen() {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const loading = useAuthStore((s) => s.loading);
  const initialized = useAuthStore((s) => s.initialized);
  const pendingGoogleRegistration = useAuthStore((s) => s.pendingGoogleRegistration);
  const hasNavigated = useRef(false);

  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    // Fade in and hold
    logoOpacity.value = withSequence(
      withTiming(1, { duration: 800 }),
      withTiming(1, { duration: 1200 }),
      withTiming(0, { duration: 600 })
    );
  }, []);

  useEffect(() => {
    // Only navigate once from the splash screen
    if (hasNavigated.current) return;
    if (!initialized || loading) return;

    const navTimer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      if (pendingGoogleRegistration) {
        // New Google user needs to complete registration
        router.replace('/auth/complete-google-registration');
      } else if (firebaseUser) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/login');
      }
    }, 2600);

    return () => clearTimeout(navTimer);
  }, [initialized, loading, firebaseUser, pendingGoogleRegistration, router]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Animated.View style={logoAnimatedStyle}>
        <Image
          source={require('@/assets/images/splash-icon.png')}
          style={{ width: 280, height: 280 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
