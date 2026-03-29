"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Home, LogOut, Sparkles } from "lucide-react";
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

interface TinderSidebarProps {
  displayName: string;
  age: number | null;
  membershipLabel: string;
  profilePic: string | null;
  profileCompletion: number;
  location: string;
  conversations: SidebarConversationPreview[];
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

export function TinderSidebar({
  displayName,
  age,
  membershipLabel,
  profilePic,
  profileCompletion,
  location,
  conversations,
}: TinderSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [signingOut, setSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState<"messages" | "matches">("messages");

  const homeActive = pathname === "/dashboard";
  const exploreActive = pathname.startsWith("/dashboard/discover");
  const selectedConversationId = pathname === "/dashboard/inbox" ? searchParams.get("conversation") : null;
  const completion = Math.max(0, Math.min(100, Math.round(profileCompletion)));

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

  return (
    <div className="flex h-full min-h-0 flex-col text-white">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4">
        <div className="flex flex-col gap-5">
          <div className="rounded-[1.5rem] bg-[#f04662] px-4 py-3.5 shadow-[0_16px_40px_rgba(240,70,98,0.22)]">
            <div className="flex items-center gap-3.5">
              <SidebarAvatar className="h-12 w-12" name={displayName} src={profilePic} />
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold leading-none tracking-tight text-white">
                  {displayName}
                  {age ? `, ${age}` : ""}
                </p>
                <p className="mt-1 text-xs font-medium leading-none text-white/90">{membershipLabel}</p>
                <p className="mt-1 truncate text-[11px] leading-none text-white/75">{location}</p>
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-medium tracking-tight text-white">Profile Completion</p>
              <span className="text-base font-semibold text-[#ff5a76]">{completion}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/95">
              <div
                className="h-full rounded-full bg-[#f04662] transition-[width] duration-500 ease-out"
                style={{ width: `${completion}%` }}
              />
            </div>
          </section>

          <nav className="space-y-3">
            <Link
              className={cn(
                "flex items-center gap-3 rounded-[1.15rem] px-2 py-1.5 transition-colors",
                homeActive ? "text-white" : "text-white/70 hover:text-white"
              )}
              href="/dashboard"
            >
              <Home
                className={cn(
                  "h-7 w-7 shrink-0",
                  homeActive ? "fill-white stroke-[1.6]" : "stroke-[1.6] opacity-90"
                )}
              />
              <span className="text-lg font-medium leading-none tracking-tight">Home</span>
            </Link>

            <Link
              className={cn(
                "flex items-center gap-3 rounded-[1.15rem] px-2 py-1.5 transition-colors",
                exploreActive ? "text-white" : "text-white/70 hover:text-white"
              )}
              href="/dashboard/discover"
            >
              <Sparkles
                className={cn(
                  "h-7 w-7 shrink-0",
                  exploreActive ? "fill-white stroke-[1.6]" : "stroke-[1.6] opacity-90"
                )}
              />
              <span className="text-lg font-medium leading-none tracking-tight">Explore</span>
            </Link>
          </nav>

          <section className="space-y-3">
            <div className="flex items-center gap-4 text-base leading-none">
              <button
                className={cn(
                  "relative pb-2 font-medium transition-colors",
                  activeTab === "messages" ? "text-white" : "text-white/80 hover:text-white"
                )}
                onClick={() => setActiveTab("messages")}
                type="button"
              >
                Messages
                {activeTab === "messages" ? (
                  <span className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-[#f04662]" />
                ) : null}
              </button>
              <button
                className={cn(
                  "pb-2 font-medium transition-colors",
                  activeTab === "matches" ? "text-white" : "text-white/80 hover:text-white"
                )}
                onClick={() => setActiveTab("matches")}
                type="button"
              >
                Matches
              </button>
            </div>

            {activeTab === "messages" ? (
              <div className="space-y-2 px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
                  Recent messages
                </p>
                {conversations.length ? (
                  conversations.map((conversation) => (
                    <Link
                      key={conversation.userId}
                      className={cn(
                        "block rounded-[1.1rem] transition-colors",
                        selectedConversationId === conversation.userId
                          ? "bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                          : "hover:bg-white/5"
                      )}
                      href={`/dashboard/inbox?conversation=${conversation.userId}`}
                    >
                      <div className="flex items-start gap-3 border-b border-white/10 px-3 py-3.5">
                        <div className="relative mt-0.5">
                          <SidebarAvatar className="h-11 w-11" name={conversation.name} src={conversation.profilePic} />
                          {!conversation.sentByMe ? (
                            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#111111] bg-[#ff5a76]" />
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[1.05rem] font-semibold leading-tight text-white">
                                {conversation.name}
                              </p>
                              <p className="mt-0.5 truncate text-sm leading-5 text-white/65">
                                {conversation.latestMessage ?? "No message yet"}
                              </p>
                            </div>

                            <time className="shrink-0 pt-0.5 text-xs text-white/45">
                              {formatLatestAt(conversation.latestAt)}
                            </time>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                    Your message feed will appear here once conversations start coming in.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
                Matches will appear here next. For now, your message feed is ready in the Messages tab.
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="border-t border-white/15 px-5 py-4">
        <button
          className="flex items-center gap-4 text-white transition-colors hover:text-white/80"
          disabled={signingOut}
          onClick={handleSignOut}
          type="button"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-[0.9rem] border-2 border-white text-white">
            <LogOut className="h-6 w-6 stroke-[2.1]" />
          </span>
          <span className="text-xl font-medium leading-none tracking-tight">
            {signingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>
    </div>
  );
}
