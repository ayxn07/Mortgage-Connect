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
} from "lucide-react";
import { toast } from "sonner";

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
    </div>
  );
}
