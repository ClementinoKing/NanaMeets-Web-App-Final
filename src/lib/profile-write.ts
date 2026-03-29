import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type ProfileInsert = Database["public"]["Tables"]["profile"]["Insert"];

function stripUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}

export async function saveProfileRow(
  supabase: SupabaseClient<Database>,
  profile: Pick<ProfileInsert, "user_id"> & Partial<Omit<ProfileInsert, "id" | "user_id">>,
) {
  const payload = stripUndefined(profile);

  const { data: updatedRows, error: updateError } = await supabase
    .from("profile")
    .update(payload)
    .eq("user_id", profile.user_id)
    .select("id");

  if (updateError) {
    throw updateError;
  }

  if (updatedRows.length > 0) {
    return;
  }

  const { error: insertError } = await supabase.from("profile").insert(payload);

  if (insertError) {
    throw insertError;
  }
}
