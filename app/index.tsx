import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Diamond } from '@/components/Icons';

export default function SplashScreen() {
  const router = useRouter();

  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(20);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withTiming(1, { duration: 800 });

    // Glow effect
    glowOpacity.value = withDelay(400, withTiming(0.6, { duration: 600 }));

    // Tagline animation
    taglineOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    taglineTranslateY.value = withDelay(600, withTiming(0, { duration: 600 }));

    // Navigate to home after splash sequence
    const exitTimer = setTimeout(() => {
      logoOpacity.value = withTiming(0, { duration: 400 });
    }, 2500);

    const navTimer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2900);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowOpacity.value, [0, 0.6, 1], [0, 0.3, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(logoScale.value, [0.8, 1], [1.2, 1.5]) }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 items-center justify-center px-6">
        {/* Logo Container */}
        <View className="relative items-center">
          {/* Glow Effect */}
          <Animated.View
            style={glowAnimatedStyle}
            className="absolute h-32 w-32 rounded-full bg-white blur-xl"
          />

          {/* Logo */}
          <Animated.View style={logoAnimatedStyle} className="items-center">
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-2xl">
              <Diamond color="#000000" size={40} strokeWidth={2} />
            </View>

            <Text className="text-4xl font-bold tracking-[0.2em] text-white">LUXE</Text>
          </Animated.View>

          {/* Tagline */}
          <Animated.View style={taglineAnimatedStyle} className="mt-6">
            <Text className="text-sm font-medium uppercase tracking-[0.3em] text-[#333333]">
              Premium Experience
            </Text>
          </Animated.View>
        </View>

        {/* Bottom indicator */}
        <Animated.View style={taglineAnimatedStyle} className="absolute bottom-12">
          <View className="h-1 w-12 rounded-full bg-[#333333]" />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
