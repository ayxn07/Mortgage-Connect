"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  HeadphonesIcon,
  BarChart3,
  MessageCircle,
  LogOut,
  Menu,
  X,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Chat } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/lib/theme-context";
import { getThemeColor } from "@/lib/theme-config";

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Agents",
    href: "/dashboard/agents",
    icon: UserCheck,
  },
  {
    title: "Applications",
    href: "/dashboard/applications",
    icon: FileText,
  },
  {
    title: "Support",
    href: "/dashboard/support",
    icon: HeadphonesIcon,
  },
  {
    title: "Chats",
    href: "/dashboard/chats",
    icon: MessageCircle,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut, userDoc, firebaseUser } = useAuth();
  const { themeColor, theme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Subscribe to unread chat count for the admin
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const q = query(
      collection(db, "chats"),
      where("participantIds", "array-contains", firebaseUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.docs.forEach((doc) => {
        const chat = doc.data() as Chat;
        total += chat.unreadCount?.[firebaseUser.uid] || 0;
      });
      setUnreadTotal(total);
    });
    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  // Dispatch custom event when collapsed state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sidebar-toggle', { detail: { collapsed } })
      );
    }
  }, [collapsed]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("p-6", collapsed && "px-3 flex justify-center")}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
            style={
              themeColor === 'adaptive'
                ? {
                    background: getThemeColor(themeColor, theme),
                  }
                : {
                    backgroundColor: getThemeColor(themeColor, theme),
                  }
            }
          >
            <span 
              className="font-bold text-sm"
              style={{
                color: theme === 'dark' && themeColor === 'default' ? '#000000' : '#ffffff',
              }}
            >
              MC
            </span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-semibold text-sm">MortgageConnect</h1>
              <p className="text-[11px] text-muted-foreground">Admin Panel</p>
            </div>
          )}
        </Link>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => {
            const isItemActive = isActive(item.href);
            const hasUnread = item.title === "Chats" && unreadTotal > 0;

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-center h-10 w-10 rounded-lg text-sm font-medium transition-colors relative mx-auto",
                        isItemActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
                          {unreadTotal > 9 ? "9+" : unreadTotal}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                  isItemActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
                {hasUnread && (
                  <span className="absolute right-3 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                  </span>
                )}
              </Link>
            );
          })}
        </TooltipProvider>
      </nav>

      <Separator />

      {/* User Info, Theme Toggle & Logout */}
      <div className={cn("p-4 space-y-3", collapsed && "px-2")}>
        {userDoc && (
          <div className={cn("flex items-center gap-3", collapsed && "flex-col gap-2")}>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="text-xs font-medium">
                {userDoc.displayName?.charAt(0)?.toUpperCase() || "A"}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {userDoc.displayName}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {userDoc.email}
                </p>
              </div>
            )}
            <ThemeToggle />
          </div>
        )}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full text-muted-foreground hover:text-destructive",
                  collapsed ? "justify-center px-0" : "justify-start"
                )}
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span className="ml-2">Sign Out</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                <p>Sign Out</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r bg-background transition-all duration-300",
          collapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        {sidebarContent}
        
        {/* Desktop Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted hidden lg:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </aside>
    </>
  );
}
