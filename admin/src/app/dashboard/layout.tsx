"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/sidebar";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firebaseUser, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && (!firebaseUser || !isAdmin)) {
      router.replace("/login");
    }
  }, [firebaseUser, isAdmin, loading, router]);

  // Listen for sidebar state changes via custom event
  useEffect(() => {
    const handleSidebarToggle = (e: CustomEvent) => {
      setSidebarCollapsed(e.detail.collapsed);
    };
    window.addEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!firebaseUser || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main 
        className="transition-all duration-300"
        style={{ 
          paddingLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 
            ? (sidebarCollapsed ? '5rem' : '16rem') 
            : '0' 
        }}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
