"use client";

import { useEffect, useState } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Cpu,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Shield,
  Zap,
  AlertTriangle,
  Palette,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme-context";
import { THEME_COLORS, ThemeColor } from "@/lib/theme-config";

interface FeatureFlags {
  aiAssistantEnabled: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  aiAssistantEnabled: false,
};

export default function SettingsPage() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { theme, themeColor, setThemeColor } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);
  const [circleStyle, setCircleStyle] = useState({
    x: 0,
    y: 0,
    visible: false,
    size: 0,
    color: '#000000',
  });

  // Subscribe to feature flags in real-time
  useEffect(() => {
    const docRef = doc(db, "appConfig", "features");
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
        console.error("[Settings] Error subscribing to flags:", error);
        toast.error("Failed to load feature flags");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleAIAssistant = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, "appConfig", "features");
      const newValue = !flags.aiAssistantEnabled;

      await setDoc(
        docRef,
        { aiAssistantEnabled: newValue },
        { merge: true }
      );

      toast.success(
        newValue
          ? "AI Assistant enabled — users can now access it"
          : "AI Assistant disabled — hidden from all users"
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update setting";
      console.error("[Settings] Error toggling AI assistant:", message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeColorChange = (
    color: ThemeColor,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (isAnimating) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Get the color for animation
    const themeConfig = THEME_COLORS.find((c) => c.name === color);
    const animationColor = theme === 'light' 
      ? themeConfig?.lightColor || '#000000'
      : themeConfig?.darkColor || '#ffffff';

    setIsAnimating(true);

    // Phase 1: Start with small circle
    setCircleStyle({
      x,
      y,
      visible: true,
      size: 0,
      color: animationColor,
    });

    // Phase 2: Expand to full screen (450ms)
    setTimeout(() => {
      setCircleStyle((prev) => ({ ...prev, size: 1 }));

      // Phase 3: Apply theme at peak of expansion
      setTimeout(() => {
        setThemeColor(color);
        toast.success(`Theme changed to ${themeConfig?.label}`);

        // Phase 4: Start shrinking back (10ms after change)
        setTimeout(() => {
          setCircleStyle((prev) => ({ ...prev, size: 2 }));

          // Phase 5: Remove overlay after shrink completes
          setTimeout(() => {
            setCircleStyle((prev) => ({ ...prev, visible: false }));
            setIsAnimating(false);
          }, 450);
        }, 10);
      }, 450);
    }, 10);
  };

  // Compute the max radius needed to cover the entire screen from (x,y) - increased by 20%
  const maxRadius =
    typeof window !== 'undefined'
      ? Math.sqrt(
          Math.max(circleStyle.x, window.innerWidth - circleStyle.x) ** 2 +
            Math.max(circleStyle.y, window.innerHeight - circleStyle.y) ** 2
        ) * 1.2
      : 2400;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage app-wide feature flags and configuration
        </p>
      </div>

      {/* Theme Customization Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Theme Customization</CardTitle>
          </div>
          <CardDescription>
            Customize the appearance of your admin dashboard with different color themes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">Color Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {THEME_COLORS.map((color) => {
                const isSelected = themeColor === color.name;
                const displayColor = theme === 'light' ? color.lightColor : color.darkColor;
                
                return (
                  <button
                    key={color.name}
                    onClick={(e) => handleThemeColorChange(color.name as ThemeColor, e)}
                    disabled={isAnimating}
                    className="group relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: isSelected ? (color.isGradient ? '#667eea' : displayColor) : 'transparent',
                      backgroundColor: isSelected ? (color.isGradient ? '#667eea10' : `${displayColor}10`) : 'transparent',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full transition-transform group-hover:scale-110 flex items-center justify-center"
                      style={
                        color.isGradient
                          ? { background: displayColor }
                          : { backgroundColor: displayColor }
                      }
                    >
                      {isSelected && <Check className="h-5 w-5 text-white" />}
                    </div>
                    <span className="text-xs font-medium">{color.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Palette className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Theme colors are saved locally and will persist across sessions. The selected color
              affects primary UI elements like buttons, links, and the sidebar logo circle.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Feature Flags</CardTitle>
          </div>
          <CardDescription>
            Enable or disable experimental features across the mobile app.
            Changes take effect in real-time for all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Assistant Toggle */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-lg bg-primary/10">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">
                    AI Mortgage Assistant
                  </Label>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    EXPERIMENTAL
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  An AI-powered chatbot that helps users with UAE mortgage
                  questions and interactive calculations. When enabled, an
                  &quot;AI&quot; tab appears in the mobile app&apos;s navigation
                  bar.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    <span>Powered by OpenRouter (Llama 3.1)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    <span>Rate limited (20 req/min)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Button
                variant={flags.aiAssistantEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleAIAssistant}
                disabled={saving}
                className="min-w-[100px]"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : flags.aiAssistantEnabled ? (
                  <>
                    <ToggleRight className="h-4 w-4 mr-1.5" />
                    Enabled
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-4 w-4 mr-1.5" />
                    Disabled
                  </>
                )}
              </Button>
              <Badge
                variant={
                  flags.aiAssistantEnabled ? "default" : "secondary"
                }
                className="text-[10px]"
              >
                {flags.aiAssistantEnabled ? "LIVE" : "OFF"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Info notice */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed">
              Feature flags are stored in Firestore and synced to mobile
              devices in real-time. Toggling a feature will immediately
              show or hide it for all users. The AI Assistant uses external
              API calls — ensure the OpenRouter API key is configured in
              Cloud Functions before enabling.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Circle Animation Overlay */}
      {circleStyle.visible && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: circleStyle.x,
              top: circleStyle.y,
              width: circleStyle.size === 0 ? 0 : circleStyle.size === 1 ? maxRadius * 2 : 0,
              height: circleStyle.size === 0 ? 0 : circleStyle.size === 1 ? maxRadius * 2 : 0,
              borderRadius: '50%',
              background: circleStyle.color.startsWith('linear-gradient') 
                ? circleStyle.color 
                : circleStyle.color,
              transform: 'translate(-50%, -50%)',
              transition: 'width 450ms cubic-bezier(0.4, 0, 0.2, 1), height 450ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      )}
    </div>
  );
}
