/**
 * Feature flags hook — subscribes to Firestore `appConfig/features` document.
 *
 * Admins can toggle features on/off from the admin dashboard, and
 * the mobile app reacts in real-time via onSnapshot.
 */
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { db } from '@/src/services/firebase';
import { useAuthStore } from '@/src/store/authStore';
import type { FeatureFlags } from '@/src/types/aiChat';

const DEFAULT_FLAGS: FeatureFlags = {
  aiAssistantEnabled: false,
};

export function useFeatureFlags(): { flags: FeatureFlags; loading: boolean } {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  useEffect(() => {
    // Only subscribe if user is authenticated
    if (!firebaseUser) {
      setFlags(DEFAULT_FLAGS);
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'appConfig', 'features');
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<FeatureFlags>;
          setFlags({
            aiAssistantEnabled: data.aiAssistantEnabled ?? false,
          });
        } else {
          setFlags(DEFAULT_FLAGS);
        }
        setLoading(false);
      },
      (error) => {
        console.error('[FeatureFlags] Error subscribing:', error);
        setFlags(DEFAULT_FLAGS);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  return { flags, loading };
}
