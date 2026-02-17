/**
 * Firebase Cloud Function to send push notifications when an agent
 * receives a new review.
 *
 * Triggered when a new review document is created in Firestore.
 * Sends an FCM notification to the reviewed agent.
 */
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

interface Review {
  reviewId: string;
  agentId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
}

interface User {
  uid: string;
  fcmTokens?: string[];
  displayName: string;
}

/**
 * Cloud Function triggered when a new review is created.
 * Sends a push notification to the agent who received the review.
 */
export const onReviewReceived = onDocumentCreated(
  'reviews/{reviewId}',
  async (event) => {
    try {
      const snapshot = event.data;
      if (!snapshot) {
        console.log('[ReviewNotif] No data in snapshot');
        return;
      }

      const review = snapshot.data() as Review;
      const agentId = review.agentId;

      if (!agentId) {
        console.log('[ReviewNotif] No agentId in review');
        return;
      }

      console.log(
        `[ReviewNotif] New review for agent ${agentId} from ${review.userName} (${review.rating} stars)`
      );

      // Get agent user document for FCM tokens
      const agentDoc = await admin
        .firestore()
        .collection('users')
        .doc(agentId)
        .get();

      if (!agentDoc.exists) {
        console.log(`[ReviewNotif] Agent ${agentId} not found`);
        return;
      }

      const agent = agentDoc.data() as User;
      const tokens = agent.fcmTokens || [];

      if (tokens.length === 0) {
        console.log(`[ReviewNotif] No FCM tokens for agent ${agentId}`);
        return;
      }

      // Build notification
      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      const title = 'New Review Received';
      const body = `${review.userName} rated you ${stars} — "${review.comment.substring(0, 80)}${review.comment.length > 80 ? '...' : ''}"`;

      // Send to all agent tokens
      const sendPromises: Promise<any>[] = [];

      for (const token of tokens) {
        const payload: admin.messaging.Message = {
          token,
          notification: {
            title,
            body,
          },
          data: {
            type: 'review_received',
            reviewId: event.params.reviewId,
            agentId,
            rating: String(review.rating),
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'application_updates',
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

        sendPromises.push(
          admin
            .messaging()
            .send(payload)
            .then((response) => {
              console.log(`[ReviewNotif] Sent to agent ${agentId}:`, response);
              return response;
            })
            .catch((error: any) => {
              console.error(`[ReviewNotif] Failed to send to ${agentId}:`, error);
              if (
                error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered'
              ) {
                console.log(`[ReviewNotif] Removing invalid token for ${agentId}`);
                return admin
                  .firestore()
                  .collection('users')
                  .doc(agentId)
                  .update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
                  });
              }
              return null;
            })
        );
      }

      await Promise.all(sendPromises);
      console.log(`[ReviewNotif] Completed for agent ${agentId}`);
    } catch (err: any) {
      console.error('[ReviewNotif] Error:', err);
    }
  }
);
