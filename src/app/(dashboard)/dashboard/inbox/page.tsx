import Image from "next/image";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { Briefcase, Building2, GraduationCap, Heart, MapPin, Ruler, UserRoundPen, type LucideIcon } from "lucide-react";
import { ChatHeader } from "@/components/dashboard/chat/chat-header";
import { ChatInput } from "@/components/dashboard/chat/chat-input";
import { MessageList } from "@/components/dashboard/chat/message-list";
import { fetchMessagesForIdentityIds, fetchProfilesForIdentityIds } from "@/lib/message-feed";
import { fetchOnlineUserIds } from "@/lib/presence";
import { loadActiveSubscription, canDirectMessageUsers } from "@/lib/subscriptions";
import { getServerAuthSession } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface InboxPageProps {
  searchParams?: Promise<{
    conversation?: string;
  }>;
}

type ProfileRow = Awaited<ReturnType<typeof fetchProfilesForIdentityIds>>[number];

const inboxThemeVars: CSSProperties = {
  ["--background" as never]: "0 0% 1%",
  ["--foreground" as never]: "0 0% 98%",
  ["--card" as never]: "0 0% 8%",
  ["--card-foreground" as never]: "0 0% 98%",
  ["--popover" as never]: "0 0% 8%",
  ["--popover-foreground" as never]: "0 0% 98%",
  ["--primary" as never]: "347 92% 61%",
  ["--primary-foreground" as never]: "0 0% 100%",
  ["--secondary" as never]: "0 0% 12%",
  ["--secondary-foreground" as never]: "0 0% 98%",
  ["--muted" as never]: "0 0% 12%",
  ["--muted-foreground" as never]: "215 10% 70%",
  ["--accent" as never]: "0 0% 12%",
  ["--accent-foreground" as never]: "0 0% 98%",
  ["--destructive" as never]: "15 72% 43%",
  ["--border" as never]: "0 0% 16%",
  ["--input" as never]: "0 0% 16%",
  ["--ring" as never]: "347 92% 61%",
};

function ProfileBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon: LucideIcon;
}) {
  if (!value?.trim()) {
    return null;
  }

  return (
    <div className="border-b border-border/70 py-2.5 last:border-b-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em]">{label}</p>
      </div>
      <p className="mt-1 text-[0.92rem] leading-6 text-foreground/90">{value}</p>
    </div>
  );
}

function RightRail({
  selectedProfile,
  selectedConversation,
}: {
  selectedProfile: ProfileRow | null;
  selectedConversation: {
    name: string;
    profilePic: string | null;
    latestAt: string;
  } | null;
}) {
  const displayName = selectedProfile?.f_name ?? selectedConversation?.name ?? "Conversation";
  const displayAge = selectedProfile?.age ? `, ${selectedProfile.age}` : "";
  const location = [selectedProfile?.city, selectedProfile?.area].filter(Boolean).join(" · ");
  const picture = selectedProfile?.profile_pic ?? selectedConversation?.profilePic ?? null;
  const extraPhotos = [selectedProfile?.picture2, selectedProfile?.picture3].filter(Boolean) as string[];
  const relationshipGoals = selectedProfile?.relationship_goals?.trim() || null;
  const bio = selectedProfile?.bio?.trim() || null;
  const essentials = [
    { label: "Location", value: location || null, icon: MapPin },
    { label: "Job title", value: selectedProfile?.job_title?.trim() || null, icon: Briefcase },
    { label: "Company", value: selectedProfile?.company?.trim() || null, icon: Building2 },
    { label: "Education", value: selectedProfile?.education?.trim() || null, icon: GraduationCap },
    { label: "Height", value: selectedProfile?.height ? `${selectedProfile.height} cm` : null, icon: Ruler },
    {
      label: "Lifestyle",
      value:
        [selectedProfile?.drinking, selectedProfile?.smoking, selectedProfile?.workout, selectedProfile?.pets]
          .filter((item): item is string => Boolean(item && item.trim()))
          .join(" · ") || null,
      icon: Heart,
    },
  ].filter((item) => Boolean(item.value));

  return (
    <aside className="h-full space-y-3 overflow-y-auto pr-1">
      <div className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-[#151515] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="px-4 py-3">
          <h2 className="text-[1.75rem] font-semibold tracking-tight text-foreground">
            {displayName}
            {displayAge}
          </h2>
        </div>

        {picture ? (
          <div className="relative aspect-[3/4] min-h-[300px] bg-[#0f0f0f]">
            <Image alt={displayName} className="object-cover" fill sizes="(max-width: 1280px) 100vw, 33vw" src={picture} />
          </div>
        ) : null}
      </div>

      {relationshipGoals ? (
        <div className="rounded-[1.35rem] border border-border/70 bg-[#151515] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-foreground/75">
            <UserRoundPen className="h-4 w-4" />
            <p className="text-[0.92rem] font-semibold">Looking for</p>
          </div>
          <div className="mt-3 rounded-[1.1rem] bg-[#101010] px-4 py-4">
            <p className="text-[0.98rem] font-semibold text-foreground/90">{relationshipGoals}</p>
          </div>
        </div>
      ) : null}

      {bio ? (
        <div className="rounded-[1.35rem] border border-border/70 bg-[#151515] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-foreground/75">
            <UserRoundPen className="h-4 w-4" />
            <p className="text-[0.92rem] font-semibold">About me</p>
          </div>
          <p className="mt-3 text-[0.92rem] leading-6 text-foreground/90">{bio}</p>
        </div>
      ) : null}

      {essentials.length ? (
        <div className="rounded-[1.35rem] border border-border/70 bg-[#151515] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <p className="text-[0.92rem] font-semibold text-foreground/75">Essentials</p>
          <div className="mt-2 divide-y divide-white/10">
            {essentials.map((item) => (
              <ProfileBlock key={item.label} icon={item.icon} label={item.label} value={item.value} />
            ))}
          </div>
        </div>
      ) : null}

      {extraPhotos.length ? (
        <div className="rounded-[1.35rem] border border-border/70 bg-[#151515] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <p className="text-[0.92rem] font-semibold text-foreground/75">More photos</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {extraPhotos.map((src, index) => (
              <div key={src} className="relative aspect-[3/4] overflow-hidden rounded-[1.05rem] bg-[#101010]">
                <Image alt={`${displayName} ${index + 2}`} className="object-cover" fill sizes="(max-width: 1280px) 50vw, 16vw" src={src} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const { supabase, user } = await getServerAuthSession();

  if (!user || !supabase) {
    redirect("/login");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const messages = await fetchMessagesForIdentityIds(supabase, [user.id]);
  const activeSubscription = await loadActiveSubscription(supabase, user.id);
  const canSendDirectMessages = canDirectMessageUsers(activeSubscription);

  const summaryMap = new Map<
    string,
    {
      userId: string;
      latestMessage: string | null;
      latestAt: string;
      sentByMe: boolean;
      messages: NonNullable<typeof messages>;
    }
  >();

  for (const message of messages ?? []) {
    const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
    if (!otherUserId) {
      continue;
    }

    const entry = summaryMap.get(otherUserId);

    if (entry) {
      entry.messages.push(message);
      continue;
    }

    summaryMap.set(otherUserId, {
      userId: otherUserId,
      latestMessage: message.message,
      latestAt: message.created_at,
      sentByMe: message.sender_id === user.id,
      messages: [message],
    });
  }

  const otherIds = [...summaryMap.keys()];
  const profiles = otherIds.length ? await fetchProfilesForIdentityIds(supabase, otherIds) : [];

  const conversations = [...summaryMap.values()]
    .map((conversation) => {
      const profile = profiles.find((item) => item.user_id === conversation.userId || item.id === conversation.userId) ?? null;

      return {
        ...conversation,
        name: profile?.f_name ?? conversation.userId,
        email: profile?.email ?? null,
        profilePic: profile?.profile_pic ?? null,
        profile,
      };
    })
    .sort((left, right) => new Date(right.latestAt).getTime() - new Date(left.latestAt).getTime());

  const requestedConversationId = resolvedSearchParams.conversation ?? null;
  const requestedProfile =
    requestedConversationId && !conversations.some((conversation) => conversation.userId === requestedConversationId)
      ? (await fetchProfilesForIdentityIds(supabase, [requestedConversationId]))[0] ?? null
      : null;
  const selectedConversationId = requestedConversationId ?? conversations[0]?.userId ?? null;
  const selectedConversation =
    conversations.find((conversation) => conversation.userId === selectedConversationId) ??
    (requestedConversationId
      ? requestedProfile
        ? {
            userId: requestedConversationId,
            latestMessage: null,
            latestAt: requestedProfile.created_at,
            sentByMe: false,
            messages: [],
            name: requestedProfile.f_name ?? requestedConversationId,
            email: requestedProfile.email ?? null,
            profilePic: requestedProfile.profile_pic ?? null,
            profile: requestedProfile,
          }
        : null
      : null) ??
    conversations[0] ??
    null;
  const selectedMessages = selectedConversation?.messages ?? [];
  const replyRecipientLookup = selectedConversation?.email ?? selectedConversation?.userId ?? "";
  const selectedConversationKey = selectedConversation?.userId ?? replyRecipientLookup;
  const onlineUserIds = selectedConversation?.userId
    ? await fetchOnlineUserIds(supabase, [selectedConversation.userId])
    : new Set<string>();
  const selectedIsOnline = Boolean(selectedConversation?.userId && onlineUserIds.has(selectedConversation.userId));

  return (
    <section
      className="relative h-[calc(100dvh-3rem)] overflow-hidden bg-gradient-to-br from-[#020202] via-[#050505] to-[#010101] px-0 py-0 text-foreground"
      style={inboxThemeVars}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.09),_transparent_35%)]" />
      <div className="relative mx-auto h-full w-full max-w-[1560px] px-3 py-3 lg:px-5">
        <div className="grid h-full gap-3 xl:grid-cols-[minmax(0,1.45fr)_380px]">
          <div className="flex min-h-0 min-w-0 flex-col gap-3">
            <ChatHeader
              avatarUrl={selectedConversation?.profilePic ?? null}
              className="rounded-[1.6rem]"
              name={selectedConversation?.name ?? "Conversation"}
              online={selectedIsOnline}
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#050505] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              {selectedConversation ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <MessageList conversationKey={selectedConversationKey} currentUserId={user.id} messages={selectedMessages} />

                  <div className="shrink-0 border-t border-white/10 bg-[#101010] px-3 py-3 backdrop-blur-xl">
                    {canSendDirectMessages ? (
                      <ChatInput
                        conversationKey={selectedConversationKey}
                        recipientLookup={replyRecipientLookup}
                        placeholder="Type a message..."
                        canDirectMessage
                      />
                    ) : (
                      <div className="flex flex-col gap-3 rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/78 sm:flex-row sm:items-center sm:justify-between">
                        <p>A monthly subscription is required to send direct messages.</p>
                        <Button asChild className="w-fit bg-[#ff5a74] text-white hover:bg-[#e84a66]">
                          <Link href="/dashboard/subscription">Upgrade now</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-sm text-muted-foreground">
                  There is no conversation selected yet.
                </div>
              )}
            </div>
          </div>

          <RightRail selectedConversation={selectedConversation} selectedProfile={selectedConversation?.profile ?? null} />
        </div>
      </div>
    </section>
  );
}
