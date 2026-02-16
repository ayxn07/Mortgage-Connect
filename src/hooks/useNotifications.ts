/**
 * Hook for managing push notifications in the app.
 *
 * Handles:
 * - Initializing notifications on login (FCM + Notifee)
 * - Setting up foreground/background notification handlers
 * - Processing notification action presses (Mark as Read, Reply)
 * - Navigating to chats from notification taps
 * - Cleaning up on logout
 */
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import notifee, { EventType } from '@notifee/react-native';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import {
  initializePushNotifications,
  cleanupPushNotifications,
  getInitialNotification,
  setupForegroundNotificationHandler,
  setupBackgroundNotificationHandler,
} from '../services/notifications';
import { handleNotificationAction } from '../services/notifeeEvents';

export function useNotifications() {
  const router = useRouter();
  const routerRef = useRef(router);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const notificationEnabled = useNotificationStore((s) => s.enabled);
  const loadPreference = useNotificationStore((s) => s.loadPreference);
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Keep router ref in sync without triggering effect re-runs
  routerRef.current = router;

  // Load notification preference on mount
  useEffect(() => {
    loadPreference();
  }, [loadPreference]);

  /**
   * Initialize notifications when user logs in
   */
  useEffect(() => {
    if (!firebaseUser?.uid || !notificationEnabled) {
      console.log('[Notifications] Skipping initialization:', {
        hasUser: !!firebaseUser?.uid,
        enabled: notificationEnabled,
      });
      return;
    }

    console.log('[Notifications] Initializing for user:', firebaseUser.uid);

    /** Navigate to a chat screen from notification data */
    const navigateToChat = (data: { [key: string]: string | object }) => {
      if (data?.type === 'chat_message' && data?.chatId) {
        console.log('[Notifications] Navigating to chat:', data.chatId);
        routerRef.current.push(`/chat/${data.chatId}`);
      }
    };

    const setup = async () => {
      try {
        // Initialize push notifications (creates channel, requests permission, saves token)
        const tokenRefreshUnsub = await initializePushNotifications(firebaseUser.uid);
        if (tokenRefreshUnsub) {
          unsubscribeRefs.current.push(tokenRefreshUnsub);
        }

        // Set up FCM foreground handler — displays Notifee notification
        const foregroundUnsub = setupForegroundNotificationHandler();
        unsubscribeRefs.current.push(foregroundUnsub);

        // Set up FCM background notification tap handler (for FCM-delivered notifications)
        const backgroundUnsub = setupBackgroundNotificationHandler(navigateToChat);
        unsubscribeRefs.current.push(backgroundUnsub);

        // Set up Notifee foreground event handler for action presses and notification taps
        const notifeeUnsub = notifee.onForegroundEvent(async ({ type, detail }) => {
          console.log('[Notifications] Foreground event:', EventType[type]);
          const result = await handleNotificationAction(type, detail);

          // Navigate to chat if the action requires it (e.g., notification tap)
          if (result.navigateToChatId) {
            navigateToChat({
              type: 'chat_message',
              chatId: result.navigateToChatId,
            });
          }
        });
        unsubscribeRefs.current.push(notifeeUnsub);

        // Check if app was opened from a quit-state notification
        const initialNotification = await getInitialNotification();
        if (initialNotification) {
          navigateToChat(initialNotification);
        }

        // Also check Notifee initial notification (for Notifee-displayed notifications)
        const notifeeInitial = await notifee.getInitialNotification();
        if (notifeeInitial?.notification?.data) {
          const data = notifeeInitial.notification.data as Record<string, string>;
          if (data.type === 'chat_message' && data.chatId) {
            navigateToChat(data);
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[Notifications] Setup failed:', message);
      }
    };

    setup();

    // Cleanup on unmount or user change
    return () => {
      console.log('[Notifications] Cleaning up');
      unsubscribeRefs.current.forEach((unsub) => unsub());
      unsubscribeRefs.current = [];

      if (firebaseUser?.uid) {
        cleanupPushNotifications(firebaseUser.uid).catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error('[Notifications] Cleanup error:', message);
        });
      }
    };
  }, [firebaseUser?.uid, notificationEnabled]);

  return {
    // Expose any notification-related state or methods if needed
  };
}
