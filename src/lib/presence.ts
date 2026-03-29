import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

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
    .select("user_id,is_online,disconnected_at")
    .in("user_id", uniqueIds)
    .eq("is_online", true)
    .is("disconnected_at", null);

  if (error) {
    throw error;
  }

  return new Set((data ?? []).map((row) => row.user_id));
}
