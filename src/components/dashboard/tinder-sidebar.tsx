"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Heart,
  Home,
  LogOut,
  Search,
  Sparkles,
  Ticket,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatUtcDateTime } from "@/lib/date-format";

export interface SidebarConversationPreview {
  userId: string;
  name: string;
  profilePic: string | null;
  latestMessage: string | null;
  latestAt: string;
  sentByMe: boolean;
}

export interface SidebarMatchPreview {
  userId: string;
  name: string;
  profilePic: string | null;
  age: number | null;
  city: string | null;
  area: string | null;
  conversation: boolean | null;
  createdAt: string;
}

interface TinderSidebarProps {
  displayName: string;
  age: number | null;
  membershipLabel: string;
  profilePic: string | null;
  profileCompletion: number;
  location: string;
  conversations: SidebarConversationPreview[];
  matches: SidebarMatchPreview[];
}

function formatLatestAt(latestAt: string) {
  return formatUtcDateTime(latestAt);
}

function SidebarAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src: string | null;
  className: string;
}) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-full bg-white/10", className)}>
      {src ? (
        <Image alt={name} className="object-cover" fill sizes="128px" src={src} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-white/10 text-sm font-semibold uppercase text-white">
          {name.slice(0, 2)}
        </div>
      )}
    </div>
  );
}

function SidebarBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-[#2b4d82] px-1.5 text-[0.7rem] font-semibold text-[#a8c6ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
      {children}
    </span>
  );
}

const READ_CONVERSATIONS_STORAGE_KEY = "nanameets_read_conversations";

function readConversationMap() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(READ_CONVERSATIONS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeConversationMap(nextMap: Record<string, string>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(READ_CONVERSATIONS_STORAGE_KEY, JSON.stringify(nextMap));
}

export function TinderSidebar({
  displayName,
  age,
  membershipLabel,
  profilePic,
  profileCompletion,
  location,
  conversations,
  matches,
}: TinderSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [signingOut, setSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState<"messages" | "matches">("messages");
  const [searchTerm, setSearchTerm] = useState("");
  const [readConversationMapState, setReadConversationMapState] = useState<Record<string, string>>({});

  const homeActive = pathname === "/dashboard";
  const exploreActive = pathname.startsWith("/dashboard/discover");
  const likesActive = pathname.startsWith("/dashboard/likes");
  const selectedConversationId = pathname === "/dashboard/inbox" ? searchParams.get("conversation") : null;
  const completion = Math.max(0, Math.min(100, Math.round(profileCompletion)));
  const unreadCount = useMemo(() => {
    const count = conversations.filter(
      (conversation) => {
        if (conversation.userId === selectedConversationId || conversation.sentByMe) {
          return false;
        }

        const openedAt = readConversationMapState[conversation.userId];
        if (!openedAt) {
          return true;
        }

        return new Date(conversation.latestAt).getTime() > new Date(openedAt).getTime();
      }
    ).length;
    return Math.min(99, count);
  }, [conversations, readConversationMapState, selectedConversationId]);
  const filteredConversations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const haystack = [
        conversation.name,
        conversation.latestMessage ?? "",
        formatLatestAt(conversation.latestAt),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [conversations, searchTerm]);

  const handleSignOut = async () => {
    if (!supabase) {
      router.replace("/login");
      return;
    }

    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
    setSigningOut(false);
  };

  useEffect(() => {
    setReadConversationMapState(readConversationMap());
  }, []);

  useEffect(() => {
    if (!selectedConversationId || pathname !== "/dashboard/inbox") {
      return;
    }

    const nextMap = {
      ...readConversationMap(),
      [selectedConversationId]: new Date().toISOString(),
    };

    writeConversationMap(nextMap);
    setReadConversationMapState(nextMap);
  }, [pathname, selectedConversationId]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_30%),linear-gradient(180deg,#070707_0%,#050505_100%)] text-white">
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-4">
          <Link
            className="block rounded-[1.6rem] bg-[linear-gradient(160deg,#ff476f_0%,#ec2f7a_55%,#db2e87_100%)] p-4 shadow-[0_20px_50px_rgba(236,47,122,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(236,47,122,0.34)]"
            href="/dashboard/profile"
          >
            <div className="flex items-center gap-3">
              <SidebarAvatar className="h-16 w-16 ring-3 ring-white/18" name={displayName} src={profilePic} />
              <div className="min-w-0">
                <p className="truncate font-heading text-[1.25rem] font-semibold leading-none tracking-tight text-white">
                  {displayName}
                  {age ? `, ${age}` : ""}
                </p>
                <p className="mt-1.5 text-[0.8rem] font-medium leading-none text-white/[0.9]">{membershipLabel}</p>
                <p className="mt-1.5 truncate text-[0.72rem] leading-none text-white/[0.75]">{location}</p>
              </div>
            </div>

            <section className="mt-5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.85rem] font-medium tracking-tight text-white/[0.9]">Profile Completion</p>
                <span className="text-[0.85rem] font-semibold text-white">{completion}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-black/15 ring-1 ring-white/10">
                <div
                  className="h-full rounded-full bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.25)] transition-[width] duration-500 ease-out"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </section>
          </Link>

          <section className="grid grid-cols-2 gap-2.5">
            <Link
              className={cn(
                "flex h-12 items-center justify-center gap-2.5 rounded-[0.95rem] border border-white/[0.12] bg-black/20 px-3 text-white shadow-[0_1px_0_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.2] hover:bg-white/[0.05]",
                homeActive ? "border-white/[0.18] bg-white/[0.06]" : ""
              )}
              href="/dashboard"
            >
              <Home className={cn("h-5 w-5 shrink-0", homeActive ? "fill-white stroke-[1.8]" : "stroke-[1.8]")} />
              <span className="font-heading text-[0.95rem] font-semibold tracking-tight">Home</span>
            </Link>

            <Link
              className={cn(
                "flex h-12 items-center justify-center gap-2.5 rounded-[0.95rem] border border-white/[0.12] bg-black/20 px-3 text-white shadow-[0_1px_0_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.2] hover:bg-white/[0.05]",
                exploreActive ? "border-white/[0.18] bg-white/[0.06]" : ""
              )}
              href="/dashboard/discover"
            >
              <Sparkles
                className={cn("h-5 w-5 shrink-0", exploreActive ? "fill-white stroke-[1.8]" : "stroke-[1.8]")}
              />
              <span className="font-heading text-[0.95rem] font-semibold tracking-tight">Explore</span>
            </Link>
          </section>

          <section className="grid grid-cols-[1fr_1fr_1.35fr] gap-2.5">
            <Link
              aria-label="Likes"
              className={cn(
                "flex h-11 items-center justify-center rounded-[0.9rem] border border-[#7c132d]/80 bg-black/25 text-[#ff7994] transition hover:-translate-y-0.5 hover:border-[#ff7994]/70 hover:bg-[#ff7994]/[0.08]",
                likesActive ? "border-[#ff7994]/70 bg-[#ff7994]/[0.08]" : ""
              )}
              href="/dashboard/likes"
            >
              <Heart className="h-4.5 w-4.5 fill-current stroke-[1.6]" />
            </Link>

            <Link
              aria-label="Tickets"
              className="flex h-11 items-center justify-center rounded-[0.9rem] border border-[#7e5b10]/80 bg-black/25 text-[#f2b21c] transition hover:-translate-y-0.5 hover:border-[#f2b21c]/70 hover:bg-[#f2b21c]/[0.08]"
              href="/dashboard/settings"
            >
              <Ticket className="h-4.5 w-4.5 stroke-[1.8]" />
            </Link>

            <Link
              className="flex h-11 items-center justify-center gap-2 rounded-[0.9rem] border border-[#2357c2]/70 bg-black/25 px-3 text-[#6da2ff] transition hover:-translate-y-0.5 hover:border-[#6da2ff]/70 hover:bg-[#6da2ff]/[0.08]"
              href="/dashboard/discover"
            >
              <Zap className="h-4.5 w-4.5 stroke-[1.8]" />
              <span className="font-heading text-[0.9rem] font-semibold tracking-tight">Boosts</span>
              <SidebarBadge>0</SidebarBadge>
            </Link>
          </section>

          <section className="pt-1">
            <div className="flex items-end gap-6 border-b border-white/10">
              <button
                className={cn(
                  "relative -mb-px pb-3 font-heading text-[1.2rem] font-semibold tracking-tight transition-colors",
                  activeTab === "messages" ? "text-[#ff5f7d]" : "text-white/52 hover:text-white/75"
                )}
                onClick={() => setActiveTab("messages")}
                type="button"
              >
                Messages
                {unreadCount ? (
                  <span className="absolute -right-5 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f64b57] px-1.5 text-[0.72rem] font-bold text-white shadow-[0_8px_18px_rgba(246,75,87,0.35)]">
                    {unreadCount}
                  </span>
                ) : null}
                {activeTab === "messages" ? (
                  <span className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-[#ff5f7d]" />
                ) : null}
              </button>

              <button
                className={cn(
                  "relative -mb-px pb-3 font-heading text-[1.2rem] font-semibold tracking-tight transition-colors",
                  activeTab === "matches" ? "text-[#ff5f7d]" : "text-white/52 hover:text-white/75"
                )}
                onClick={() => setActiveTab("matches")}
                type="button"
              >
                Matches
                {activeTab === "matches" ? (
                  <span className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-[#ff5f7d]" />
                ) : null}
              </button>
            </div>

            {activeTab === "messages" ? (
              <div className="mt-4 space-y-3">
                <label className="flex h-12 items-center gap-2.5 rounded-[0.95rem] border border-white/[0.12] bg-white/[0.06] px-3.5 text-white/[0.8] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <Search className="h-4.5 w-4.5 shrink-0 text-white/45" />
                  <input
                    className="h-full w-full bg-transparent text-[0.9rem] outline-none placeholder:text-white/40"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search messages..."
                    value={searchTerm}
                  />
                </label>

                <div className="space-y-2">
                  {filteredConversations.length ? (
                    filteredConversations.map((conversation) => (
                      <Link
                        key={conversation.userId}
                        className={cn(
                          "block rounded-[1.1rem] transition",
                          selectedConversationId === conversation.userId
                            ? "bg-white/[0.07]"
                            : "hover:bg-white/[0.04]"
                        )}
                        href={`/dashboard/inbox?conversation=${conversation.userId}`}
                      >
                        <div className="flex items-start gap-2.5 px-2 py-2.5">
                          <div className="relative mt-0.5">
                            <SidebarAvatar className="h-12 w-12" name={conversation.name} src={conversation.profilePic} />
                            {!conversation.sentByMe &&
                            conversation.userId !== selectedConversationId &&
                            (() => {
                              const openedAt = readConversationMapState[conversation.userId];
                              return !openedAt || new Date(conversation.latestAt).getTime() > new Date(openedAt).getTime();
                            })() ? (
                              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#060606] bg-[#ff5f7d]" />
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-heading text-[0.98rem] font-semibold leading-tight text-white">
                                  {conversation.name}
                                </p>
                                <p className="mt-0.5 truncate text-[0.82rem] leading-5 text-white/[0.68]">
                                  {conversation.latestMessage ?? "No message yet"}
                                </p>
                              </div>

                              <time className="shrink-0 pt-0.5 text-[0.72rem] text-white/[0.38]">
                                {formatLatestAt(conversation.latestAt)}
                              </time>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="rounded-[1rem] border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white/60">
                      No conversations match your search yet.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                {matches.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {matches.map((match) => (
                      <Link
                        key={match.userId}
                        className="group relative aspect-[0.9/1] overflow-hidden rounded-[1rem] border border-white/10 bg-[#141414] shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-white/20"
                        href={`/dashboard/inbox?conversation=${match.userId}`}
                      >
                        <div className="absolute inset-0">
                          <SidebarAvatar className="h-full w-full rounded-none" name={match.name} src={match.profilePic} />
                        </div>

                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.88)_100%)]" />

                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <p className="truncate font-heading text-[1.2rem] font-semibold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
                            {match.name}
                          </p>
                          <p className="mt-1 truncate text-[0.82rem] leading-5 text-white/75 drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
                            {[match.city, match.area].filter(Boolean).join(" · ") || "Location not set"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1rem] border border-white/10 bg-white/[0.05] px-3.5 py-3 text-sm text-white/[0.6]">
                    No matches yet. Keep swiping and messaging to build your list.
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <button
          className="flex items-center gap-3 text-white transition-colors hover:text-white/[0.75]"
          disabled={signingOut}
          onClick={handleSignOut}
          type="button"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-[0.8rem] border border-white/[0.75] text-white">
            <LogOut className="h-4.5 w-4.5 stroke-[2.1]" />
          </span>
          <span className="font-heading text-[0.98rem] font-semibold leading-none tracking-tight">
            {signingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>
    </div>
  );
}
