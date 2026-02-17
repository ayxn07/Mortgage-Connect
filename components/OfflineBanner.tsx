/**
 * Offline banner component that displays when the device loses connectivity.
 *
 * Shows a prominent banner at the top of the screen with a retry button.
 * Smoothly animates in/out using React Native Reanimated.
 */
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkState } from '@/src/hooks/useNetwork';

interface OfflineBannerProps {
  /** Optional callback when connectivity is restored */
  onReconnect?: () => void;
}

export function OfflineBanner({ onReconnect }: OfflineBannerProps): React.JSX.Element | null {
  const { isConnected, isChecking, checkConnectivity } = useNetworkState();
  const insets = useSafeAreaInsets();
  const animatedValue = useSharedValue(0);
  const wasOffline = React.useRef(false);

  useEffect(() => {
    if (!isChecking) {
      if (!isConnected) {
        animatedValue.value = withSpring(1, { damping: 15, stiffness: 100 });
        wasOffline.current = true;
      } else {
        if (wasOffline.current) {
          // Show reconnected briefly, then hide
          onReconnect?.();
          wasOffline.current = false;
        }
        animatedValue.value = withTiming(0, { duration: 300 });
      }
    }
  }, [isConnected, isChecking, animatedValue, onReconnect]);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          animatedValue.value,
          [0, 1],
          [-80, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
    opacity: animatedValue.value,
  }));

  const handleRetry = async (): Promise<void> => {
    await checkConnectivity();
  };

  // Don't render anything during initial check or when connected
  if (isChecking || isConnected) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + 8 },
        bannerStyle,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.icon}>!</Text>
          <View>
            <Text style={styles.title}>No Internet Connection</Text>
            <Text style={styles.subtitle}>
              Some features may be unavailable
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#dc2626',
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  icon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 1,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
