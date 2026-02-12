/**
 * Profile service — handles profile image upload (Firebase Storage)
 * and profile data updates (Firestore) for all user roles.
 */
import { storage, firestore, auth } from './firebase';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import type { AgentService } from '../types/agent';

// ---------------------------------------------------------------------------
// Image picker helpers
// ---------------------------------------------------------------------------

/**
 * Launch the device camera to capture a profile photo.
 * Returns the local URI of the captured image, or null if cancelled.
 */
export async function pickImageFromCamera(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera permission is required to take a photo.');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0].uri;
}

/**
 * Launch the device gallery to select a profile photo.
 * Returns the local URI of the selected image, or null if cancelled.
 */
export async function pickImageFromGallery(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Photo library permission is required to select a photo.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0].uri;
}

// ---------------------------------------------------------------------------
// Firebase Storage upload
// ---------------------------------------------------------------------------

/**
 * Upload a local image file to Firebase Storage under `profile-photos/{uid}`.
 * Returns the public download URL.
 */
export async function uploadProfilePhoto(uid: string, localUri: string): Promise<string> {
  const filename = `profile-photos/${uid}_${Date.now()}.jpg`;
  const ref = storage().ref(filename);

  // On Android we may get a content:// URI — Firebase RN storage handles it.
  // On iOS it's a file:// path. Both work with putFile().
  const uri = Platform.OS === 'ios' ? localUri.replace('file://', '') : localUri;

  await ref.putFile(uri);
  const downloadURL = await ref.getDownloadURL();
  return downloadURL;
}

// ---------------------------------------------------------------------------
// Firestore profile updates
// ---------------------------------------------------------------------------

/** Update basic user fields (works for any role) */
export async function updateUserProfile(
  uid: string,
  data: {
    displayName?: string;
    phone?: string | null;
    photoURL?: string | null;
  }
) {
  return firestore()
    .collection('users')
    .doc(uid)
    .update({
      ...data,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
}

/** Update agent-specific fields (only for role === 'agent') */
export async function updateAgentProfile(
  uid: string,
  data: {
    displayName?: string;
    phone?: string | null;
    photoURL?: string | null;
    bio?: string;
    experience?: number;
    hourlyRate?: number;
    location?: string;
    responseTime?: string;
    whatsapp?: string;
    availability?: boolean;
    languages?: string[];
    specialty?: string[];
    services?: AgentService[];
  }
) {
  return firestore()
    .collection('users')
    .doc(uid)
    .update({
      ...data,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Upload a profile image and update the user's photoURL in Firestore.
 * Returns the new download URL.
 */
export async function uploadAndUpdateProfilePhoto(uid: string, localUri: string): Promise<string> {
  const downloadURL = await uploadProfilePhoto(uid, localUri);
  await updateUserProfile(uid, { photoURL: downloadURL });

  // Also update Firebase Auth profile
  const currentUser = auth().currentUser;
  if (currentUser) {
    await currentUser.updateProfile({ photoURL: downloadURL });
  }

  return downloadURL;
}
