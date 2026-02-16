import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  hasPermission,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { messaging } from '../services/firebase';

interface NotificationState {
  enabled: boolean;
  loading: boolean;
  systemStatus: AuthorizationStatus | null;
  setEnabled: (enabled: boolean) => Promise<void>;
  loadPreference: () => Promise<void>;
  checkSystemPermission: () => Promise<AuthorizationStatus>;
  requestSystemPermission: () => Promise<boolean>;
  promptForPermission: () => Promise<boolean>;
}

const STORAGE_KEY = '@notifications_enabled';

export const useNotificationStore = create<NotificationState>((set, get) => ({
  enabled: true,
  loading: false,
  systemStatus: null,

  /**
   * Check the current system notification permission status
   * Returns the AuthorizationStatus without prompting the user
   */
  checkSystemPermission: async () => {
    try {
      const status = await hasPermission(messaging);
      set({ systemStatus: status });
      return status;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[NotificationStore] Failed to check permission:', message);
      return AuthorizationStatus.NOT_DETERMINED;
    }
  },

  /**
   * Request notification permission from the system (shows native dialog)
   * Returns true if granted, false otherwise
   */
  requestSystemPermission: async () => {
    try {
      console.log('[NotificationStore] Requesting system permission...');
      const authStatus = await requestPermission(messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      set({ systemStatus: authStatus });

      if (enabled) {
        console.log('[NotificationStore] System permission granted');
      } else {
        console.log('[NotificationStore] System permission denied:', authStatus);
      }
      return enabled;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[NotificationStore] Permission request failed:', message);
      return false;
    }
  },

  /**
   * Prompt user for notification permission with an explanation
   * This should be called after account creation or when user manually enables
   */
  promptForPermission: async () => {
    const { checkSystemPermission, requestSystemPermission, setEnabled } = get();

    // First check if we already have permission
    const currentStatus = await checkSystemPermission();
    if (
      currentStatus === AuthorizationStatus.AUTHORIZED ||
      currentStatus === AuthorizationStatus.PROVISIONAL
    ) {
      // Already have permission, just enable in our store
      await setEnabled(true);
      return true;
    }

    // Request system permission (shows native dialog)
    const granted = await requestSystemPermission();

    // Update our store to match system status
    await setEnabled(granted);

    return granted;
  },

  /**
   * Set notification preference in storage
   * When enabling, also requests system permission if not already granted
   */
  setEnabled: async (enabled: boolean) => {
    set({ loading: true });
    try {
      // If trying to enable, first check/request system permission
      if (enabled) {
        const { systemStatus, checkSystemPermission, requestSystemPermission } = get();

        // Check current system status
        const status = systemStatus ?? (await checkSystemPermission());

        // If not authorized, request it
        if (
          status !== AuthorizationStatus.AUTHORIZED &&
          status !== AuthorizationStatus.PROVISIONAL
        ) {
          const granted = await requestSystemPermission();
          if (!granted) {
            // System denied, don't enable in our store
            set({ enabled: false, loading: false });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(false));
            console.log('[NotificationStore] System denied, preference set to false');
            return;
          }
        }
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
      set({ enabled, loading: false });
      console.log('[NotificationStore] Preference saved:', enabled);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[NotificationStore] Failed to save preference:', message);
      set({ loading: false });
    }
  },

  /**
   * Load notification preference from storage
   * Also checks current system permission status
   */
  loadPreference: async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      const { checkSystemPermission } = get();

      // Check system permission status
      const systemStatus = await checkSystemPermission();
      const hasSystemPermission =
        systemStatus === AuthorizationStatus.AUTHORIZED ||
        systemStatus === AuthorizationStatus.PROVISIONAL;

      if (value !== null) {
        const storedEnabled = JSON.parse(value);
        // If stored as enabled but system denied, reflect reality
        const actualEnabled = storedEnabled && hasSystemPermission;
        set({ enabled: actualEnabled });
        console.log('[NotificationStore] Preference loaded:', actualEnabled);
      } else {
        // No stored preference - check if system has permission
        // If system has permission (maybe granted outside app), enable in store
        if (hasSystemPermission) {
          set({ enabled: true });
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(true));
          console.log('[NotificationStore] No preference, system granted, enabled');
        } else {
          set({ enabled: false });
          console.log('[NotificationStore] No preference, system not granted');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[NotificationStore] Failed to load preference:', message);
    }
  },
}));
