"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function getCurrentUserSafely(supabase: SupabaseClient<Database>) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.user ?? null;
  } catch {
    return null;
  }
}
