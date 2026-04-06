"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Lottie from "lottie-react";
import { AlertTriangle, Sparkles, Search } from "lucide-react";
import likesEmptyAnimation from "../../../../public/json/Wink.json";
import { Input } from "@/components/ui/input";
import type { LikedProfileRow } from "@/lib/likes";

interface LikesPageClientProps {
  likedProfiles: LikedProfileRow[];
  errorMessage?: string | null;
}

export function LikesPageClient({ likedProfiles, errorMessage }: LikesPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLikedProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return likedProfiles;
    }

    return likedProfiles.filter((profile) => {
      const haystack = [profile.f_name ?? "", String(profile.age ?? ""), profile.swiper_id].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [likedProfiles, searchQuery]);

  return (
    <section className="min-h-full rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#090909] via-[#060606] to-[#030303] px-4 py-5 text-white shadow-[0_24px_90px_rgba(0,0,0,0.35)] md:px-6 md:py-6">
      <div className="max-w-6xl">
        <header className="px-1 pb-5 pt-1 md:px-0">
          <h1 className="font-heading text-[2.3rem] font-semibold tracking-tight text-white md:text-[2.65rem]">
            Likes{" "}
            <span className="text-[#ff5f7d]">{likedProfiles.length}</span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-[0.98rem] leading-6 text-white/62">
            Here are the people who liked you. Make your move! 💖
          </p>

          <div className="mt-4">
            <label className="flex h-12 items-center gap-2.5 rounded-[0.95rem] border border-white/[0.12] bg-white/[0.06] px-3.5 text-white/[0.8] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <Search className="h-4.5 w-4.5 shrink-0 text-white/45" />
              <Input
                className="h-full border-0 bg-transparent px-0 text-[0.95rem] text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search likes..."
                value={searchQuery}
              />
            </label>
          </div>
        </header>
      </div>

      {errorMessage ? (
        <div className="flex min-h-[52vh] flex-col items-center justify-center px-6 py-10 text-center">
          <AlertTriangle className="h-10 w-10 text-[#ff5f7d]" />
          <p className="mt-3 text-[1.05rem] font-semibold text-white">Could not load likes</p>
          <p className="mt-1 max-w-sm text-sm leading-6 text-white/60">{errorMessage}</p>
        </div>
      ) : !likedProfiles.length ? (
        <div className="flex min-h-[52vh] flex-col items-center justify-center px-6 py-10 text-center">
          <div className="w-[140px]">
            <Lottie animationData={likesEmptyAnimation} autoplay loop={false} />
          </div>
          <p className="mt-2 text-[1.05rem] font-semibold text-white">No likes yet. Keep swiping.</p>
          <p className="mt-1 max-w-sm text-sm leading-6 text-white/60">
            When people like you, they&apos;ll appear here so you can decide whether to start a conversation.
          </p>
        </div>
      ) : filteredLikedProfiles.length ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {filteredLikedProfiles.map((profile) => {
            const name = profile.f_name ?? "Unknown";
            const profilePic = profile.profile_pic ?? null;
            const age = profile.age ? `, ${profile.age}` : "";
            const isBoosted = Boolean(profile.boost);

            return (
              <Link
                key={profile.swiper_id}
                className="group relative aspect-[3/4] overflow-hidden rounded-[1.1rem] border border-white/10 bg-[#141414] shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-white/20"
                href={`/dashboard/inbox?conversation=${profile.swiper_id}`}
              >
                {profilePic ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-[1.02]"
                    style={{ backgroundImage: `url(${profilePic})` }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#111] to-[#090909]" />
                )}

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.12)_50%,rgba(0,0,0,0.88)_100%)]" />

                {isBoosted ? (
                  <span className="absolute left-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#ffd86a] to-[#ff9f1a] shadow-[0_8px_18px_rgba(0,0,0,0.3)]">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </span>
                ) : null}

                {isBoosted ? (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[#ffd86a] to-[#ff9f1a] px-2.5 py-1 text-[0.7rem] font-semibold text-white shadow-[0_8px_18px_rgba(0,0,0,0.3)]">
                    <Sparkles className="h-3 w-3" />
                    Boost
                  </span>
                ) : null}

                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="truncate font-heading text-[1.2rem] font-semibold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
                    {name}
                    {age}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[52vh] items-center justify-center px-6 text-center">
          <p className="text-sm text-white/60">
            No profiles found matching &quot;{searchQuery}&quot;.
          </p>
        </div>
      )}
    </section>
  );
}
