"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SplashScreen } from "@/components/splash-screen";

export default function HomePage() {
  const { firebaseUser, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash after minimum display time
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    // Only navigate after splash is done and auth is loaded
    if (!loading && !showSplash) {
      if (firebaseUser && isAdmin) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [firebaseUser, isAdmin, loading, showSplash, router]);

  if (showSplash || loading) {
    return <SplashScreen />;
  }

  return null;
}
