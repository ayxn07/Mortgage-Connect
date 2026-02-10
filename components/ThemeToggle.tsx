import { useColorScheme } from 'nativewind';
import { TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { useThemeTransition } from './ThemeTransition';

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const buttonRef = useRef<View>(null);
  const { triggerTransition } = useThemeTransition();

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Measure button position
    buttonRef.current?.measure(
      (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        const centerX = pageX + width / 2;
        const centerY = pageY + height / 2;

        // Trigger transition animation from button center
        triggerTransition(centerX, centerY, () => {
          setColorScheme(isDark ? 'light' : 'dark');
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
