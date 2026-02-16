/**
 * Firebase Cloud Function to send push notifications for new chat messages.
 *
 * Triggered when a new message is created in Firestore.
 * Sends FCM notifications to all participants except the sender.
 */
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

interface Message {
  messageId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  type: 'text' | 'image' | 'document' | 'system';
  content: {
    text?: string;
    mediaUrl?: string;
    fileName?: string;
  };
  timestamp: admin.firestore.Timestamp;
}

interface Chat {
  chatId: string;
  participantIds: string[];
  participants: Record<string, any>;
  muted: Record<string, boolean>;
}

interface User {
  uid: string;
  fcmTokens?: string[];
  displayName: string;
}

interface UserPresence {
  uid: string;
  isOnline: boolean;
  currentChatId?: string | null;
}

/**
 * Cloud Function triggered when a new message is created.
 * Sends push notifications to all participants except the sender.
 */
export const sendChatNotification = onDocumentCreated(
  'chats/{chatId}/messages/{messageId}',
  async (event) => {
    try {
      const snapshot = event.data;
      if (!snapshot) {
        console.log('[Notification] No data in snapshot');
        return;
      }

      const message = snapshot.data() as Message;
      const chatId = event.params.chatId;
      const senderId = message.senderId;

      console.log(`[Notification] New message in chat ${chatId} from ${senderId}`);

      // Get chat document to find participants
      const chatDoc = await admin
        .firestore()
        .collection('chats')
        .doc(chatId)
        .get();

      if (!chatDoc.exists) {
        console.log('[Notification] Chat not found');
        return;
      }

      const chat = chatDoc.data() as Chat;
      const recipientIds = chat.participantIds.filter((id) => id !== senderId);

      if (recipientIds.length === 0) {
        console.log('[Notification] No recipients to notify');
        return;
      }

      // Get recipient user documents to fetch FCM tokens
      const recipientPromises = recipientIds.map((uid) =>
        admin.firestore().collection('users').doc(uid).get()
      );
      const recipientDocs = await Promise.all(recipientPromises);

      // Get recipient presence to check if they're viewing this chat
      const presencePromises = recipientIds.map((uid) =>
        admin.firestore().collection('userPresence').doc(uid).get()
      );
      const presenceDocs = await Promise.all(presencePromises);

      // Build notification payload
      const notificationTitle = message.senderName;
      let notificationBody = '';

      switch (message.type) {
        case 'text':
          notificationBody = message.content.text || 'Sent a message';
          break;
        case 'image':
          notificationBody = '📷 Sent a photo';
          break;
        case 'document':
          notificationBody = `📎 Sent a file: ${message.content.fileName || 'document'}`;
          break;
        case 'system':
          notificationBody = message.content.text || 'System message';
          break;
      }

      // Truncate long messages
      if (notificationBody.length > 100) {
        notificationBody = notificationBody.substring(0, 97) + '...';
      }

      // Send notifications to each recipient
      const notificationPromises: Promise<any>[] = [];

      for (let i = 0; i < recipientDocs.length; i++) {
        const recipientDoc = recipientDocs[i];
        const presenceDoc = presenceDocs[i];

        if (!recipientDoc.exists) {
          console.log(`[Notification] Recipient ${recipientIds[i]} not found`);
          continue;
        }

        const recipient = recipientDoc.data() as User;
        const presence = presenceDoc.exists ? (presenceDoc.data() as UserPresence) : null;

        // Check if chat is muted for this recipient
        if (chat.muted?.[recipient.uid]) {
          console.log(`[Notification] Chat muted for ${recipient.uid}`);
          continue;
        }

        // Skip if recipient is currently viewing this chat
        if (presence?.isOnline && presence?.currentChatId === chatId) {
          console.log(`[Notification] Recipient ${recipient.uid} is viewing this chat`);
          continue;
        }

        // Get FCM tokens
        const tokens = recipient.fcmTokens || [];
        if (tokens.length === 0) {
          console.log(`[Notification] No FCM tokens for ${recipient.uid}`);
          continue;
        }

        // Send notification to all tokens
        for (const token of tokens) {
          const payload: admin.messaging.Message = {
            token,
            notification: {
              title: notificationTitle,
              body: notificationBody,
            },
            data: {
              type: 'chat_message',
              chatId,
              messageId: message.messageId,
              senderId,
              senderName: message.senderName,
            },
            android: {
              priority: 'high',
              notification: {
                channelId: 'chat_messages',
                sound: 'default',
                priority: 'high',
                defaultSound: true,
                defaultVibrateTimings: true,
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                  contentAvailable: true,
                },
              },
            },
          };

          notificationPromises.push(
            admin
              .messaging()
              .send(payload)
              .then((response) => {
                console.log(`[Notification] Sent to ${recipient.uid}:`, response);
                return response;
              })
              .catch((error: any) => {
                console.error(`[Notification] Failed to send to ${recipient.uid}:`, error);
                // If token is invalid, remove it from user document
                if (
                  error.code === 'messaging/invalid-registration-token' ||
                  error.code === 'messaging/registration-token-not-registered'
                ) {
                  console.log(`[Notification] Removing invalid token for ${recipient.uid}`);
                  return admin
                    .firestore()
                    .collection('users')
                    .doc(recipient.uid)
                    .update({
                      fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
                    });
                }
                return null;
              })
          );
        }
      }

      // Wait for all notifications to be sent
      await Promise.all(notificationPromises);
      console.log(`[Notification] Completed for chat ${chatId}`);
    } catch (err: any) {
      console.error('[Notification] Error:', err);
    }
  }
);
