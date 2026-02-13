import { useColorScheme } from 'nativewind';
import { TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { useThemeTransition } from './ThemeTransition';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@app_theme';

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const buttonRef = useRef<View>(null);
  const { triggerTransition } = useThemeTransition();

  const handleToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newTheme = isDark ? 'light' : 'dark';

    // Measure button position
    buttonRef.current?.measure(
      (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        const centerX = pageX + width / 2;
        const centerY = pageY + height / 2;

        // Trigger transition animation from button center
        triggerTransition(centerX, centerY, async () => {
          setColorScheme(newTheme);
          // Save theme to AsyncStorage
          try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
          } catch (error) {
            console.error('Failed to save theme:', error);
          }
        });
      }
    );
  };

  return (
    <TouchableOpacity
      onPress={handleToggle}
      activeOpacity={0.7}
    >
      <View ref={buttonRef}>
        {isDark ? (
          <Feather name="sun" size={24} color="#fff" />
        ) : (
          <Feather name="moon" size={24} color="#000" />
        )}
      </View>
    </TouchableOpacity>
  );
}
