/**
 * Push notification service for Firebase Cloud Messaging (FCM).
 *
 * Handles:
 * - Requesting notification permissions
 * - Managing FCM tokens
 * - Handling foreground/background notifications via Notifee
 * - Displaying native notifications with Mark as Read and Reply actions
 * - Navigating to chats from notifications
 *
 * Uses the modular Firebase API (v22+) and @notifee/react-native for
 * native notification display.
 */
import {
  getToken,
  requestPermission,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  getInitialNotification as getInitialNotificationModular,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import type { RemoteMessage } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidCategory } from '@notifee/react-native';
import { auth, db, messaging } from './firebase';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove } from '@react-native-firebase/firestore';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Android notification channel ID (must match the one in the Cloud Function) */
export const CHAT_CHANNEL_ID = 'chat_messages';

/** Notification action IDs */
export const NOTIFICATION_ACTIONS = {
  DEFAULT: 'default',
  MARK_READ: 'mark_read',
  REPLY: 'reply',
} as const;

/** Notification data payload type from FCM */
export type NotificationData = { [key: string]: string | object };

// ─── Channel & Category Setup ─────────────────────────────────────────────────

/**
 * Create the Android notification channel for chat messages.
 * Must be called before displaying any notifications on Android 8+.
 * Safe to call multiple times (idempotent).
 */
export async function createNotificationChannel(): Promise<void> {
  try {
    await notifee.createChannel({
      id: CHAT_CHANNEL_ID,
      name: 'Chat Messages',
      description: 'Notifications for new chat messages',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
    console.log('[Notifications] Android channel created:', CHAT_CHANNEL_ID);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Notifications] Failed to create channel:', message);
  }
}

/**
 * Set up iOS notification categories with Mark as Read and Reply actions.
 * Must be called before displaying any notifications on iOS.
 */
export async function setupNotificationCategories(): Promise<void> {
  try {
    await notifee.setNotificationCategories([
      {
        id: 'chat_message',
        actions: [
          {
            id: NOTIFICATION_ACTIONS.MARK_READ,
            title: 'Mark as Read',
          },
          {
            id: NOTIFICATION_ACTIONS.REPLY,
            title: 'Reply',
            input: {
              placeholderText: 'Type a reply...',
            },
          },
        ],
      },
    ]);
    console.log('[Notifications] iOS notification categories set up');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Notifications] Failed to set up categories:', message);
  }
}

// ─── Notification Display ─────────────────────────────────────────────────────

/**
 * Display a chat notification using Notifee.
 * Shows in the system notification tray with text preview,
 * Mark as Read button, and inline Reply action.
 */
export async function displayChatNotification(
  title: string,
  body: string,
  data: Record<string, string>
): Promise<string | undefined> {
  try {
    const notificationId = await notifee.displayNotification({
      title,
      body,
      data,
      android: {
        channelId: CHAT_CHANNEL_ID,
        category: AndroidCategory.MESSAGE,
        importance: AndroidImportance.HIGH,
        sound: 'default',
        pressAction: {
          id: NOTIFICATION_ACTIONS.DEFAULT,
        },
        actions: [
          {
            title: 'Mark as Read',
            pressAction: {
              id: NOTIFICATION_ACTIONS.MARK_READ,
            },
          },
          {
            title: 'Reply',
            pressAction: {
              id: NOTIFICATION_ACTIONS.REPLY,
            },
            input: {
              placeholder: 'Type a reply...',
            },
          },
        ],
      },
      ios: {
        categoryId: 'chat_message',
        sound: 'default',
      },
    });
    console.log('[Notifications] Displayed notification:', notificationId);
    return notificationId;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Notifications] Failed to display notification:', message);
    return undefined;
  }
}

// ─── Permission & Token Management ────────────────────────────────────────────

/**
 * Request notification permissions from the user.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    console.log('[Notifications] Requesting permission...');
    const authStatus = await requestPermission(messaging);
    console.log('[Notifications] Auth status:', authStatus);

    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('[Notifications] Permission granted:', authStatus);
      return true;
    } else {
      console.log('[Notifications] Permission denied:', authStatus);
      return false;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Notifications] Permission request failed:', message, err);
    return false;
  }
}

/**
 * Get the current FCM token for this device.
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await getToken(messaging);
    console.log('[Notifications] FCM Token:', token);
    return token;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Notifications] Failed to get FCM token:', message);
    return null;
  }
}

/**
 * Save the FCM token to the user's Firestore document.
 * Tokens are stored in an array to support multiple devices.
 *
 * Uses setDoc with merge to handle cases where the user document
 * may not exist yet (e.g., new Google sign-in users).
 */
export async function saveFCMToken(userId: string, token: string): Promise<void> {
  try {
    await setDoc(doc(db, 'users', userId), { fcmTokens: arrayUnion(token) }, { merge: true });
    console.log('[Notifications] FCM token saved for user:', userId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Notifications] Failed to save FCM token:', message);
    throw err;
  }
}

/**
 * Remove the FCM token from the user's Firestore document.
 * Call this on logout or when the token is invalidated.
 */
export async function removeFCMToken(userId: string, token: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      fcmTokens: arrayRemove(token),
    });
    console.log('[Notifications] FCM token removed for user:', userId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Notifications] Failed to remove FCM token:', message);
  }
}

/**
 * Initialize push notifications for the current user.
 * - Creates notification channel (Android) and categories (iOS)
 * - Requests permission
 * - Gets FCM token
 * - Saves token to Firestore
 * - Sets up token refresh listener
 *
 * Returns the unsubscribe function for token refresh listener.
 */
export async function initializePushNotifications(userId: string): Promise<(() => void) | null> {
  try {
    console.log('[Notifications] Starting initialization for user:', userId);

    // Create Android notification channel and iOS categories
    await createNotificationChannel();
    await setupNotificationCategories();

    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('[Notifications] User denied permission');
      return null;
    }

    console.log('[Notifications] Permission granted, getting token...');

    // Get FCM token
    const token = await getFCMToken();
    if (!token) {
      console.log('[Notifications] Failed to get FCM token');
      return null;
    }

    console.log('[Notifications] Token received, saving to Firestore...');

    // Save token to Firestore
    await saveFCMToken(userId, token);

    console.log('[Notifications] Token saved, setting up refresh listener...');

    // Listen for token refresh
    const unsubscribe = onTokenRefresh(messaging, async (newToken: string) => {
      console.log('[Notifications] Token refreshed:', newToken);
      try {
        // Remove old token and add new one
        if (token) {
          await removeFCMToken(userId, token);
        }
        await saveFCMToken(userId, newToken);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[Notifications] Failed to update refreshed token:', message);
      }
    });

    console.log('[Notifications] Initialization complete!');
    return unsubscribe;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Notifications] Initialization failed:', message, err);
    return null;
  }
}

/**
 * Clean up push notifications on logout.
 * Removes the FCM token from Firestore if user is still authenticated.
 */
export async function cleanupPushNotifications(userId: string): Promise<void> {
  try {
    // Guard: Don't try to modify Firestore if user is already signed out
    if (!auth.currentUser) {
      console.log('[Notifications] Skipping cleanup - user already signed out');
      return;
    }

    const token = await getFCMToken();
    if (token) {
      await removeFCMToken(userId, token);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Notifications] Cleanup failed:', message);
  }
}

/**
 * Handle notification tap when app was opened from a quit state.
 * Returns the notification data or null.
 */
export async function getInitialNotification(): Promise<
  { [key: string]: string | object } | undefined | null
> {
  try {
    const remoteMessage = await getInitialNotificationModular(messaging);
    if (remoteMessage) {
      console.log('[Notifications] App opened from notification:', remoteMessage);
      return remoteMessage.data;
    }
    return null;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Notifications] Failed to get initial notification:', message);
    return null;
  }
}

// ─── FCM Message Handlers ─────────────────────────────────────────────────────

/**
 * Set up foreground notification handler.
 * Displays a native notification via Notifee when an FCM message arrives
 * while the app is in the foreground. The notification appears in the
 * system tray with Mark as Read and Reply actions.
 *
 * Returns the unsubscribe function.
 */
export function setupForegroundNotificationHandler(): () => void {
  return onMessage(messaging, async (remoteMessage: RemoteMessage) => {
    console.log('[Notifications] Foreground message received:', remoteMessage);

    const { notification, data } = remoteMessage;

    if (notification) {
      // Display as a real system notification via Notifee
      await displayChatNotification(
        notification.title || 'New Message',
        notification.body || '',
        (data as Record<string, string>) || {}
      );
    }
  });
}

/**
 * Set up handler for when user taps a notification while app is in background.
 * This handles FCM-delivered background notifications (not Notifee ones).
 *
 * Returns the unsubscribe function.
 */
export function setupBackgroundNotificationHandler(
  onNotification?: (data: NotificationData) => void
): () => void {
  return onNotificationOpenedApp(messaging, (remoteMessage: RemoteMessage) => {
    console.log('[Notifications] Background notification opened:', remoteMessage);

    if (onNotification && remoteMessage.data) {
      onNotification(remoteMessage.data);
    }
  });
}
