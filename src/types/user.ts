import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/** User roles in the platform */
export type UserRole = 'user' | 'agent' | 'admin';

/** Base user document stored in Firestore `users/{uid}` */
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  phone?: string | null;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

/** Notification preference flags */
export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
}

/** User settings stored alongside or embedded in user document */
export interface UserSettings {
  notifications: NotificationPreferences;
  language: string;
}

/** Data required to create a new user account */
export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
}

/** Data required to sign in */
export interface SignInInput {
  email: string;
  password: string;
}
