"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

interface DashboardLocationSyncProps {
  userId: string;
  hasLocation?: boolean;
}

export function DashboardLocationSync({ userId, hasLocation = false }: DashboardLocationSyncProps) {
  const router = useRouter();

  useEffect(() => {
    if (hasLocation) {
      return;
    }

    if (!navigator.geolocation) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        await supabase
          .from("profile")
          .update({ lat: latitude, lng: longitude })
          .eq("user_id", userId);

        router.refresh();
      },
      () => {
        // If the browser blocks location, we keep the fallback deck path.
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [hasLocation, router, userId]);

  return null;
}
