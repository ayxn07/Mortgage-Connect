import { firestore, storage } from './firebase';
import type { MortgageApplication, UploadedDocument, DocumentCategory } from '../types';

/**
 * Create a new mortgage application in Firestore.
 */
export async function createApplication(
  data: Omit<MortgageApplication, 'applicationId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await firestore()
    .collection('applications')
    .add({
      ...data,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  return docRef.id;
}

/**
 * Fetch all applications for a given user.
 */
export async function fetchUserApplications(userId: string): Promise<MortgageApplication[]> {
  const snapshot = await firestore()
    .collection('applications')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(
    (doc) => ({ ...doc.data(), applicationId: doc.id }) as MortgageApplication
  );
}

/**
 * Fetch a single application by ID.
 */
export async function fetchApplicationById(
  applicationId: string
): Promise<MortgageApplication | null> {
  const doc = await firestore().collection('applications').doc(applicationId).get();
  if (!doc.exists) return null;
  return { ...doc.data(), applicationId: doc.id } as MortgageApplication;
}

/**
 * Update an existing application (partial update).
 */
export async function updateApplication(
  applicationId: string,
  data: Partial<MortgageApplication>
) {
  return firestore()
    .collection('applications')
    .doc(applicationId)
    .update({
      ...data,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Save a draft application. Creates if no ID, updates if exists.
 */
export async function saveDraft(
  data: Omit<MortgageApplication, 'applicationId' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<string> {
  if (existingId) {
    await updateApplication(existingId, { ...data, status: 'draft' } as Partial<MortgageApplication>);
    return existingId;
  }
  return createApplication({ ...data, status: 'draft' });
}

/**
 * Upload a document to Firebase Storage and return metadata.
 *
 * @param userId - The authenticated user's UID
 * @param applicationId - The application this document belongs to
 * @param category - The document category (e.g. 'emirates_id_front')
 * @param fileUri - Local file URI from document picker
 * @param fileName - Original file name
 * @param fileSize - File size in bytes
 * @param mimeType - MIME type of the file
 */
export async function uploadDocument(
  userId: string,
  applicationId: string,
  category: DocumentCategory,
  fileUri: string,
  fileName: string,
  fileSize: number,
  mimeType: string
): Promise<UploadedDocument> {
  // Generate unique storage path
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `applications/${userId}/${applicationId}/${category}_${timestamp}_${safeName}`;

  const reference = storage().ref(storagePath);
  await reference.putFile(fileUri);
  const downloadURL = await reference.getDownloadURL();

  return {
    id: `${category}_${timestamp}`,
    category,
    fileName,
    fileSize,
    mimeType,
    downloadURL,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Delete a document from Firebase Storage.
 */
export async function deleteDocument(downloadURL: string): Promise<void> {
  try {
    const reference = storage().refFromURL(downloadURL);
    await reference.delete();
  } catch (error) {
    // File may already be deleted, ignore
    console.warn('Failed to delete document:', error);
  }
}

/**
 * Submit an application (change status from draft to submitted).
 */
export async function submitApplication(applicationId: string): Promise<void> {
  await firestore()
    .collection('applications')
    .doc(applicationId)
    .update({
      status: 'submitted',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
}
