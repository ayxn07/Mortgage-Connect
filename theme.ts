import { vars } from 'nativewind';

export interface ThemeFonts {
  heading: {
    family: string;
    weights: Record<string, string>;
  };
  body: {
    family: string;
    weights: Record<string, string>;
  };
  mono: {
    family: string;
    weights: Record<string, string>;
  };
}

export const themeFonts: ThemeFonts = {
  heading: {
    family: 'Inter',
    weights: {
      normal: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semibold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
    },
  },
  body: {
    family: 'Inter',
    weights: {
      normal: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semibold: 'Inter_600SemiBold',
    },
  },
  mono: {
    family: 'JetBrainsMono',
    weights: {
      normal: 'JetBrainsMono_400Regular',
      medium: 'JetBrainsMono_500Medium',
    },
  },
};

// Premium Black & White Theme with #333 accents
export const lightTheme = vars({
  '--radius': '16',

  '--background': '255 255 255',
  '--foreground': '0 0 0',

  '--card': '255 255 255',
  '--card-foreground': '0 0 0',

  '--popover': '255 255 255',
  '--popover-foreground': '0 0 0',

  '--primary': '0 0 0',
  '--primary-foreground': '255 255 255',

  '--secondary': '245 245 245',
  '--secondary-foreground': '0 0 0',

  '--muted': '245 245 245',
  '--muted-foreground': '51 51 51',

  '--accent': '51 51 51',
  '--accent-foreground': '255 255 255',

  '--destructive': '220 38 38',

  '--border': '229 229 229',
  '--input': '240 240 240',
  '--ring': '0 0 0',

  '--chart-1': '0 0 0',
  '--chart-2': '51 51 51',
  '--chart-3': '102 102 102',
  '--chart-4': '153 153 153',
  '--chart-5': '204 204 204',

  '--sidebar': '250 250 250',
  '--sidebar-foreground': '0 0 0',
  '--sidebar-primary': '0 0 0',
  '--sidebar-primary-foreground': '255 255 255',
  '--sidebar-accent': '245 245 245',
  '--sidebar-accent-foreground': '0 0 0',
  '--sidebar-border': '229 229 229',
  '--sidebar-ring': '0 0 0',
});

export const darkTheme = vars({
  '--radius': '16',

  '--background': '0 0 0',
  '--foreground': '255 255 255',

  '--card': '10 10 10',
  '--card-foreground': '255 255 255',

  '--popover': '20 20 20',
  '--popover-foreground': '255 255 255',

  '--primary': '255 255 255',
  '--primary-foreground': '0 0 0',

  '--secondary': '20 20 20',
  '--secondary-foreground': '255 255 255',

  '--muted': '51 51 51',
  '--muted-foreground': '153 153 153',

  '--accent': '51 51 51',
  '--accent-foreground': '255 255 255',

  '--destructive': '220 38 38',

  '--border': '51 51 51',
  '--input': '51 51 51',
  '--ring': '255 255 255',

  '--chart-1': '255 255 255',
  '--chart-2': '204 204 204',
  '--chart-3': '153 153 153',
  '--chart-4': '102 102 102',
  '--chart-5': '51 51 51',

  '--sidebar': '10 10 10',
  '--sidebar-foreground': '255 255 255',
  '--sidebar-primary': '255 255 255',
  '--sidebar-primary-foreground': '0 0 0',
  '--sidebar-accent': '51 51 51',
  '--sidebar-accent-foreground': '255 255 255',
  '--sidebar-border': '51 51 51',
  '--sidebar-ring': '255 255 255',
});
