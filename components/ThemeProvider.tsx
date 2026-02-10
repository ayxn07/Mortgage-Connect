// ThemeProvider.tsx
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';
import { lightTheme, darkTheme } from '../theme';
import { useEffect } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { colorScheme, setColorScheme } = useColorScheme();

  // Initialize color scheme on mount
  useEffect(() => {
    if (!colorScheme) {
      setColorScheme('light');
    }
  }, []);

  const themeVars = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <View style={themeVars} className={`flex-1 bg-background ${colorScheme === 'dark' ? 'dark' : ''}`}>
      {children}
    </View>
  );
}
