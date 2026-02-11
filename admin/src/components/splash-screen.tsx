"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen() {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 1.5 seconds
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
        {/* Logo */}
        <Image
          src="/splash-icon.png"
          alt="MortgageConnect Logo"
          width={320}
          height={320}
          priority
          className="object-contain"
        />

        {/* Welcome Text */}
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome Admin
        </h1>
      </div>
    </div>
  );
}
