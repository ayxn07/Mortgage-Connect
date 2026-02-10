/**
 * Firebase service layer.
 *
 * Auto-initialized from google-services.json (Android) and
 * GoogleService-Info.plist (iOS). No manual `initializeApp()` needed
 * with @react-native-firebase.
 */
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export { auth, firestore, storage };
