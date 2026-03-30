import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { fetchProfilesForIdentityIds } from "@/lib/message-feed";

export type LikedProfileRow = {
  swiper_id: string;
  f_name: string;
  profile_pic: string | null;
  boost: boolean;
  age: number | null;
  created_at: string;
};

export async function fetchLikedProfiles(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
) {
  const { data, error } = await supabase
    .from("swipes")
    .select("swiper_id,swiped_id,is_liked,conversation,boost,created_at")
    .eq("swiped_id", currentUserId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  type SwipeRow = {
    swiper_id: string;
    swiped_id: string | null;
    is_liked: boolean | null;
    conversation: boolean | null;
    boost: boolean | null;
    created_at: string;
  };

  const swipeRows = (data ?? []).filter(
    (row): row is SwipeRow => Boolean(row.swiper_id) && Boolean(row.swiped_id),
  );

  const latestBySwiper = new Map<string, SwipeRow>();

  for (const row of swipeRows) {
    if (!latestBySwiper.has(row.swiper_id)) {
      latestBySwiper.set(row.swiper_id, row);
    }
  }

  const latestSwipeRows = [...latestBySwiper.values()].filter(
    (row) => row.swiped_id === currentUserId && row.is_liked === true && row.conversation === false,
  );

  if (!latestSwipeRows.length) {
    return [];
  }

  const reverseTargets = latestSwipeRows.map((row) => row.swiper_id);
  const { data: reverseRows, error: reverseError } = await supabase
    .from("swipes")
    .select("swiper_id,swiped_id,is_liked,conversation,created_at")
    .eq("swiper_id", currentUserId)
    .eq("is_liked", true)
    .eq("conversation", false)
    .in("swiped_id", reverseTargets);

  if (reverseError) {
    throw reverseError;
  }

  const reciprocalTargets = new Set(
    (reverseRows ?? [])
      .map((row) => row.swiped_id)
      .filter((value): value is string => Boolean(value)),
  );

  const visibleSwipeRows = latestSwipeRows.filter((row) => !reciprocalTargets.has(row.swiper_id));

  const profiles = visibleSwipeRows.length
    ? await fetchProfilesForIdentityIds(supabase, visibleSwipeRows.map((row) => row.swiper_id))
    : [];

  return visibleSwipeRows
    .map((row) => {
      const profile = profiles.find((item) => item.user_id === row.swiper_id || item.id === row.swiper_id) ?? null;

      return {
        swiper_id: row.swiper_id,
        f_name: profile?.f_name ?? row.swiper_id,
        profile_pic: profile?.profile_pic ?? null,
        boost: Boolean(row.boost),
        age: profile?.age ?? null,
        created_at: row.created_at,
      };
    })
    .filter((profile) => Boolean(profile.profile_pic));
}
