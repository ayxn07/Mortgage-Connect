/**
 * Notifee notification event handlers.
 *
 * Handles user interactions with displayed notifications:
 * - Tap to open chat (default press)
 * - Mark as Read action
 * - Reply action (inline text input)
 *
 * The background event handler is registered at module scope so it
 * works even when the app is killed. This file must be imported early
 * (e.g., from app/_layout.tsx) to ensure registration.
 */
import notifee, { EventType } from '@notifee/react-native';
import type { Event as NotifeeEvent } from '@notifee/react-native';
import { setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { auth, messaging } from './firebase';
import { markChatAsRead, sendMessage } from './chat';
import {
  NOTIFICATION_ACTIONS,
  displayChatNotification,
  createNotificationChannel,
} from './notifications';

/** Result of handling a notification action */
export interface NotificationActionResult {
  /** Whether the action was fully handled (no further processing needed) */
  handled: boolean;
  /** Chat ID to navigate to (when user taps the notification) */
  navigateToChatId?: string;
}

/**
 * Process a notification event (action press or notification tap).
 * Used by both foreground and background event handlers.
 *
 * @returns Result indicating if the action was handled and optional navigation target
 */
export async function handleNotificationAction(
  type: EventType,
  detail: NotifeeEvent['detail']
): Promise<NotificationActionResult> {
  const { notification, pressAction, input } = detail;
  const data = notification?.data as Record<string, string> | undefined;

  if (!data?.chatId) {
    return { handled: false };
  }

  const chatId = data.chatId;
  const currentUser = auth.currentUser;

  // Handle action button presses (Mark as Read, Reply)
  if (type === EventType.ACTION_PRESS && pressAction) {
    switch (pressAction.id) {
      case NOTIFICATION_ACTIONS.MARK_READ: {
        if (currentUser?.uid) {
          try {
            await markChatAsRead(chatId, currentUser.uid);
            // Dismiss the notification after marking as read
            if (notification?.id) {
              await notifee.cancelNotification(notification.id);
            }
            console.log('[Notifications] Marked as read:', chatId);
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('[Notifications] Failed to mark as read:', message);
          }
        }
        return { handled: true };
      }

      case NOTIFICATION_ACTIONS.REPLY: {
        if (currentUser?.uid && input) {
          try {
            await sendMessage(
              chatId,
              currentUser.uid,
              currentUser.displayName || 'User',
              currentUser.photoURL || null,
              input,
              'text'
            );
            // Dismiss the notification after reply is sent
            if (notification?.id) {
              await notifee.cancelNotification(notification.id);
            }
            console.log('[Notifications] Quick reply sent to:', chatId);
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('[Notifications] Failed to send reply:', message);
          }
        }
        return { handled: true };
      }

      default:
        // Unknown action or default press from action — navigate to chat
        return { handled: false, navigateToChatId: chatId };
    }
  }

  // Handle notification body tap (default press)
  if (type === EventType.PRESS) {
    return { handled: false, navigateToChatId: chatId };
  }

  // Dismiss event or other events — no action needed
  return { handled: true };
}

// ─── Background Event Handler ─────────────────────────────────────────────────
// Registered at module scope so it works when the app is in background or killed.
// Navigation is not possible from background — only data operations (mark read, reply).

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('[Notifications] Background event:', EventType[type]);
  await handleNotificationAction(type, detail);
});

// ─── FCM Background Message Handler ──────────────────────────────────────────
// Handles FCM data-only messages when the app is in background or killed.
// Displays the notification via Notifee so it appears with Mark as Read
// and Reply actions.

setBackgroundMessageHandler(messaging, async (remoteMessage) => {
  console.log('[Notifications] FCM background message:', remoteMessage);

  const { notification, data } = remoteMessage;

  // Only handle data-only messages here. Messages with a `notification`
  // payload are automatically displayed by the OS in background.
  if (!notification && data) {
    await createNotificationChannel();
    await displayChatNotification(
      (data.senderName as string) || 'New Message',
      (data.text as string) || 'You have a new message',
      data as Record<string, string>
    );
  }
});
