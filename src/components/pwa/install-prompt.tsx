"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type PwaInstallPromptProps = {
  variant?: "hero" | "banner";
  className?: string;
};

const DISMISS_STORAGE_KEY = "nanameets-pwa-install-dismissed";
const DISMISS_STORAGE_EVENT = "nanameets-pwa-install-dismissed-updated";

function isStandaloneDisplay() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isAndroidDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  return /Android/.test(window.navigator.userAgent);
}

function subscribeToDismissState(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === DISMISS_STORAGE_KEY) {
      onStoreChange();
    }
  };

  const handleCustomEvent = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(DISMISS_STORAGE_EVENT, handleCustomEvent);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(DISMISS_STORAGE_EVENT, handleCustomEvent);
  };
}

function getDismissStateSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(DISMISS_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function PwaInstallPrompt({ variant = "hero", className }: PwaInstallPromptProps) {
  const isStandalone = useSyncExternalStore(
    () => () => {},
    isStandaloneDisplay,
    () => false
  );
  const isAndroid = useSyncExternalStore(() => () => {}, isAndroidDevice, () => false);
  const dismissed = useSyncExternalStore(subscribeToDismissState, getDismissStateSnapshot, () => false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);

      try {
        window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
        window.dispatchEvent(new Event(DISMISS_STORAGE_EVENT));
      } catch {
        // Ignore storage failures.
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const headline = useMemo(() => {
    return variant === "hero" ? "Install NanaMeets on your phone" : "Add NanaMeets to your home screen";
  }, [variant]);

  if (dismissed || isStandalone || !isAndroid) {
    return null;
  }

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
      window.dispatchEvent(new Event(DISMISS_STORAGE_EVENT));
    } catch {
      // Ignore storage failures.
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);

      try {
        window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
        window.dispatchEvent(new Event(DISMISS_STORAGE_EVENT));
      } catch {
        // Ignore storage failures.
      }
    }
  };

  const actionArea = deferredPrompt ? (
    <button
      type="button"
      onClick={handleInstall}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E94057] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(233,64,87,0.3)] transition hover:translate-y-[-1px] hover:bg-[#ff6177]"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      Install app
    </button>
  ) : (
    <div className="inline-flex items-start gap-3 rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-left text-sm text-white/80">
      <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6c81]" aria-hidden="true" />
      <span>
        Your browser can install this app once it finishes checking the install criteria.
      </span>
    </div>
  );

  return (
    <section
      className={cn(
        "fixed inset-x-3 bottom-3 z-[70] mx-auto w-[calc(100%-1.5rem)] max-w-3xl rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(20,20,20,0.96),rgba(10,10,10,0.95))] px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:bottom-4 sm:w-[calc(100%-2rem)] sm:px-5 sm:py-4",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E94057]/15 text-[#ff6c81]">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-white/45">
              Progressive web app
            </p>
            <h3 className="text-base font-semibold text-white">{headline}</h3>
            <p className="max-w-2xl text-[0.82rem] leading-5 text-white/68">
              Android phones can install directly. iPhone install steps will come later.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:shrink-0">
          {actionArea}

          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/65 transition hover:bg-white/10 hover:text-white"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[0.7rem] leading-5 text-white/45">
        <span className="hidden sm:inline">
          Best on secure HTTPS. Install prompt support varies by browser.
        </span>
        <span className="sm:hidden">Best on secure HTTPS.</span>
      </div>
    </section>
  );
}
