"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getCurrentUserSafely } from "@/lib/supabase/browser-auth";

const SESSION_STORAGE_KEY = "nanameets_presence_session_id";

function getSessionId() {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

export function PresenceSync() {
  const syncTimerRef = useRef<number | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return undefined;
    }

    let cancelled = false;

    const syncPresence = async (isOnline: boolean, userIdOverride?: string | null, sessionIdOverride?: string | null) => {
      const user = userIdOverride ? { id: userIdOverride } : await getCurrentUserSafely(supabase);

      if (cancelled || !user?.id) {
        return;
      }

      const sessionId = sessionIdOverride ?? getSessionId();

      if (!sessionId) {
        return;
      }

      currentUserIdRef.current = user.id;
      currentSessionIdRef.current = sessionId;

      const payload = {
        user_id: user.id,
        session_id: sessionId,
        is_online: isOnline,
        updated_at: new Date().toISOString(),
        disconnected_at: isOnline ? null : new Date().toISOString(),
        device: navigator.userAgent,
      };

      const { error } = await supabase.from("user_sessions").upsert(payload, {
        onConflict: "session_id",
      });

      if (error) {
        console.error("Failed to sync presence", error);
      }
    };

    void syncPresence(true);

    syncTimerRef.current = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncPresence(true);
      }
    }, 30_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncPresence(true);
      }
    };

    const handlePageHide = () => {
      void syncPresence(false, currentUserIdRef.current, currentSessionIdRef.current);
    };

    const handleAuthChange = (_event: string, session: { user?: { id: string } | null } | null) => {
      if (!session?.user) {
        void syncPresence(false, currentUserIdRef.current, currentSessionIdRef.current);
        return;
      }

      void syncPresence(true);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange);

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (syncTimerRef.current) {
        window.clearInterval(syncTimerRef.current);
      }

      void syncPresence(false, currentUserIdRef.current, currentSessionIdRef.current);
    };
  }, []);

  return null;
}
