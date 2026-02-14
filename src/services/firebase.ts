/**
 * Firebase service layer.
 *
 * Auto-initialized from google-services.json (Android) and
 * GoogleService-Info.plist (iOS). No manual `initializeApp()` needed
 * with @react-native-firebase.
 *
 * Uses the modular API (v22+) to avoid deprecation warnings.
 */
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
