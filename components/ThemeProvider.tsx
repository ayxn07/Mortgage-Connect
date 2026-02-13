// ThemeProvider.tsx
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';
import { lightTheme, darkTheme } from '../theme';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const THEME_STORAGE_KEY = '@app_theme';

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      
      if (savedTheme === 'dark' || savedTheme === 'light') {
        // Use saved preference
        setColorScheme(savedTheme);
      } else {
        // First time - set dark as default
        setColorScheme('dark');
        await AsyncStorage.setItem(THEME_STORAGE_KEY, 'dark');
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      setColorScheme('dark');
    } finally {
      // Small delay to ensure theme is applied
      setTimeout(() => setIsReady(true), 50);
    }
  };

  const themeVars = colorScheme === 'dark' ? darkTheme : lightTheme;

  // Always show dark theme while loading
  if (!isReady) {
    return (
      <View style={darkTheme} className="flex-1 bg-black dark">
        {children}
      </View>
    );
  }

  return (
    <View style={themeVars} className={`flex-1 bg-background ${colorScheme === 'dark' ? 'dark' : ''}`}>
      {children}
    </View>
  );
}
