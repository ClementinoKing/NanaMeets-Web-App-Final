import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const CURRENT_PROFILE_SELECT =
  "id,user_id,f_name,email,gender,interests,profile_pic,picture2,picture3,city,area,dob,age,bio,relationship_goals,pets,drinking,smoking,workout,job_title,company,zodiac,height,education,comu_style,love_style,lat,lng,created_at";

export type CurrentProfileRow = Database["public"]["Tables"]["profile"]["Row"];

export type CurrentProfileLookupDebug = {
  byEmailFound: boolean;
  byUserFound: boolean;
  email: string | null;
  matchedSource: "user_id" | "email" | "none";
  userId: string;
};

export async function loadCurrentProfile(
  supabase: SupabaseClient<Database>,
  {
    email,
    userId,
  }: {
    email: string | null;
    userId: string;
  },
) {
  const { data: profileByUser, error: userError } = await supabase
    .from("profile")
    .select(CURRENT_PROFILE_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  let profileByEmail: CurrentProfileRow | null = null;

  if (!profileByUser && email) {
    const { data, error: emailError } = await supabase
      .from("profile")
      .select(CURRENT_PROFILE_SELECT)
      .eq("email", email)
      .maybeSingle();

    if (emailError) {
      throw emailError;
    }

    profileByEmail = data;
  }

  const profile = profileByUser ?? profileByEmail;

  const lookupDebug: CurrentProfileLookupDebug = {
    byEmailFound: Boolean(profileByEmail),
    byUserFound: Boolean(profileByUser),
    email,
    matchedSource: profileByUser ? "user_id" : profileByEmail ? "email" : "none",
    userId,
  };

  return { lookupDebug, profile };
}
