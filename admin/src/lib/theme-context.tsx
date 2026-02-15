"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { ThemeColor, getThemeColor } from "./theme-config";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  themeColor: ThemeColor;
  toggleTheme: (x: number, y: number) => void;
  setThemeColor: (color: ThemeColor, x?: number, y?: number) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  themeColor: "default",
  toggleTheme: () => {},
  setThemeColor: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [themeColor, setThemeColorState] = useState<ThemeColor>("default");
  const [isAnimating, setIsAnimating] = useState(false);
  const [circleStyle, setCircleStyle] = useState({
    x: 0,
    y: 0,
    visible: false,
    size: 0, // 0 = small, 1 = expanded, 2 = shrinking
    color: "#000000",
  });

  // Load saved theme and color on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("mc-admin-theme") as Theme | null;
    const savedColor = localStorage.getItem("mc-admin-theme-color") as ThemeColor | null;

    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      }
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }

    if (savedColor) {
      setThemeColorState(savedColor);
      applyThemeColor(savedColor);
    }
  }, []);

  const applyThemeColor = (color: ThemeColor) => {
    // Remove all theme classes
    document.documentElement.classList.remove(
      "theme-blue",
      "theme-green",
      "theme-orange",
      "theme-red",
      "theme-rose",
      "theme-violet",
      "theme-yellow",
      "theme-adaptive"
    );

    // Add new theme class if not default
    if (color !== "default") {
      document.documentElement.classList.add(`theme-${color}`);
    }
  };

  const setThemeColor = useCallback((color: ThemeColor, x?: number, y?: number) => {
    console.log('[Theme] Setting theme color to:', color);
    
    // If coordinates provided, show animation
    if (x !== undefined && y !== undefined && color !== themeColor) {
      const colorConfig = getThemeColor(color, theme);
      
      setIsAnimating(true);
      
      // Phase 1: Start with small circle
      setCircleStyle({
        x,
        y,
        visible: true,
        size: 0,
        color: colorConfig,
      });

      // Phase 2: Expand to full screen (450ms)
      setTimeout(() => {
        setCircleStyle((prev) => ({ ...prev, size: 1 }));

        // Phase 3: Apply theme at peak of expansion
        setTimeout(() => {
          setThemeColorState(color);
          localStorage.setItem("mc-admin-theme-color", color);
          applyThemeColor(color);

          // Phase 4: Start shrinking back (10ms after switch)
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
    } else {
      // No animation, just apply
      setThemeColorState(color);
      localStorage.setItem("mc-admin-theme-color", color);
      applyThemeColor(color);
    }
    
    console.log('[Theme] Applied classes:', document.documentElement.classList.toString());
  }, [theme, themeColor, isAnimating]);

  const toggleTheme = useCallback(
    (x: number, y: number) => {
      if (isAnimating) return;

      const newTheme = theme === "light" ? "dark" : "light";
      // Use pure black/white for light/dark mode toggle, not theme colors
      const overlayColor = newTheme === "dark" ? "#1a1a1a" : "#ffffff";

      setIsAnimating(true);
      
      // Phase 1: Start with small circle
      setCircleStyle({
        x,
        y,
        visible: true,
        size: 0,
        color: overlayColor,
      });

      // Phase 2: Expand to full screen (450ms)
      setTimeout(() => {
        setCircleStyle((prev) => ({ ...prev, size: 1 }));

        // Phase 3: Switch theme at peak of expansion
        setTimeout(() => {
          setTheme(newTheme);
          localStorage.setItem("mc-admin-theme", newTheme);
          if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }

          // Phase 4: Start shrinking back (10ms after switch)
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
    },
    [theme, isAnimating]
  );

  // Compute the max radius needed to cover the entire screen from (x,y) - increased by 20%
  const maxRadius =
    typeof window !== "undefined"
      ? Math.sqrt(
          Math.max(circleStyle.x, window.innerWidth - circleStyle.x) ** 2 +
            Math.max(circleStyle.y, window.innerHeight - circleStyle.y) ** 2
        ) * 1.2
      : 2400;

  return (
    <ThemeContext.Provider value={{ theme, themeColor, toggleTheme, setThemeColor }}>
      {children}
      {circleStyle.visible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: circleStyle.x,
              top: circleStyle.y,
              width: circleStyle.size === 0 ? 0 : circleStyle.size === 1 ? maxRadius * 2 : 0,
              height: circleStyle.size === 0 ? 0 : circleStyle.size === 1 ? maxRadius * 2 : 0,
              borderRadius: "50%",
              backgroundColor: circleStyle.color,
              transform: "translate(-50%, -50%)",
              transition: "width 450ms cubic-bezier(0.4, 0, 0.2, 1), height 450ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      )}
    </ThemeContext.Provider>
  );
}
