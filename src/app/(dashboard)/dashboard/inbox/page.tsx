import Image from "next/image";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { ChatHeader } from "@/components/dashboard/chat/chat-header";
import { ChatInput } from "@/components/dashboard/chat/chat-input";
import { MessageList } from "@/components/dashboard/chat/message-list";
import { fetchMessagesForIdentityIds, fetchProfilesForIdentityIds } from "@/lib/message-feed";
import { fetchOnlineUserIds } from "@/lib/presence";
import { getServerAuthSession } from "@/lib/supabase/server";

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
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="border-b border-border/70 py-2.5 last:border-b-0">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[0.92rem] leading-6 text-foreground/90">{value || "Not set"}</p>
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

  return (
    <aside className="h-full space-y-3 overflow-y-auto pr-1">
      <div className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-[#151515] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="px-4 py-3">
          <h2 className="text-[1.75rem] font-semibold tracking-tight text-foreground">
            {displayName}
            {displayAge}
          </h2>
        </div>

        <div className="relative aspect-[3/4] min-h-[300px] bg-[#0f0f0f]">
          {picture ? (
            <Image alt={displayName} className="object-cover" fill sizes="(max-width: 1280px) 100vw, 33vw" src={picture} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No profile image</div>
          )}
        </div>
      </div>

      <div className="rounded-[1.35rem] border border-border/70 bg-[#151515] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <p className="text-[0.92rem] font-semibold text-foreground/75">Looking for</p>
        <div className="mt-3 rounded-[1.1rem] bg-[#101010] px-4 py-4">
          <p className="text-[0.98rem] font-semibold text-foreground/90">{selectedProfile?.relationship_goals ?? "Not set"}</p>
        </div>
      </div>

      <div className="rounded-[1.35rem] border border-border/70 bg-[#151515] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <p className="text-[0.92rem] font-semibold text-foreground/75">About me</p>
        <p className="mt-3 text-[0.92rem] leading-6 text-foreground/90">{selectedProfile?.bio ?? "No bio added yet."}</p>
      </div>

      <div className="rounded-[1.35rem] border border-border/70 bg-[#151515] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <p className="text-[0.92rem] font-semibold text-foreground/75">Essentials</p>
        <div className="mt-2 divide-y divide-white/10">
          <ProfileBlock label="Location" value={location || "Location not set"} />
          <ProfileBlock label="Job title" value={selectedProfile?.job_title} />
          <ProfileBlock label="Company" value={selectedProfile?.company} />
          <ProfileBlock label="Education" value={selectedProfile?.education} />
          <ProfileBlock label="Height" value={selectedProfile?.height ? `${selectedProfile.height} cm` : null} />
          <ProfileBlock
            label="Lifestyle"
            value={[selectedProfile?.drinking, selectedProfile?.smoking, selectedProfile?.workout, selectedProfile?.pets].filter(Boolean).join(" · ") || null}
          />
        </div>
      </div>

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

  const selectedConversationId = resolvedSearchParams.conversation ?? conversations[0]?.userId ?? null;
  const selectedConversation =
    conversations.find((conversation) => conversation.userId === selectedConversationId) ?? conversations[0] ?? null;
  const selectedMessages = selectedConversation?.messages ?? [];
  const replyRecipientLookup = selectedConversation?.email ?? selectedConversation?.userId ?? "";
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
                  <MessageList currentUserId={user.id} messages={selectedMessages} />

                  <div className="shrink-0 border-t border-white/10 bg-[#101010] px-3 py-3 backdrop-blur-xl">
                    <ChatInput recipientLookup={replyRecipientLookup} placeholder="Type a message..." />
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
