import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationPreferences } from '../types';

interface SettingsState {
  /** Notification preference flags */
  notifications: NotificationPreferences;
  /** Language preference */
  language: string;

  // --- Actions ---
  /** Toggle a specific notification channel */
  setNotification: (channel: keyof NotificationPreferences, enabled: boolean) => void;
  /** Set language preference */
  setLanguage: (language: string) => void;
  /** Reset to defaults */
  resetSettings: () => void;
}

const DEFAULT_SETTINGS = {
  notifications: {
    push: true,
    email: true,
    sms: false,
  },
  language: 'English',
};

/**
 * Settings store with AsyncStorage persistence.
 * Notification toggles and preferences survive app restarts.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setNotification: (channel, enabled) => {
        set((state) => ({
          notifications: { ...state.notifications, [channel]: enabled },
        }));
      },

      setLanguage: (language) => {
        set({ language });
      },

      resetSettings: () => {
        set({ ...DEFAULT_SETTINGS });
      },
    }),
    {
      name: 'mortgage-connect-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
