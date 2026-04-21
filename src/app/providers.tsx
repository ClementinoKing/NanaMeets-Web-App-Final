"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { PresenceSync } from "@/components/auth/presence-sync";
import { OfflineBanner } from "@/components/pwa/offline-banner";

const ENABLE_PRESENCE_SYNC = process.env.NEXT_PUBLIC_ENABLE_PRESENCE_SYNC === "true";
const THEME_STORAGE_KEY = "nanameets-theme";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function getSystemTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within Providers");
  }

  return context;
}

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = React.useState(() => new QueryClient());
  const [theme, setThemeState] = React.useState<Theme>("dark");

  React.useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const nextTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : getSystemTheme();

    setThemeState(nextTheme);
    applyTheme(nextTheme);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const shouldRegister =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!shouldRegister) {
      return;
    }

    let cancelled = false;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        if (!cancelled) {
          void registration.update();
        }
      } catch {
        // Ignore registration failures in unsupported or misconfigured environments.
      }
    };

    void registerServiceWorker();

    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const themeContextValue = React.useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <QueryClientProvider client={queryClient}>
        {ENABLE_PRESENCE_SYNC ? <PresenceSync /> : null}
        <OfflineBanner />
        {children}
        <Toaster richColors theme={theme} position="top-right" />
      </QueryClientProvider>
    </ThemeContext.Provider>
  );
}
