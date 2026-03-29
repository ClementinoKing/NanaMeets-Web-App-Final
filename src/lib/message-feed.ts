import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type MessageRow = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "sender_id" | "receiver_id" | "message" | "created_at"
>;

type ProfileRow = Pick<
  Database["public"]["Tables"]["profile"]["Row"],
  | "id"
  | "user_id"
  | "f_name"
  | "email"
  | "profile_pic"
  | "picture2"
  | "picture3"
  | "bio"
  | "relationship_goals"
  | "city"
  | "area"
  | "age"
  | "job_title"
  | "company"
  | "education"
  | "zodiac"
  | "height"
  | "comu_style"
  | "love_style"
  | "drinking"
  | "smoking"
  | "workout"
  | "pets"
  | "interests"
  | "gender"
  | "lat"
  | "lng"
>;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function fetchMessagesForIdentityIds(
  supabase: SupabaseClient<Database>,
  identityIds: string[],
) {
  const uniqueIds = [...new Set(identityIds.filter(Boolean))];
  const merged = new Map<number, MessageRow>();

  for (const identityId of uniqueIds) {
    const { data, error } = await supabase
      .from("messages")
      .select("id,sender_id,receiver_id,message,created_at")
      .or(`sender_id.eq.${identityId},receiver_id.eq.${identityId}`)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    for (const message of data ?? []) {
      merged.set(message.id, message);
    }
  }

  return [...merged.values()].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
}

export async function fetchProfilesForIdentityIds(
  supabase: SupabaseClient<Database>,
  identityIds: string[],
) {
  const uniqueIds = [...new Set(identityIds.filter((value): value is string => Boolean(value) && isUuid(value)))];
  const merged = new Map<string, ProfileRow>();

  for (const identityId of uniqueIds) {
    const { data: byUserId, error: userIdError } = await supabase
      .from("profile")
      .select("id,user_id,f_name,email,profile_pic,picture2,picture3,bio,relationship_goals,city,area,age,job_title,company,education,zodiac,height,comu_style,love_style,drinking,smoking,workout,pets,interests,gender,lat,lng")
      .eq("user_id", identityId)
      .maybeSingle();

    if (userIdError) {
      throw userIdError;
    }

    if (byUserId) {
      merged.set(byUserId.user_id, byUserId);
      merged.set(byUserId.id, byUserId);
      continue;
    }

    const { data: byId, error: idError } = await supabase
      .from("profile")
      .select("id,user_id,f_name,email,profile_pic,picture2,picture3,bio,relationship_goals,city,area,age,job_title,company,education,zodiac,height,comu_style,love_style,drinking,smoking,workout,pets,interests,gender,lat,lng")
      .eq("id", identityId)
      .maybeSingle();

    if (idError) {
      throw idError;
    }

    if (byId) {
      merged.set(byId.user_id, byId);
      merged.set(byId.id, byId);
    }
  }

  return [...merged.values()];
}
