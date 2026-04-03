"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MoreVertical, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import type { SidebarConversationPreview, SidebarMatchPreview } from "@/components/dashboard/tinder-sidebar";

type MobileConversationProfile = {
  f_name?: string | null;
  age?: number | null;
  city?: string | null;
  area?: string | null;
  profile_pic?: string | null;
};

type MobileConversation = SidebarConversationPreview & {
  profile?: MobileConversationProfile | null;
};

type MobileSelectedConversation = MobileConversation | null;

type InboxFilter = "all" | "unread" | "read";

type MobileInboxFlowProps = {
  conversations: MobileConversation[];
  matches: SidebarMatchPreview[];
  selectedConversation: MobileSelectedConversation;
  selectedMessages: Array<{
    id: number;
    sender_id: string;
    receiver_id: string;
    message: string | null;
    created_at: string;
  }>;
  currentUserId: string;
  canSendDirectMessages: boolean;
  replyRecipientLookup: string;
  selectedConversationKey: string;
  selectedIsOnline: boolean;
};

function SectionHeader({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[1.05rem] font-semibold tracking-tight text-white">{title}</h2>
      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white/7 px-2 text-[0.82rem] font-semibold text-white/45">
        {count}
      </span>
    </div>
  );
}

function ConversationCard({
  conversation,
}: {
  conversation: MobileConversation;
}) {
  const unread = !conversation.sentByMe;
  const latest = conversation.latestMessage ?? "Say hello to start the chat.";

  return (
    <Link
      className={cn(
        "flex items-center gap-3 py-3 transition active:scale-[0.99]",
        unread ? "shadow-[0_12px_30px_rgba(255,95,125,0.08)]" : "",
      )}
      href={`/dashboard/inbox?conversation=${conversation.userId}`}
    >
      <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-full bg-white/10">
        {conversation.profilePic ? (
          <Image alt={conversation.name} className="object-cover" fill sizes="56px" src={conversation.profilePic} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase text-white/70">
            {conversation.name.slice(0, 2)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[0.98rem] font-semibold leading-tight text-white">{conversation.name}</p>
            <p className="mt-1 line-clamp-1 text-[0.84rem] leading-5 text-white/52">{latest}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <time className="text-[0.68rem] text-white/40">{new Intl.DateTimeFormat("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(conversation.latestAt))}</time>
          </div>
        </div>
        <div className="mt-3 h-px w-full bg-white/[0.08]" />
      </div>
    </Link>
  );
}

function MatchCard({ match }: { match: SidebarMatchPreview }) {
  return (
    <Link
      className="group relative aspect-[0.9/1] overflow-hidden rounded-[1.2rem] border border-white/8 bg-[#121212] shadow-[0_14px_40px_rgba(0,0,0,0.35)]"
      href={`/dashboard/inbox?conversation=${match.userId}`}
    >
      <div className="absolute inset-0">
        {match.profilePic ? (
          <Image alt={match.name} className="object-cover transition duration-300 group-hover:scale-[1.02]" fill sizes="50vw" src={match.profilePic} />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1d1d1d] via-[#101010] to-[#090909]" />
        )}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.18)_50%,rgba(0,0,0,0.9)_100%)]" />
      <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#ff5f7d]/90 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_20px_rgba(0,0,0,0.25)]">
        <Sparkles className="h-3 w-3" />
        Match
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="truncate text-[1.05rem] font-semibold leading-tight text-white">{match.name}</p>
        <p className="mt-1 truncate text-[0.76rem] text-white/72">
          {[match.city, match.area].filter(Boolean).join(" · ") || "Location not set"}
        </p>
      </div>
    </Link>
  );
}

export function MobileInboxFlow({
  conversations,
  matches,
  selectedConversation,
  selectedMessages,
  currentUserId,
  canSendDirectMessages,
  replyRecipientLookup,
  selectedConversationKey,
  selectedIsOnline,
}: MobileInboxFlowProps) {
  const [activeTab, setActiveTab] = useState<"messages" | "matches">("messages");
  const [activeFilter, setActiveFilter] = useState<InboxFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      if (activeFilter === "unread" && conversation.sentByMe) {
        return false;
      }

      if (activeFilter === "read" && !conversation.sentByMe) {
        return false;
      }

      const haystack = [
        conversation.name,
        conversation.latestMessage ?? "",
        conversation.profile?.city ?? "",
        conversation.profile?.area ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [activeFilter, conversations, searchTerm]);

  const filteredMatches = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return matches;
    }

    return matches.filter((match) => {
      const haystack = [match.name, match.city ?? "", match.area ?? ""].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [matches, searchTerm]);

  if (selectedConversation) {
    return (
      <section className="flex h-full min-h-0 flex-col gap-3 overflow-hidden bg-[linear-gradient(180deg,#040404_0%,#090909_40%,#020202_100%)] px-3 py-3 text-white">
        <ChatHeader
          avatarUrl={selectedConversation.profilePic ?? null}
          backHref="/dashboard/inbox"
          className="rounded-[1.35rem]"
          name={selectedConversation.name}
          online={selectedIsOnline}
        />

        <div className="rounded-[1.5rem] border border-white/10 bg-[#060606] px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[1.25rem] font-semibold tracking-tight">{selectedConversation.name}</p>
              <p className="mt-1 text-xs text-white/55">
                {selectedConversation.profile?.age ? `${selectedConversation.profile.age} years old` : "Conversation"}
                {selectedConversation.profile?.city || selectedConversation.profile?.area
                  ? ` · ${[selectedConversation.profile?.city, selectedConversation.profile?.area].filter(Boolean).join(" · ")}`
                  : ""}
              </p>
            </div>
            <span className={cn("rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em]", selectedIsOnline ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-white/55")}>
              {selectedIsOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#050505] shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <div className="min-h-0 flex-1 overflow-hidden">
            <MessageList
              conversationKey={selectedConversationKey}
              currentUserId={currentUserId}
              messages={selectedMessages}
            />
          </div>

          <div className="shrink-0 border-t border-white/10 bg-[#101010] px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
            {canSendDirectMessages ? (
              <ChatInput
                canDirectMessage
                conversationKey={selectedConversationKey}
                placeholder="Send a message..."
                recipientLookup={replyRecipientLookup}
              />
            ) : (
              <div className="flex flex-col gap-3 rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/78">
                <p>A monthly subscription is required to send direct messages.</p>
                <Button asChild className="w-full rounded-full bg-[#ff5a74] text-white hover:bg-[#e84a66]">
                  <Link href="/dashboard/subscription">Upgrade now</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="h-full min-h-0 overflow-y-auto bg-[#121212] px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+5rem)] text-white">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 rounded-[1rem] bg-[#121212] px-1 py-1">
          <div className="relative h-10 w-[86px] shrink-0">
            <Image
              priority
              alt="Nana Meets"
              className="object-contain object-left"
              fill
              sizes="86px"
              src="/images/nana_meets_logo_white.png"
            />
          </div>

          <button
            aria-label="Menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[0.8rem] border border-white/10 bg-white/[0.04] text-white/80"
            type="button"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 rounded-[1.2rem] border border-white/10 bg-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <Search className="h-4.5 w-4.5 shrink-0 text-white/40" />
            <Input
              className="h-8 border-0 bg-transparent px-0 text-[0.9rem] text-white placeholder:text-white/35 focus-visible:ring-0 focus-visible:ring-offset-0"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search users and conversations..."
              value={searchTerm}
            />
          </div>
        </div>

        <div className="mt-5">
          <SectionHeader title="New Matches" count={filteredMatches.length} />
          <div className="mt-4">
            {filteredMatches.length ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredMatches.map((match) => (
                  <MatchCard key={match.userId} match={match} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <p className="text-[1rem] font-semibold text-white">No matches yet!</p>
                <p className="mt-1 text-[0.92rem] leading-6 text-white/55">Keep swiping to find your perfect match</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <SectionHeader title="Messages" count={filteredConversations.length} />

          <div className="mt-4 flex items-center gap-6">
            {(["all", "unread", "read"] as InboxFilter[]).map((filter) => {
              const active = activeFilter === filter;

              return (
                <button
                  key={filter}
                  className="relative pb-2 text-center text-[0.86rem] font-medium capitalize text-white/56"
                  onClick={() => setActiveFilter(filter)}
                  type="button"
                >
                  <span className={cn(active ? "text-[#ff5f7d]" : "text-white/54")}>{filter}</span>
                  <span
                    className={cn(
                      "absolute inset-x-0 bottom-0 h-[2px] rounded-full transition",
                      active ? "bg-[#ff5f7d]" : "bg-transparent",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            {filteredConversations.length ? (
              <div className="divide-y divide-white/8">
                {filteredConversations.map((conversation) => (
                  <ConversationCard key={conversation.userId} conversation={conversation} />
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-[0.94rem] text-white/55">
                No conversations match your search.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
