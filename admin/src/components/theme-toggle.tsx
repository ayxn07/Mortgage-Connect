"use client";

import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-context";
import { useCallback, useRef } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        toggleTheme(x, y);
      } else {
        toggleTheme(e.clientX, e.clientY);
      }
    },
    [toggleTheme]
  );

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="h-9 w-9 rounded-lg"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}
