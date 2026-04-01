import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  TinderSidebar,
  type SidebarConversationPreview,
  type SidebarMatchPreview,
} from "@/components/dashboard/tinder-sidebar";
import { loadCurrentProfile } from "@/lib/current-profile";
import {
  fetchMatchedUsersProfilesForIdentityIds,
  fetchMessagesForIdentityIds,
  fetchProfilesForIdentityIds,
} from "@/lib/message-feed";
import { formatMembershipLabel, loadActiveSubscription } from "@/lib/subscriptions";
import { getServerAuthSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
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

  const activeSubscription = await loadActiveSubscription(supabase, user.id);
  const messageIdentityIds = [user.id];

  const displayName = profile?.f_name ?? user.email ?? "NanaMeets member";
  const location = [profile?.city, profile?.area].filter(Boolean).join(" · ") || "Location not set";
  const profileCompletion = [
    profile?.f_name,
    profile?.age,
    profile?.gender,
    profile?.city,
    profile?.area,
    profile?.bio,
    profile?.relationship_goals,
    profile?.interests?.length ? "x" : null,
    profile?.job_title,
    profile?.profile_pic,
  ].filter(Boolean).length;

  const messages = await fetchMessagesForIdentityIds(supabase, messageIdentityIds);
  const conversationMap = new Map<
    string,
    {
      userId: string;
      latestMessage: string | null;
      latestAt: string;
      sentByMe: boolean;
    }
  >();

  for (const message of messages ?? []) {
    const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;

    if (!conversationMap.has(otherUserId)) {
      conversationMap.set(otherUserId, {
        userId: otherUserId,
        latestMessage: message.message,
        latestAt: message.created_at,
        sentByMe: message.sender_id === user.id,
      });
    }
  }

  const otherIds = [...conversationMap.keys()];
  const matchedRows = await fetchMatchedUsersProfilesForIdentityIds(supabase, messageIdentityIds);
  const otherProfiles = otherIds.length ? await fetchProfilesForIdentityIds(supabase, otherIds) : [];
  const matchedUserIds = matchedRows
    .map((row) => row.user_ids ?? [])
    .map((userIds) => userIds.find((identityId) => identityId !== user.id) ?? null)
    .filter((value): value is string => Boolean(value));
  const matchedProfiles = matchedUserIds.length ? await fetchProfilesForIdentityIds(supabase, matchedUserIds) : [];

  const conversations: SidebarConversationPreview[] = [...conversationMap.values()]
    .map((conversation) => {
      const match = otherProfiles.find((item) => item.user_id === conversation.userId || item.id === conversation.userId);

      return {
        ...conversation,
        name: match?.f_name ?? conversation.userId,
        profilePic: match?.profile_pic ?? null,
      };
    })
    .sort((left, right) => new Date(right.latestAt).getTime() - new Date(left.latestAt).getTime())
    .slice(0, 6);

  const matches: SidebarMatchPreview[] = matchedRows
    .filter((row) => (row.user_ids ?? []).includes(user.id))
    .map((row) => {
      const userIds = row.user_ids ?? [];
      const otherUserId = userIds.find((identityId) => identityId !== user.id) ?? null;

      if (!otherUserId) {
        return null;
      }

      const profile = matchedProfiles.find((item) => item.user_id === otherUserId || item.id === otherUserId) ?? null;
      const fallbackIndex = userIds.indexOf(otherUserId);

      return {
        userId: otherUserId,
        name: profile?.f_name ?? String(row.f_names?.[fallbackIndex] ?? otherUserId),
        profilePic: profile?.profile_pic ?? row.profile_pics?.[fallbackIndex] ?? null,
        age: profile?.age ?? (typeof row.ages?.[fallbackIndex] === "number" ? row.ages?.[fallbackIndex] : null),
        city: profile?.city ?? row.cities?.[fallbackIndex] ?? null,
        area: profile?.area ?? row.areas?.[fallbackIndex] ?? null,
        conversation: row.conversation,
        createdAt: row.created_at ?? new Date().toISOString(),
      };
    })
    .filter((value): value is SidebarMatchPreview => Boolean(value))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-white p-0 md:bg-[#f5f6f8] md:p-4 dark:bg-black">
      <div className="min-h-screen md:grid md:grid-cols-[340px_1fr] md:gap-4">
        <aside className="border-b border-white/10 bg-[#070707] text-white md:sticky md:top-4 md:h-[calc(100vh-2rem)] md:rounded-[2rem] md:border md:border-white/10 md:border-b md:shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <TinderSidebar
            age={profile?.age ?? null}
            conversations={conversations}
            displayName={displayName}
            matches={matches}
            location={location}
            membershipLabel={formatMembershipLabel(activeSubscription)}
            profileCompletion={profileCompletion * 10}
            profilePic={profile?.profile_pic ?? null}
          />
        </aside>

        <main className="min-h-screen bg-white px-4 py-6 md:rounded-[2rem] md:bg-[#f7f8fa] md:px-6 md:py-6 lg:px-8 lg:py-8 dark:bg-black">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
