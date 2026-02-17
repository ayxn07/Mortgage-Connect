/**
 * Firebase Cloud Function to send push notifications when an application
 * status changes.
 *
 * Triggered when an application document is updated in Firestore.
 * Sends an FCM notification to the application owner when the status
 * field changes (e.g., pending -> under_review -> approved/rejected).
 */
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

interface Application {
  applicationId: string;
  userId: string;
  agentId?: string | null;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  personalDetails?: {
    fullName: string;
  };
}

interface User {
  uid: string;
  fcmTokens?: string[];
  displayName: string;
}

/** Human-readable status labels */
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

/** Notification body templates per status */
const STATUS_MESSAGES: Record<string, string> = {
  pending: 'Your mortgage application has been received and is pending review.',
  under_review: 'Great news! Your mortgage application is now being reviewed by our team.',
  approved: 'Congratulations! Your mortgage application has been approved.',
  rejected: 'Unfortunately, your mortgage application was not approved. Please contact support for details.',
};

/**
 * Cloud Function triggered when an application document is updated.
 * Sends a push notification to the user when the status changes.
 */
export const onApplicationStatusChange = onDocumentUpdated(
  'applications/{applicationId}',
  async (event) => {
    try {
      const beforeData = event.data?.before?.data() as Application | undefined;
      const afterData = event.data?.after?.data() as Application | undefined;

      if (!beforeData || !afterData) {
        console.log('[AppStatus] No data in event');
        return;
      }

      // Only trigger on status change
      if (beforeData.status === afterData.status) {
        return;
      }

      const applicationId = event.params.applicationId;
      const userId = afterData.userId;
      const newStatus = afterData.status;
      const oldStatus = beforeData.status;

      console.log(
        `[AppStatus] Application ${applicationId} status changed: ${oldStatus} -> ${newStatus}`
      );

      // Get user document for FCM tokens
      const userDoc = await admin
        .firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        console.log(`[AppStatus] User ${userId} not found`);
        return;
      }

      const user = userDoc.data() as User;
      const tokens = user.fcmTokens || [];

      if (tokens.length === 0) {
        console.log(`[AppStatus] No FCM tokens for user ${userId}`);
        return;
      }

      // Build notification
      const title = `Application ${STATUS_LABELS[newStatus] || newStatus}`;
      const body = STATUS_MESSAGES[newStatus] || `Your application status has been updated to ${newStatus}.`;

      // Send to all user tokens
      const sendPromises: Promise<any>[] = [];

      for (const token of tokens) {
        const payload: admin.messaging.Message = {
          token,
          notification: {
            title,
            body,
          },
          data: {
            type: 'application_status',
            applicationId,
            status: newStatus,
            previousStatus: oldStatus,
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
              console.log(`[AppStatus] Notification sent to ${userId}:`, response);
              return response;
            })
            .catch((error: any) => {
              console.error(`[AppStatus] Failed to send to ${userId}:`, error);
              // Remove invalid tokens
              if (
                error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered'
              ) {
                console.log(`[AppStatus] Removing invalid token for ${userId}`);
                return admin
                  .firestore()
                  .collection('users')
                  .doc(userId)
                  .update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
                  });
              }
              return null;
            })
        );
      }

      await Promise.all(sendPromises);

      // Create an audit log entry for the status change
      await admin
        .firestore()
        .collection('auditLogs')
        .add({
          action: 'application_status_change',
          applicationId,
          userId,
          previousStatus: oldStatus,
          newStatus,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log(`[AppStatus] Completed for application ${applicationId}`);
    } catch (err: any) {
      console.error('[AppStatus] Error:', err);
    }
  }
);
