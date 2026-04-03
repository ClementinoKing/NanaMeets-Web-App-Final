import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DashboardLocationSync } from "@/components/dashboard/dashboard-location-sync";
import { SwipeDeckHost } from "@/components/dashboard/swipe-deck-host";
import type { SwipeProfile } from "@/components/dashboard/swipe-deck";
import { getServerAuthSession } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { getOppositeGenderFilter } from "@/lib/gender-filter";
import { canDirectMessageUsers, loadActiveSubscription, loadSubscriptionPlans } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

type UnswipedUserRow = {
  user_id: string;
  f_name: string | null;
  age: number | null;
  city: string | null;
  area: string | null;
  bio: string | null;
  profile_pic: string | null;
  picture2: string | null;
  picture3: string | null;
  distance_km?: string | null;
};

async function fetchUnswipedUsers(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
  currentGender: string | null | undefined,
  currentLat: number | null,
  currentLng: number | null
) {
  const genderFilter = getOppositeGenderFilter(currentGender);

  const attempts = [
    {
      fnName: "get_unswiped_users2" as const,
      params: {
        current_lat: currentLat,
        current_lng: currentLng,
        current_user_id: currentUserId,
        filter_gender: genderFilter,
        limit_count: 100,
        max_age: 60,
        min_age: 18,
      },
    },
    {
      fnName: "get_unswiped_users2" as const,
      params: {
        current_lat: currentLat,
        current_lng: currentLng,
        current_user_id: currentUserId,
        filter_gender: null,
        limit_count: 100,
        max_age: 60,
        min_age: 18,
      },
    },
    {
      fnName: "get_unswiped_users2" as const,
      params: {
        current_lat: null,
        current_lng: null,
        current_user_id: currentUserId,
        filter_gender: genderFilter,
        limit_count: 100,
        max_age: 60,
        min_age: 18,
      },
    },
    {
      fnName: "get_unswiped_users2" as const,
      params: {
        current_lat: null,
        current_lng: null,
        current_user_id: currentUserId,
        filter_gender: null,
        limit_count: 100,
        max_age: 60,
        min_age: 18,
      },
    },
    {
      fnName: "get_unswiped_users" as const,
      params: {
        current_lat: currentLat,
        current_lng: currentLng,
        current_user_id: currentUserId,
        filter_gender: genderFilter,
        limit_count: 100,
        max_age: 60,
        min_age: 18,
      },
    },
    {
      fnName: "get_unswiped_users" as const,
      params: {
        current_lat: null,
        current_lng: null,
        current_user_id: currentUserId,
        filter_gender: null,
        limit_count: 100,
        max_age: 60,
        min_age: 18,
      },
    },
  ] as const;

  for (const attempt of attempts) {
    const { data, error } = await supabase.rpc(attempt.fnName, attempt.params as never);
    const rows = Array.isArray(data) ? (data as UnswipedUserRow[]) : [];

    if (!error) {
      if (rows.length > 0) {
        return rows;
      }

      return [];
    }
  }

  return [] as UnswipedUserRow[];
}

export default async function DashboardPage() {
  const { supabase, user } = await getServerAuthSession();

  if (!user || !supabase) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("f_name,email,gender,city,area,bio,relationship_goals,interests,job_title,company,education,zodiac,height,comu_style,love_style,pets,drinking,smoking,workout,profile_pic,picture2,picture3,age,lat,lng")
    .eq("user_id", user.id)
    .maybeSingle();

  const activeSubscription = await loadActiveSubscription(supabase, user.id);
  const subscriptionPlans = await loadSubscriptionPlans(supabase);
  const canSendDirectMessages = canDirectMessageUsers(activeSubscription);

  const rpcPeople = await fetchUnswipedUsers(
    supabase,
    user.id,
    profile?.gender,
    profile?.lat ?? null,
    profile?.lng ?? null
  );

  const profiles: SwipeProfile[] =
    rpcPeople
      .map((person) => ({
        userId: person.user_id,
        name: person.f_name ?? "NanaMeets member",
        age: person.age ?? null,
        distanceKm: person.distance_km ?? null,
        city: person.city ?? null,
        area: person.area ?? null,
        bio: person.bio ?? null,
        profilePics: [person.profile_pic ?? null, person.picture2 ?? null, person.picture3 ?? null],
      }));

  return (
    <section className="-mx-4 -my-6 flex h-full min-h-0 items-start justify-start overflow-hidden bg-white px-4 py-0 text-slate-950 dark:bg-black dark:text-white sm:-mx-6 sm:-my-8 sm:items-center sm:justify-center sm:py-6 lg:-mx-8 lg:-my-8">
      <div className="h-full w-full">
        <DashboardLocationSync
          userId={user.id}
          hasLocation={profile?.lat !== null && profile?.lng !== null}
        />

        <SwipeDeckHost
          canDirectMessageUsers={canSendDirectMessages}
          currentUserId={user.id}
          profiles={profiles}
          subscriptionPlans={subscriptionPlans}
        />
      </div>
    </section>
  );
}
