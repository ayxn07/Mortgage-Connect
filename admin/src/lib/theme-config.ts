export type ThemeColor =
  | 'default'
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'rose'
  | 'violet'
  | 'yellow'
  | 'adaptive';

export interface ThemeColorOption {
  name: ThemeColor;
  label: string;
  lightColor: string;
  darkColor: string;
  isGradient?: boolean;
}

export const THEME_COLORS: ThemeColorOption[] = [
  {
    name: 'default',
    label: 'Default',
    lightColor: '#1a1a1a',
    darkColor: '#ebebeb',
  },
  {
    name: 'blue',
    label: 'Blue',
    lightColor: '#7aa6f3',
    darkColor: '#7aa6f3',
  },
  {
    name: 'green',
    label: 'Green',
    lightColor: '#76ce9e',
    darkColor: '#76ce9e',
  },
  {
    name: 'orange',
    label: 'Orange',
    lightColor: '#e6964f',
    darkColor: '#e6964f',
  },
  {
    name: 'red',
    label: 'Red',
    lightColor: '#e07a75',
    darkColor: '#e07a75',
  },
  {
    name: 'rose',
    label: 'Rose',
    lightColor: '#e37b87',
    darkColor: '#e37b87',
  },
  {
    name: 'violet',
    label: 'Violet',
    lightColor: '#a490f2',
    darkColor: '#a490f2',
  },
  {
    name: 'yellow',
    label: 'Yellow',
    lightColor: '#eecc4b',
    darkColor: '#eecc4b',
  },
  {
    name: 'adaptive',
    label: 'Adaptive',
    lightColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    darkColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    isGradient: true,
  },
];

export function getThemeColor(
  colorName: ThemeColor,
  mode: 'light' | 'dark'
): string {
  const theme = THEME_COLORS.find((t) => t.name === colorName);
  if (!theme) return mode === 'light' ? '#1a1a1a' : '#ebebeb';
  
  // For adaptive theme, return a gradient color for animation
  if (colorName === 'adaptive') {
    return '#667eea'; // Use the primary gradient color for animation
  }
  
  return mode === 'light' ? theme.lightColor : theme.darkColor;
}
