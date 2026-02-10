import { useColorScheme } from 'nativewind';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { useThemeTransition } from './ThemeTransition';

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const buttonRef = useRef<TouchableOpacity>(null);
  const { triggerTransition } = useThemeTransition();

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Measure button position
    buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      const centerX = pageX + width / 2;
      const centerY = pageY + height / 2;

      // Trigger transition animation from button center
      triggerTransition(centerX, centerY, () => {
        setColorScheme(isDark ? 'light' : 'dark');
      });
    });
  };

  return (
    <TouchableOpacity
      ref={buttonRef}
      onPress={handleToggle}
      activeOpacity={0.7}
    >
      {isDark ? (
        <Feather name="sun" size={24} color="#fff" />
      ) : (
        <Feather name="moon" size={24} color="#000" />
      )}
    </TouchableOpacity>
  );
}
