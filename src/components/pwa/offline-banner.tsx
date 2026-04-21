"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribeToOnlineState(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);

  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getOnlineSnapshot() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.navigator.onLine;
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(subscribeToOnlineState, getOnlineSnapshot, () => true);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 top-4 z-[80] mx-auto flex max-w-xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b0b0b]/95 px-4 py-3 text-white shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-center gap-3 text-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <WifiOff className="h-4 w-4 text-[#ff6c81]" aria-hidden="true" />
        </span>
        <div>
          <div className="font-semibold">You&apos;re offline</div>
          <div className="text-white/68">
            Reconnect to continue with messages, profile edits, and payments.
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        Retry
      </button>
    </div>
  );
}
