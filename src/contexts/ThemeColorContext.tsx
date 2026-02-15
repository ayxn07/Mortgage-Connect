import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColor, getThemeColor } from '@/src/config/themeColors';
import { useColorScheme } from 'nativewind';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const THEME_COLOR_STORAGE_KEY = '@app_theme_color';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_RADIUS = Math.sqrt(SCREEN_WIDTH * SCREEN_WIDTH + SCREEN_HEIGHT * SCREEN_HEIGHT) * 1.2;

interface ThemeColorContextType {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => Promise<void>;
  getPrimaryColor: () => string;
  triggerColorTransition: (
    x: number,
    y: number,
    color: ThemeColor,
    displayColor: string,
    isGradient: boolean,
    gradientColors?: string[]
  ) => void;
}

const ThemeColorContext = createContext<ThemeColorContextType>({
  themeColor: 'default',
  setThemeColor: async () => {},
  getPrimaryColor: () => '#1a1a1a',
  triggerColorTransition: () => {},
});

export function ThemeColorProvider({ children }: { children: ReactNode }) {
  const [themeColor, setThemeColorState] = useState<ThemeColor>('default');
  const { colorScheme } = useColorScheme();

  const radius = useSharedValue(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationColor, setAnimationColor] = useState('#000000');
  const [showGradient, setShowGradient] = useState(false);
  const [gradientColors, setGradientColors] = useState<string[]>([]);

  useEffect(() => {
    loadSavedThemeColor();
  }, []);

  const loadSavedThemeColor = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_COLOR_STORAGE_KEY);
      if (saved) {
        setThemeColorState(saved as ThemeColor);
      }
    } catch (error) {
      console.error('[ThemeColor] Failed to load:', error);
    }
  };

  const setThemeColor = async (color: ThemeColor) => {
    try {
      await AsyncStorage.setItem(THEME_COLOR_STORAGE_KEY, color);
      setThemeColorState(color);
    } catch (error) {
      console.error('[ThemeColor] Failed to save:', error);
    }
  };

  const getPrimaryColor = () => {
    return getThemeColor(themeColor, colorScheme === 'dark' ? 'dark' : 'light');
  };

  const triggerColorTransition = useCallback(
    (
      x: number,
      y: number,
      color: ThemeColor,
      displayColor: string,
      isGradient: boolean,
      gradColors?: string[]
    ) => {
      setAnimationColor(displayColor);
      setShowGradient(isGradient);
      if (gradColors) {
        setGradientColors(gradColors);
      }
      setPosition({ x, y });
      setIsAnimating(true);

      radius.value = withSequence(
        withTiming(MAX_RADIUS, {
          duration: 450,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
        withTiming(MAX_RADIUS, {
          duration: 0,
        }, (finished) => {
          if (finished) {
            runOnJS(setThemeColor)(color);
          }
        }),
        withTiming(0, {
          duration: 450,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }, (finished) => {
          if (finished) {
            runOnJS(setIsAnimating)(false);
          }
        })
      );
    },
    [radius]
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: radius.value * 2,
      height: radius.value * 2,
      borderRadius: radius.value,
      transform: [
        { translateX: -radius.value },
        { translateY: -radius.value },
      ],
    };
  });

  return (
    <ThemeColorContext.Provider
      value={{ themeColor, setThemeColor, getPrimaryColor, triggerColorTransition }}>
      {children}
      {isAnimating && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {showGradient && gradientColors.length > 0 ? (
            <Animated.View
              style={[
                styles.circle,
                {
                  left: position.x,
                  top: position.y,
                },
                animatedStyle,
              ]}>
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.circle,
                {
                  left: position.x,
                  top: position.y,
                  backgroundColor: animationColor,
                },
                animatedStyle,
              ]}
            />
          )}
        </View>
      )}
    </ThemeColorContext.Provider>
  );
}

export function useThemeColor() {
  const context = useContext(ThemeColorContext);
  return context;
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
  },
});
