"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const SESSION_STORAGE_KEY = "nanameets_presence_session_id";

function getSessionId() {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

export function PresenceSync() {
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const sessionId = getSessionId();

    if (!supabase || !sessionId) {
      return undefined;
    }

    let cancelled = false;

    const syncPresence = async (isOnline: boolean) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled || !user) {
        return;
      }

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
      void syncPresence(true);
    }, 30_000);

    const handlePageHide = () => {
      void syncPresence(false);
    };

    const handleAuthChange = (_event: string, session: { user?: { id: string } | null } | null) => {
      if (!session?.user) {
        void syncPresence(false);
        return;
      }

      void syncPresence(true);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange);

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);

      if (syncTimerRef.current) {
        window.clearInterval(syncTimerRef.current);
      }

      void syncPresence(false);
    };
  }, []);

  return null;
}
