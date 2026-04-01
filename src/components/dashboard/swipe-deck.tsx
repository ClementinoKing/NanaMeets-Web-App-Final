"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import {
  ArrowRight,
  ArrowUp,
  Heart,
  MapPin,
  RotateCcw,
  MessageCircleMore,
  Zap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import heartYellowAnimation from "../../../public/json/Heart_yellow.json";

export interface SwipeProfile {
  userId: string;
  name: string;
  age: number | null;
  distanceKm: string | null;
  city: string | null;
  area: string | null;
  bio: string | null;
  profilePics: Array<string | null>;
}

interface SwipeDeckProps {
  profiles: SwipeProfile[];
  currentUserId: string;
  canDirectMessageUsers: boolean;
  onRequestSubscription: () => void;
}

function EmptyDeckState() {
  return (
    <div className="mx-auto flex min-h-[76vh] w-full max-w-[560px] flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-[#0c0c0c] px-8 py-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
      <div className="mt-4 flex h-44 w-44 items-center justify-center">
        <Lottie animationData={heartYellowAnimation} loop autoplay />
      </div>
      <h2 className="mt-1.5 text-[1.9rem] font-semibold tracking-tight text-[#ff4f6b]">All Caught Up!</h2>
      <p className="mt-2 max-w-md text-[1.05rem] leading-7 text-white/70">
        Check back later for new profiles, new matches are coming soon. Keep an eye out!
      </p>
      <button
        className="mt-9 inline-flex items-center justify-center rounded-full bg-[#ff4f6b] px-8 py-4 text-[1.05rem] font-semibold text-white shadow-[0_16px_36px_rgba(255,79,107,0.28)] transition hover:bg-[#ff6078]"
        type="button"
        onClick={() => window.location.reload()}
      >
        Try Again
      </button>
    </div>
  );
}

function ActionButton({
  children,
  className,
  onClick,
  href,
}: {
  children: ReactNode;
  className: string;
  onClick?: () => void;
  href?: string;
}) {
  const base =
    "relative z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#2c2f36] text-white shadow-[0_12px_24px_rgba(0,0,0,0.45)] transition-transform hover:scale-105";

  if (href) {
    return (
      <Link className={cn(base, className)} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cn(base, className)} onClick={onClick} type="button">
      {children}
    </button>
  );
}

const SWIPE_ANIMATION_MS = 180;

async function persistSwipeAction(
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
  currentUserId: string,
  swipedId: string,
  action: "like" | "dislike" | "boost",
) {
  if (!supabase) {
    return;
  }

  const isLiked = action === "like" || action === "boost";
  const boost = action === "boost";

  const { error } = await supabase.from("swipes").insert({
    swiper_id: currentUserId,
    swiped_id: swipedId,
    is_liked: isLiked,
    conversation: false,
    boost,
    direct_message: false,
  });

  if (error) {
    if (error.code === "P0001" || error.message?.includes("already swiped")) {
      return;
    }

    throw error;
  }
}

export function SwipeDeck({ profiles, currentUserId, canDirectMessageUsers, onRequestSubscription }: SwipeDeckProps) {
  const supabase = getSupabaseBrowserClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeOutDirection, setSwipeOutDirection] = useState<"left" | "right" | null>(null);
  const activePointerId = useRef<number | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const swipeTimeoutRef = useRef<number | null>(null);

  const currentProfile = profiles[currentIndex] ?? null;
  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 3);
  const images = currentProfile?.profilePics ?? [];
  const activeImage = images[currentImageIndex] ?? images[0] ?? null;
  const progressCount = 3;
  const swipeThreshold = 110;
  const swipeRotation = Math.max(-14, Math.min(14, dragOffset.x / 18));
  const dragProgress = Math.min(1, Math.abs(dragOffset.x) / swipeThreshold);
  const swipeLabel =
    dragOffset.x > 12 ? "Like" : dragOffset.x < -12 ? "Nope" : null;
  const cardTransform = swipeOutDirection
    ? `translate3d(${swipeOutDirection === "right" ? "140vw" : "-140vw"}, 0, 0) rotate(${
        swipeOutDirection === "right" ? 16 : -16
      }deg)`
    : `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${swipeRotation}deg)`;
  const cardTransition = isDragging || swipeOutDirection ? "none" : "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)";

  const advanceProfile = () => {
    if (!profiles.length) {
      return;
    }

    resetGesture();
    setCurrentIndex((value) => Math.min(value + 1, profiles.length));
    setCurrentImageIndex(0);
  };

  const previousProfile = () => {
    if (!profiles.length) {
      return;
    }

    resetGesture();
    setCurrentIndex((value) => Math.max(value - 1, 0));
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (!images.length) {
      advanceProfile();
      return;
    }

    setCurrentImageIndex((value) => {
      if (value + 1 >= 3) {
        return 0;
      }

      return value + 1;
    });
  };

  const resetGesture = () => {
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setSwipeOutDirection(null);
    activePointerId.current = null;
  };

  const finishSwipe = (direction: "left" | "right") => {
    setSwipeOutDirection(direction);

    if (swipeTimeoutRef.current) {
      window.clearTimeout(swipeTimeoutRef.current);
    }

    swipeTimeoutRef.current = window.setTimeout(() => {
      advanceProfile();
      swipeTimeoutRef.current = null;
    }, SWIPE_ANIMATION_MS);
  };

  const triggerSwipeAction = (action: "like" | "dislike" | "boost") => {
    if (!currentProfile || swipeOutDirection) {
      return;
    }

    if (action === "dislike") {
      void persistSwipeAction(supabase, currentUserId, currentProfile.userId, action).catch((error) => {
        console.error("Swipe action error:", error);
      });
      finishSwipe("left");
      return;
    }

    void persistSwipeAction(supabase, currentUserId, currentProfile.userId, action).catch((error) => {
      console.error("Swipe action error:", error);
    });
    finishSwipe("right");
  };

  const undoLastSwipe = async () => {
    if (!profiles.length) {
      return;
    }

    if (supabase) {
      const { data, error } = await supabase
        .from("swipes")
        .select("id")
        .eq("swiper_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Undo swipe lookup error:", error);
      } else if (data) {
        const { error: deleteError } = await supabase.from("swipes").delete().eq("id", data.id);
        if (deleteError) {
          console.error("Undo swipe delete error:", deleteError);
        }
      }
    }

    previousProfile();
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!currentProfile || swipeOutDirection) {
      return;
    }

    if ((event.target as HTMLElement | null)?.closest("button, a")) {
      return;
    }

    activePointerId.current = event.pointerId;
    dragStart.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || activePointerId.current !== event.pointerId || swipeOutDirection) {
      return;
    }

    setDragOffset({
      x: event.clientX - dragStart.current.x,
      y: event.clientY - dragStart.current.y,
    });
  };

  const endPointerGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) {
      return;
    }

    activePointerId.current = null;

    if (Math.abs(dragOffset.x) > swipeThreshold) {
      setIsDragging(false);
      triggerSwipeAction(dragOffset.x > 0 ? "like" : "dislike");
      return;
    }

    resetGesture();
  };

  useEffect(() => {
    if (swipeTimeoutRef.current) {
      window.clearTimeout(swipeTimeoutRef.current);
      swipeTimeoutRef.current = null;
    }
  }, [currentProfile?.userId]);

  useEffect(
    () => () => {
      if (swipeTimeoutRef.current) {
        window.clearTimeout(swipeTimeoutRef.current);
      }
    },
    []
  );

  if (!currentProfile) {
    return <EmptyDeckState />;
  }

  const location = [currentProfile.city, currentProfile.area].filter(Boolean).join(" · ");
  const distanceLabel = currentProfile.distanceKm
    ? `${currentProfile.distanceKm.replace(/\s+/g, "").toUpperCase()} away`
    : "";

  return (
    <div className="mx-auto flex min-h-[76vh] w-full max-w-[560px] flex-col items-center justify-center">
      <div
        className="relative w-full select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointerGesture}
        onPointerCancel={endPointerGesture}
        style={{ touchAction: "pan-y" }}
      >
        <div className="relative aspect-[0.67] w-full">
          {visibleProfiles.map((profile, index) => {
            const isTop = index === 0;
            const profileImages = profile.profilePics ?? [];
            const profileActiveImage = isTop ? activeImage : profileImages[0] ?? null;
            const stackScale = 1 - index * 0.04;
            const stackOffset = index * 14;
            const stackStyle: CSSProperties = isTop
              ? {
                  transform: cardTransform,
                  transition: cardTransition,
                }
              : {
                  transform: `translate3d(0, ${stackOffset}px, 0) scale(${stackScale})`,
                  transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                };

            return (
              <div
                key={profile.userId}
                aria-hidden={!isTop}
                className="absolute inset-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#090909] shadow-[0_20px_80px_rgba(0,0,0,0.65)]"
                style={{
                  ...stackStyle,
                  zIndex: 30 - index,
                  opacity: isTop ? 1 : 0.92 - index * 0.08,
                  pointerEvents: isTop ? "auto" : "none",
                }}
              >
                {isTop ? (
                  <div className="absolute inset-x-0 top-0 z-20 flex gap-1.5 px-3 pt-3">
                    {Array.from({ length: progressCount }).map((_, progressIndex) => (
                      <div
                        key={progressIndex}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          progressIndex === currentImageIndex ? "bg-[#ff5c74]" : "bg-white/25"
                        )}
                      />
                    ))}
                  </div>
                  ) : null}

                <div className="relative h-full w-full overflow-hidden">
                  {profileActiveImage ? (
                    <Image alt={profile.name} className="object-cover" fill priority={isTop} src={profileActiveImage} />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#3c4a5a] via-[#151515] to-[#0b0b0b]" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" />

                  {isTop ? (
                    <>
                      <div
                        className={cn(
                          "absolute left-5 top-5 z-20 rounded-full border-4 px-5 py-2 text-[1rem] font-black uppercase tracking-[0.28em] shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-transform duration-100",
                          dragOffset.x > 12
                            ? "border-[#39d98a] bg-[#39d98a]/20 text-[#39d98a] animate-pulse"
                            : "border-transparent bg-transparent text-transparent",
                        )}
                        style={{
                          opacity: dragOffset.x > 12 ? Math.min(1, 0.3 + dragProgress) : 0,
                          transform: dragOffset.x > 12
                            ? `translate3d(-${Math.min(10, dragProgress * 12)}px, ${Math.min(4, dragProgress * 4)}px, 0) scale(${1 + dragProgress * 0.8}) rotate(-8deg)`
                            : "scale(0.7)",
                        }}
                      >
                        LIKE
                      </div>
                      <div
                        className={cn(
                          "absolute right-5 top-5 z-20 rounded-full border-4 px-5 py-2 text-[1rem] font-black uppercase tracking-[0.28em] shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-transform duration-100",
                          dragOffset.x < -12
                            ? "border-[#ff5c74] bg-[#ff5c74]/20 text-[#ff5c74] animate-pulse"
                            : "border-transparent bg-transparent text-transparent",
                        )}
                        style={{
                          opacity: dragOffset.x < -12 ? Math.min(1, 0.3 + dragProgress) : 0,
                          transform: dragOffset.x < -12
                            ? `translate3d(${Math.min(10, dragProgress * 12)}px, ${Math.min(4, dragProgress * 4)}px, 0) scale(${1 + dragProgress * 0.8}) rotate(8deg)`
                            : "scale(0.7)",
                        }}
                      >
                        NOPE
                      </div>
                    </>
                  ) : null}

                  {isTop ? (
                    <>
                      <button
                        className="absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white text-slate-700 shadow-lg transition-transform hover:scale-105"
                        onClick={nextImage}
                        type="button"
                      >
                        <ArrowRight className="h-6 w-6" />
                      </button>

                      <button
                        className="absolute bottom-28 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white shadow-lg backdrop-blur transition-transform hover:scale-105"
                        onClick={() => setCurrentImageIndex(0)}
                        type="button"
                      >
                        <ArrowUp className="h-5 w-5" />
                      </button>
                    </>
                  ) : null}

                  <div className="absolute inset-x-0 bottom-0 z-10 p-5 pb-20">
                    <div className="flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-4xl font-semibold tracking-tight text-white">
                          {profile.name}
                          {profile.age ? ` ${profile.age}` : ""}
                        </h2>
                        <p className="mt-2 flex items-center gap-2 text-lg text-white/90">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">
                            {profile.distanceKm
                              ? `${profile.distanceKm.replace(/\s+/g, "").toUpperCase()} away`
                              : [profile.city, profile.area].filter(Boolean).join(" · ") || "Location not set"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-30 -mt-6 flex flex-wrap items-center justify-center gap-4">
        <ActionButton className="text-[#ffb547]" onClick={() => void undoLastSwipe()}>
          <RotateCcw className="h-7 w-7" />
        </ActionButton>
        <ActionButton className="text-[#ff5c74]" onClick={() => triggerSwipeAction("dislike")}>
          <X className="h-8 w-8" />
        </ActionButton>
        <ActionButton className="text-[#2f8cff]" onClick={() => triggerSwipeAction("boost")}>
          <Zap className="h-7 w-7" />
        </ActionButton>
        <ActionButton className="h-16 w-16 text-[#8fe04c]" onClick={() => triggerSwipeAction("like")}>
          <Heart className="h-8 w-8" />
        </ActionButton>
        {canDirectMessageUsers ? (
          <ActionButton className="text-[#4ea1ff]" href={`/dashboard/inbox?conversation=${currentProfile.userId}`}>
            <MessageCircleMore className="h-7 w-7" />
          </ActionButton>
        ) : (
          <ActionButton className="text-[#4ea1ff]" onClick={onRequestSubscription}>
            <MessageCircleMore className="h-7 w-7" />
          </ActionButton>
        )}
      </div>

    </div>
  );
}
