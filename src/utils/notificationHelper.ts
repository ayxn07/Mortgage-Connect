/**
 * Helper utilities for notification management.
 *
 * Uses the modular Firebase API (v22+) to avoid deprecation warnings.
 */
import { hasPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import { messaging } from '../services/firebase';

/**
 * Check if notification permission is granted.
 */
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    const authStatus = await hasPermission(messaging);
    return (
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[NotificationHelper] Permission check failed:', message);
    return false;
  }
}

/**
 * Get a human-readable notification permission status.
 */
export async function getNotificationPermissionStatus(): Promise<string> {
  try {
    const authStatus = await hasPermission(messaging);

    switch (authStatus) {
      case AuthorizationStatus.AUTHORIZED:
        return 'Authorized';
      case AuthorizationStatus.PROVISIONAL:
        return 'Provisional';
      case AuthorizationStatus.DENIED:
        return 'Denied';
      case AuthorizationStatus.NOT_DETERMINED:
        return 'Not Determined';
      default:
        return 'Unknown';
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[NotificationHelper] Status check failed:', message);
    return 'Error';
  }
}

/**
 * Format notification message preview.
 * Truncates long messages and adds ellipsis.
 */
export function formatNotificationBody(text: string, maxLength = 100): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get notification icon based on message type.
 */
export function getNotificationIcon(messageType: string): string {
  switch (messageType) {
    case 'image':
      return '📷';
    case 'document':
      return '📎';
    case 'system':
      return 'ℹ️';
    default:
      return '💬';
  }
}
