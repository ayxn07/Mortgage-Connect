import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Firebase is auto-initialized from google-services.json and GoogleService-Info.plist
// No need to call initializeApp() with React Native Firebase

// Export Firebase services
export { auth, firestore, storage };
