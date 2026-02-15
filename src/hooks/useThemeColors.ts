import { useThemeColor } from '@/src/contexts/ThemeColorContext';
import { useColorScheme } from 'nativewind';
import { THEME_COLORS } from '@/src/config/themeColors';

/**
 * Hook to get theme-aware colors for UI elements
 * Returns primary color, background colors, and utility functions
 */
export function useThemeColors() {
  const { themeColor, getPrimaryColor } = useThemeColor();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get the theme configuration
  const themeConfig = THEME_COLORS.find((t) => t.name === themeColor);
  const primaryColor = getPrimaryColor();

  // For adaptive theme, return gradient colors
  const isAdaptive = themeColor === 'adaptive';
  const gradientColors = isAdaptive && themeConfig?.gradientColors 
    ? themeConfig.gradientColors 
    : [primaryColor, primaryColor];

  // In dark mode, use white text/icons for all colored themes (not default)
  const isColoredTheme = themeColor !== 'default';
  const accentTextColor = isDark && isColoredTheme ? '#fff' : isDark ? '#000' : '#fff';
  const accentIconColor = isDark && isColoredTheme ? '#fff' : isDark ? '#000' : '#fff';

  return {
    // Theme info
    themeColor,
    primaryColor,
    isAdaptive,
    gradientColors,
    isDark,
    isColoredTheme,

    // Utility functions for common use cases
    getAccentColor: () => primaryColor,
    getIconBg: () => primaryColor,
    getIconColor: () => accentIconColor,
    getAccentTextColor: () => accentTextColor,
    getBadgeBg: () => `${primaryColor}20`, // 20% opacity
    getBadgeText: () => primaryColor,
    getButtonBg: () => primaryColor,
    getButtonText: () => accentTextColor,
    getBorderColor: () => `${primaryColor}30`, // 30% opacity
    
    // Card colors
    getCardBg: () => (isDark ? '#1a1a1a' : '#fff'),
    getCardBorder: () => (isDark ? '#2a2a2a' : '#e5e7eb'),
    
    // Text colors
    getPrimaryText: () => (isDark ? '#fff' : '#000'),
    getSecondaryText: () => (isDark ? '#9ca3af' : '#6b7280'),
    getMutedText: () => (isDark ? '#6b7280' : '#9ca3af'),
  };
}
