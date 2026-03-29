import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
}: {
  name: string;
  profilePic: string | null;
}) {
  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
      {profilePic ? (
        <Image alt={name} className="object-cover" fill sizes="44px" src={profilePic} />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
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
      };
    })
    .sort((left, right) => new Date(right.latestAt).getTime() - new Date(left.latestAt).getTime());

  const selectedConversationId = resolvedSearchParams.conversation ?? conversations[0]?.userId ?? null;
  const selectedConversation =
    conversations.find((conversation) => conversation.userId === selectedConversationId) ?? conversations[0] ?? null;
  const selectedMessages = selectedConversation?.messages ?? [];
  const replyRecipientLookup = selectedConversation?.email ?? selectedConversation?.userId ?? "";

  return (
    <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <Card className="overflow-hidden bg-white/90">
        <CardHeader className="border-b border-slate-200/80 bg-white/70">
          <CardTitle>Inbox</CardTitle>
          <CardDescription>Read your latest conversations and open any thread to see the full messages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {conversations.length ? (
            conversations.map((conversation) => {
              const active = conversation.userId === selectedConversation?.userId;

              return (
                <Link
                  key={conversation.userId}
                  className={`flex items-start gap-3 rounded-2xl border px-3 py-3 transition-colors ${
                    active
                      ? "border-rose-300 bg-rose-50/80"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                  href={`/dashboard/inbox?conversation=${conversation.userId}`}
                >
                  <ConversationAvatar name={conversation.name} profilePic={conversation.profilePic} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-slate-950">{conversation.name}</p>
                      <time className="shrink-0 text-xs text-slate-500">{formatUtcDateTime(conversation.latestAt)}</time>
                    </div>
                    <p className="truncate text-sm text-slate-500">{conversation.email ?? "No email provided"}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                      {conversation.latestMessage ?? "No message text yet."}
                    </p>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
              No conversations yet. Send a message from Discover to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden bg-white/90">
        <CardHeader className="border-b border-slate-200/80 bg-white/70">
          {selectedConversation ? (
              <div className="flex items-center gap-3">
              <ConversationAvatar name={selectedConversation.name} profilePic={selectedConversation.profilePic} />
              <div className="min-w-0">
                <CardTitle className="truncate">{selectedConversation.name}</CardTitle>
                <CardDescription className="truncate">
                  {selectedConversation.email ?? "No email provided"}
                </CardDescription>
              </div>
              <Badge className="ml-auto" variant="outline">
                {selectedMessages.length} messages
              </Badge>
            </div>
          ) : (
            <>
              <CardTitle>Select a conversation</CardTitle>
              <CardDescription>Choose a thread from the list to read the full messages here.</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          {selectedConversation ? (
            <>
              <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                {selectedMessages.length ? (
                  [...selectedMessages].reverse().map((message) => {
                    const sentByMe = message.sender_id === user.id;

                    return (
                      <div key={message.id} className={`flex ${sentByMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[78%] rounded-3xl px-4 py-3 shadow-sm ${
                            sentByMe ? "bg-[#f04662] text-white" : "bg-white text-slate-950"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-6">{message.message ?? "No message text yet."}</p>
                          <p className={`mt-2 text-xs ${sentByMe ? "text-white/70" : "text-slate-500"}`}>
                            {formatUtcDateTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-600">This conversation has no messages yet.</p>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/90 p-5">
                <h3 className="text-lg font-semibold text-slate-950">Reply</h3>
                <p className="mb-4 text-sm text-slate-600">
                  Replying to {selectedConversation.name} with the recipient already filled in.
                </p>
                <MessageComposer key={replyRecipientLookup} defaultRecipientLookup={replyRecipientLookup} />
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-600">
              There is no conversation selected yet.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
