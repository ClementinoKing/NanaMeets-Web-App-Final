import { redirect } from "next/navigation";
import { LikesPageClient } from "@/components/dashboard/likes/likes-page-client";
import { loadCurrentProfile } from "@/lib/current-profile";
import { fetchLikedProfiles } from "@/lib/likes";
import { getServerAuthSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LikesPage() {
  const { supabase, user } = await getServerAuthSession();

  if (!user || !supabase) {
    redirect("/login");
  }

  const { profile } = await loadCurrentProfile(supabase, {
    email: user.email ?? null,
    userId: user.id,
  });

  if (!profile) {
    redirect("/create-profile");
  }

  try {
    const likedProfiles = await fetchLikedProfiles(supabase, user.id);

    return <LikesPageClient likedProfiles={likedProfiles} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load likes right now.";
    return <LikesPageClient errorMessage={message} likedProfiles={[]} />;
  }
}
