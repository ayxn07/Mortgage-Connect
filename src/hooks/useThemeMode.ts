import { useColorScheme } from 'nativewind';

/**
 * Convenience hook for theme mode detection.
 *
 * Wraps NativeWind's `useColorScheme` and provides
 * a simple `isDark` boolean plus the toggle function.
 *
 * @example
 * ```tsx
 * const { isDark, colorScheme, toggleColorScheme } = useThemeMode();
 * ```
 */
export function useThemeMode() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();

  return {
    /** Current color scheme ('light' or 'dark') */
    colorScheme,
    /** Whether dark mode is active */
    isDark: colorScheme === 'dark',
    /** Set color scheme explicitly */
    setColorScheme,
    /** Toggle between light and dark */
    toggleColorScheme,
  };
}
