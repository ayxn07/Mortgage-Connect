import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBmY9vmcKglkNVRa0-j4M3POOSgr8R6tPA",
  authDomain: "mortgage-connect-5b774.firebaseapp.com",
  projectId: "mortgage-connect-5b774",
  storageBucket: "mortgage-connect-5b774.firebasestorage.app",
  messagingSenderId: "571691878268",
  appId: "1:571691878268:web:admin-dashboard",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
