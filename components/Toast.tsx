import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
  isDark: boolean;
}

const TOAST_CONFIG = {
  success: {
    icon: 'check-circle' as const,
    color: '#22c55e',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  error: {
    icon: 'x-circle' as const,
    color: '#ef4444',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  info: {
    icon: 'info' as const,
    color: '#3b82f6',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  warning: {
    icon: 'alert-triangle' as const,
    color: '#f59e0b',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
};

export function Toast({
  visible,
  message,
  type = 'success',
  duration = 3000,
  onHide,
  isDark,
}: ToastProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const config = TOAST_CONFIG[type];

  useEffect(() => {
    if (visible) {
      // Show animation
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 200 });

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    translateY.value = withTiming(-100, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onHide)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          top: 60,
          left: 20,
          right: 20,
          zIndex: 9999,
        },
      ]}>
      <Pressable onPress={hideToast}>
        <View
          className={`rounded-2xl p-4 flex-row items-center border ${config.bgColor} ${config.borderColor} ${
            isDark ? 'bg-[#111]' : 'bg-white'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.4 : 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}>
          {/* Icon */}
          <View
            className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${config.bgColor}`}>
            <Feather name={config.icon} size={20} color={config.color} />
          </View>

          {/* Message */}
          <Text
            className={`flex-1 text-sm font-medium leading-5 ${
              isDark ? 'text-white' : 'text-black'
            }`}>
            {message}
          </Text>

          {/* Close button */}
          <Pressable onPress={hideToast} className="ml-2 p-1">
            <Feather name="x" size={18} color={isDark ? '#888' : '#666'} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}
