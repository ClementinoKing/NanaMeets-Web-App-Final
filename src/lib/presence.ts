import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export async function fetchOnlineUserIds(
  supabase: SupabaseClient<Database>,
  userIds: string[],
) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];

  if (!uniqueIds.length) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from("user_sessions")
    .select("user_id,is_online,updated_at")
    .in("user_id", uniqueIds)
    .eq("is_online", true)
    .gte("updated_at", new Date(Date.now() - ONLINE_WINDOW_MS).toISOString());

  if (error) {
    throw error;
  }

  return new Set((data ?? []).map((row) => row.user_id));
}
