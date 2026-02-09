import { useColorScheme } from 'nativewind';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColorScheme(isDark ? 'light' : 'dark');
  };

  return (
    <TouchableOpacity onPress={handleToggle} activeOpacity={0.7}>
      {isDark ? (
        <Feather name="sun" size={24} color="#fff" />
      ) : (
        <Feather name="moon" size={24} color="#000" />
      )}
    </TouchableOpacity>
  );
}
