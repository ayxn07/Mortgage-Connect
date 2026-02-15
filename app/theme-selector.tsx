import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Check, ChevronLeft, Palette } from '@/components/Icons';
import { useThemeColor } from '@/src/contexts/ThemeColorContext';
import { THEME_COLORS, ThemeColor } from '@/src/config/themeColors';

export default function ThemeSelectorScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { themeColor, triggerColorTransition } = useThemeColor();

  const handleThemeSelect = (
    color: ThemeColor,
    event: any,
    colorValue: string,
    isGradient: boolean,
    gradColors?: string[],
    animationColor?: string
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Get touch position
    event.target.measure(
      (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        const centerX = pageX + width / 2;
        const centerY = pageY + height / 2;

        // Use animationColor if provided (for adaptive theme), otherwise use colorValue
        const circleColor = animationColor || colorValue;
        triggerColorTransition(centerX, centerY, color, circleColor, false, undefined);
      }
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="px-6 pt-2 pb-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className={`mr-4 h-10 w-10 items-center justify-center rounded-full ${
            isDark ? 'bg-[#1a1a1a]' : 'bg-white'
          }`}>
          <ChevronLeft color={isDark ? '#fff' : '#000'} size={20} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className={`text-sm mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Customize appearance
          </Text>
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Theme Colors
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View
          className={`mb-6 rounded-2xl border p-4 ${
            isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
          }`}>
          <View className="flex-row items-start">
            <View className="mr-3 mt-0.5">
              <Palette color={isDark ? '#60a5fa' : '#3b82f6'} size={20} />
            </View>
            <View className="flex-1">
              <Text
                className={`text-sm leading-relaxed ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}>
                Theme colors affect primary UI elements like buttons, cards, and accents throughout
                the app. Your selection is saved and synced across all screens.
              </Text>
            </View>
          </View>
        </View>

        {/* Theme Grid */}
        <View className="flex-row flex-wrap justify-between">
          {THEME_COLORS.map((theme) => {
            const isSelected = themeColor === theme.name;
            const displayColor = isDark ? theme.darkColor : theme.lightColor;

            return (
              <TouchableOpacity
                key={theme.name}
                activeOpacity={0.7}
                onPress={(e) =>
                  handleThemeSelect(
                    theme.name,
                    e,
                    displayColor,
                    theme.isGradient || false,
                    theme.gradientColors,
                    theme.animationColor
                  )
                }
                className={`mb-4 w-[48%] rounded-2xl border-2 p-4 ${
                  isSelected
                    ? isDark
                      ? 'border-white bg-white/5'
                      : 'border-black bg-black/5'
                    : isDark
                    ? 'border-[#2a2a2a] bg-[#1a1a1a]'
                    : 'border-gray-200 bg-white'
                }`}
                style={
                  isSelected && !theme.isGradient
                    ? { borderColor: displayColor }
                    : undefined
                }>
                {/* Color Circle */}
                <View className="items-center mb-3">
                  {theme.isGradient && theme.gradientColors ? (
                    <LinearGradient
                      colors={theme.gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      {isSelected && <Check color="#fff" size={28} />}
                    </LinearGradient>
                  ) : (
                    <View
                      className="h-16 w-16 rounded-full items-center justify-center"
                      style={{ backgroundColor: displayColor }}>
                      {isSelected && <Check color="#fff" size={28} />}
                    </View>
                  )}
                </View>

                {/* Label */}
                <Text
                  className={`text-center font-semibold ${
                    isDark ? 'text-white' : 'text-black'
                  }`}>
                  {theme.label}
                </Text>

                {isSelected && (
                  <View className="mt-2">
                    <View
                      className={`rounded-full px-3 py-1 self-center ${
                        isDark ? 'bg-white/10' : 'bg-black/10'
                      }`}>
                      <Text
                        className={`text-xs font-medium ${
                          isDark ? 'text-white' : 'text-black'
                        }`}>
                        Active
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
