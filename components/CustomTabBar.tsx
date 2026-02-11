import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';
import { useChatStore } from '@/src/store/chatStore';

const { width } = Dimensions.get('window');

const ICON_MAP = {
  index: 'home',
  agents: 'users',
  chats: 'message-circle',
  settings: 'settings',
} as const;

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tabCount = state.routes.length;
  const tabWidth = (width - 72) / tabCount;
  const totalUnread = useChatStore((s) => s.totalUnread);
  
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(state.index * tabWidth, {
      duration: 250,
    });
  }, [state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[
      styles.container, 
      { 
        bottom: insets.bottom + 20,
        backgroundColor: isDark ? '#000' : '#fff',
        borderColor: isDark ? '#2a2a2a' : '#e5e5e5',
      }
    ]}>
      {/* Animated Indicator */}
      <Animated.View
        style={[
          styles.indicator,
          { 
            width: tabWidth - 8,
            backgroundColor: isDark ? '#fff' : '#000',
          },
          indicatorStyle,
        ]}
      />

      {/* Tab Buttons */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate(route.name);
          }
        };

        return (
          <TabButton
            key={route.key}
            label={String(label)}
            iconName={ICON_MAP[route.name as keyof typeof ICON_MAP] || 'home'}
            isFocused={isFocused}
            onPress={onPress}
            isDark={isDark}
            badge={route.name === 'chats' ? totalUnread : 0}
          />
        );
      })}
    </View>
  );
}

function TabButton({
  label,
  iconName,
  isFocused,
  onPress,
  isDark,
  badge = 0,
}: {
  label: string;
  iconName: string;
  isFocused: boolean;
  onPress: () => void;
  isDark: boolean;
  badge?: number;
}) {
  const scale = useSharedValue(1);
  const iconOpacity = useSharedValue(isFocused ? 1 : 0.5);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0.6);

  useEffect(() => {
    iconOpacity.value = withTiming(isFocused ? 1 : 0.5, { duration: 200 });
    labelOpacity.value = withTiming(isFocused ? 1 : 0.6, { duration: 200 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withTiming(0.92, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
    onPress();
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}>
      <Animated.View style={[styles.tabContent, animatedContainerStyle]}>
        <Animated.View style={[animatedIconStyle, { position: 'relative' }]}>
          <Feather
            name={iconName as any}
            size={24}
            color={isFocused ? (isDark ? '#000' : '#fff') : (isDark ? '#fff' : '#000')}
          />
          {badge > 0 && !isFocused && (
            <View style={{
              position: 'absolute',
              top: -4,
              right: -8,
              backgroundColor: '#ef4444',
              borderRadius: 8,
              minWidth: 16,
              height: 16,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 3,
            }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
                {badge > 99 ? '99+' : badge}
              </Text>
            </View>
          )}
        </Animated.View>
        <Animated.Text style={[
          styles.label, 
          animatedTextStyle,
          { 
            color: isFocused ? (isDark ? '#000' : '#fff') : (isDark ? '#fff' : '#000')
          }
        ]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  indicator: {
    position: 'absolute',
    height: 64,
    borderRadius: 32,
    left: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 1,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
