import Image from "next/image";
import { redirect } from "next/navigation";
import { MessageComposer } from "@/components/dashboard/message-composer";
import { fetchMessagesForIdentityIds, fetchProfilesForIdentityIds } from "@/lib/message-feed";
import { formatUtcDateTime } from "@/lib/date-format";
import { getServerAuthSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface InboxPageProps {
  searchParams?: Promise<{
    conversation?: string;
  }>;
}

function ConversationAvatar({
  name,
  profilePic,
  className = "h-11 w-11",
}: {
  name: string;
  profilePic: string | null;
  className?: string;
}) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 ${className}`}>
      {profilePic ? (
        <Image alt={name} className="object-cover" fill sizes="56px" src={profilePic} />
      ) : (
        <span className="text-xs font-semibold uppercase text-white/80">{name.slice(0, 2)}</span>
      )}
    </div>
  );
}

function ProfileBlock({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="border-b border-white/10 py-3 last:border-b-0">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white/35">{label}</p>
      <p className="mt-1 text-[0.95rem] leading-6 text-white/85">{value || "Not set"}</p>
    </div>
  );
}

function RightRail({
  selectedProfile,
  selectedConversation,
}: {
  selectedProfile: NonNullable<Awaited<ReturnType<typeof fetchProfilesForIdentityIds>>>[number] | null;
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
  const secondPicture = selectedProfile?.picture2 ?? null;
  const thirdPicture = selectedProfile?.picture3 ?? null;

  return (
    <aside className="space-y-4">
      <div className="overflow-hidden rounded-[1.6rem] bg-[#111] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-[2rem] font-semibold tracking-tight text-white">
            {displayName}
            {displayAge}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-1 bg-[#0d0d0d]">
          <div className="col-span-3 relative aspect-[3/4] min-h-[360px] bg-[#1a1a1a]">
            {picture ? (
              <Image alt={displayName} className="object-cover" fill sizes="(max-width: 1280px) 100vw, 33vw" src={picture} />
            ) : (
              <div className="flex h-full items-center justify-center text-white/40">No profile image</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[1.6rem] bg-[#111] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-2 text-white/70">
          <span className="text-[1.05rem]">Looking for</span>
        </div>
        <div className="mt-4 rounded-[1.2rem] bg-white/[0.03] px-4 py-5">
          <p className="text-[1rem] font-semibold text-white/85">
            {selectedProfile?.relationship_goals ?? "Not set"}
          </p>
        </div>
      </div>

      <div className="rounded-[1.6rem] bg-[#111] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <p className="flex items-center gap-2 text-[1rem] font-semibold text-white/70">About me</p>
        <p className="mt-4 text-[0.98rem] leading-7 text-white/85">
          {selectedProfile?.bio ?? "No bio added yet."}
        </p>
      </div>

      <div className="rounded-[1.6rem] bg-[#111] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <p className="flex items-center gap-2 text-[1rem] font-semibold text-white/70">Essentials</p>
        <div className="mt-3 divide-y divide-white/10">
          <ProfileBlock label="Location" value={location || "Location not set"} />
          <ProfileBlock label="Job title" value={selectedProfile?.job_title} />
          <ProfileBlock label="Company" value={selectedProfile?.company} />
          <ProfileBlock label="Education" value={selectedProfile?.education} />
          <ProfileBlock label="Height" value={selectedProfile?.height ? `${selectedProfile.height} cm` : null} />
          <ProfileBlock label="Lifestyle" value={[selectedProfile?.drinking, selectedProfile?.smoking, selectedProfile?.workout, selectedProfile?.pets].filter(Boolean).join(" · ") || null} />
        </div>
      </div>

      {(secondPicture || thirdPicture) && (
        <div className="rounded-[1.6rem] bg-[#111] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <p className="text-[1rem] font-semibold text-white/70">More photos</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[secondPicture, thirdPicture].map((src, index) => (
              <div key={index} className="relative aspect-[3/4] overflow-hidden rounded-[1.2rem] bg-white/5">
                {src ? (
                  <Image alt={`${displayName} ${index + 2}`} className="object-cover" fill sizes="(max-width: 1280px) 50vw, 16vw" src={src} />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const { supabase, user } = await getServerAuthSession();

  if (!user || !supabase) {
    redirect("/login");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const messageIdentityIds = [user.id];
  const messages = await fetchMessagesForIdentityIds(supabase, messageIdentityIds);

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
      const profile = profiles.find((item) => item.user_id === conversation.userId || item.id === conversation.userId);

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
  const latestMessageDate = selectedMessages.length
    ? selectedMessages[selectedMessages.length - 1]?.created_at ?? selectedConversation?.latestAt ?? ""
    : selectedConversation?.latestAt ?? "";

  return (
    <section className="min-h-[calc(100vh-3rem)] bg-black px-0 py-0 text-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-4 lg:px-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_420px]">
          <div className="min-w-0 space-y-4">
            <div className="flex items-center justify-between rounded-[1.6rem] border border-white/10 bg-[#0f0f0f] px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              {selectedConversation ? (
                <div className="flex min-w-0 items-center gap-3">
                  <ConversationAvatar name={selectedConversation.name} profilePic={selectedConversation.profilePic} />
                  <div className="min-w-0">
                    <p className="truncate text-[1.05rem] font-semibold text-white/90">
                      You matched with {selectedConversation.name} on{" "}
                      {latestMessageDate ? formatUtcDateTime(latestMessageDate).split(",")[0] : "recently"}
                    </p>
                    <p className="truncate text-[0.88rem] text-white/45">Open conversation</p>
                  </div>
                </div>
              ) : (
                <p className="text-[1rem] text-white/60">Select a conversation from the sidebar to get started.</p>
              )}

              <div className="flex items-center gap-3 text-white/55">
                <span className="text-2xl leading-none text-[#ff4b6f]">•••</span>
                <span className="text-3xl leading-none">×</span>
              </div>
            </div>

            <div className="min-h-[72vh] rounded-[1.6rem] border border-white/10 bg-[#0f0f0f] shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              {selectedConversation ? (
                <div className="flex min-h-[72vh] flex-col">
                  <div className="flex-1 space-y-5 px-5 py-5">
                    {selectedMessages.length ? (
                      [...selectedMessages].reverse().map((message) => {
                        const sentByMe = message.sender_id === user.id;

                        return (
                          <div key={message.id} className={`flex ${sentByMe ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[78%] rounded-3xl px-4 py-3 shadow-sm ${
                                sentByMe ? "bg-[#ff4b6f] text-white" : "bg-[#242424] text-white"
                              }`}
                            >
                              <p className="whitespace-pre-wrap text-sm leading-6">{message.message ?? "No message text yet."}</p>
                              <p className={`mt-2 text-xs ${sentByMe ? "text-white/70" : "text-white/45"}`}>
                                {formatUtcDateTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-white/55">This conversation has no messages yet.</p>
                    )}
                  </div>

                  <div className="border-t border-white/10 px-4 py-4">
                    <MessageComposer
                      key={replyRecipientLookup}
                      defaultRecipientLookup={replyRecipientLookup}
                      mode="reply"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[72vh] items-center justify-center px-6 text-sm text-white/55">
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
