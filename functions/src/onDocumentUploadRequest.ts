/**
 * Firebase Cloud Function to send push notifications when an admin
 * requests document uploads from a user.
 *
 * Triggered when an application's `documentRequest` field is added/updated.
 * This is set by admin when they need the user to upload missing documents.
 */
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

interface Application {
  applicationId: string;
  userId: string;
  status: string;
  documentRequest?: {
    requested: boolean;
    message: string;
    requestedAt: admin.firestore.Timestamp;
    documents: string[]; // e.g., ['Emirates ID', 'Salary Certificate']
  };
}

interface User {
  uid: string;
  fcmTokens?: string[];
  displayName: string;
}

/**
 * Cloud Function triggered when an application document is updated.
 * Sends a push notification when admin requests document uploads.
 */
export const onDocumentUploadRequest = onDocumentUpdated(
  'applications/{applicationId}',
  async (event) => {
    try {
      const beforeData = event.data?.before?.data() as Application | undefined;
      const afterData = event.data?.after?.data() as Application | undefined;

      if (!beforeData || !afterData) {
        console.log('[DocRequest] No data in event');
        return;
      }

      // Only trigger when documentRequest is newly added or updated
      const beforeRequest = beforeData.documentRequest;
      const afterRequest = afterData.documentRequest;

      if (!afterRequest?.requested) {
        return;
      }

      // Skip if request hasn't changed
      if (
        beforeRequest?.requested === afterRequest.requested &&
        beforeRequest?.message === afterRequest.message
      ) {
        return;
      }

      const applicationId = event.params.applicationId;
      const userId = afterData.userId;

      console.log(`[DocRequest] Document request for application ${applicationId}`);

      // Get user document for FCM tokens
      const userDoc = await admin
        .firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        console.log(`[DocRequest] User ${userId} not found`);
        return;
      }

      const user = userDoc.data() as User;
      const tokens = user.fcmTokens || [];

      if (tokens.length === 0) {
        console.log(`[DocRequest] No FCM tokens for user ${userId}`);
        return;
      }

      // Build notification
      const title = 'Documents Required';
      const documentList = afterRequest.documents?.join(', ') || 'additional documents';
      const body = afterRequest.message || `Please upload the following documents: ${documentList}`;

      // Send to all user tokens
      const sendPromises: Promise<any>[] = [];

      for (const token of tokens) {
        const payload: admin.messaging.Message = {
          token,
          notification: {
            title,
            body: body.length > 150 ? body.substring(0, 147) + '...' : body,
          },
          data: {
            type: 'document_request',
            applicationId,
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
              console.log(`[DocRequest] Sent to ${userId}:`, response);
              return response;
            })
            .catch((error: any) => {
              console.error(`[DocRequest] Failed to send to ${userId}:`, error);
              if (
                error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered'
              ) {
                console.log(`[DocRequest] Removing invalid token for ${userId}`);
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
      console.log(`[DocRequest] Completed for application ${applicationId}`);
    } catch (err: any) {
      console.error('[DocRequest] Error:', err);
    }
  }
);
