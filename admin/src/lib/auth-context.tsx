"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@/lib/types";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userDoc: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  completeSignIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userDoc: null,
  loading: true,
  isAdmin: false,
  signIn: async () => { },
  completeSignIn: async () => { },
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userDoc, setUserDoc] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserDoc(docSnap.data() as User);
          } else {
            setUserDoc(null);
          }
        } catch (error) {
          console.error("Error fetching user doc:", error);
          setUserDoc(null);
        }
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Store credentials in sessionStorage for later use after OTP verification
    sessionStorage.setItem('pendingEmail', email);
    sessionStorage.setItem('pendingPassword', password);

    const cred = await signInWithEmailAndPassword(auth, email, password);
    const docRef = doc(db, "users", cred.user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const userData = docSnap.data() as User;
      if (userData.role !== "admin") {
        await firebaseSignOut(auth);
        sessionStorage.removeItem('pendingEmail');
        sessionStorage.removeItem('pendingPassword');
        throw new Error("Access denied. Admin privileges required.");
      }
    } else {
      await firebaseSignOut(auth);
      sessionStorage.removeItem('pendingEmail');
      sessionStorage.removeItem('pendingPassword');
      throw new Error("User account not found.");
    }

    // Sign out immediately - they need to verify OTP
    await firebaseSignOut(auth);
  };

  const completeSignIn = async (email: string) => {
    // This is called after OTP verification
    // Get credentials from sessionStorage
    const pendingEmail = sessionStorage.getItem('pendingEmail');
    const pendingPassword = sessionStorage.getItem('pendingPassword');

    console.log('CompleteSignIn - Checking sessionStorage:', {
      hasPendingEmail: !!pendingEmail,
      hasPendingPassword: !!pendingPassword,
      emailMatch: pendingEmail === email
    });

    if (!pendingEmail || !pendingPassword) {
      throw new Error("Session expired. Please login again.");
    }

    const cred = await signInWithEmailAndPassword(auth, pendingEmail, pendingPassword);
    const docRef = doc(db, "users", cred.user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setUserDoc(docSnap.data() as User);
    }

    // Clear pending credentials from sessionStorage
    sessionStorage.removeItem('pendingEmail');
    sessionStorage.removeItem('pendingPassword');
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserDoc(null);
    sessionStorage.removeItem('pendingEmail');
    sessionStorage.removeItem('pendingPassword');
  };

  const isAdmin = userDoc?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ firebaseUser, userDoc, loading, isAdmin, signIn, completeSignIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
