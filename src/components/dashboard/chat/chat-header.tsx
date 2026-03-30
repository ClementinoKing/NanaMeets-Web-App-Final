"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Ban, Flag, MoreHorizontal, X } from "lucide-react";

interface ChatHeaderProps {
  name: string;
  avatarUrl: string | null;
  online: boolean;
  typingLabel?: string | null;
  className?: string;
}

export function ChatHeader({ name, avatarUrl, online, typingLabel, className }: ChatHeaderProps) {
  const router = useRouter();
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!moreMenuRef.current) {
        return;
      }

      if (!moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreOptions(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowMoreOptions(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 border border-border/60 bg-card/75 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.18)]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
            {avatarUrl ? (
              <Image alt={name} className="object-cover" fill sizes="48px" src={avatarUrl} />
            ) : (
              <span className="text-xs font-semibold uppercase text-muted-foreground">{name.slice(0, 2)}</span>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-[1.05rem] font-semibold text-foreground sm:text-[1.15rem]">{name}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", online ? "bg-emerald-500" : "bg-muted-foreground/50")} />
              <span className="truncate text-xs text-muted-foreground">{online ? "Online" : "Offline"}</span>
              {typingLabel ? (
                <span className="ml-1 truncate text-xs text-muted-foreground/80">{typingLabel}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div ref={moreMenuRef} className="relative flex items-center gap-2">
          <Button
            aria-label="More options"
            className="h-10 w-10 rounded-full border border-border/70 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            size="icon"
            variant="ghost"
            type="button"
            onClick={() => setShowMoreOptions((value) => !value)}
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>

          {showMoreOptions ? (
            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[16rem] overflow-hidden rounded-[1.25rem] border border-border/70 bg-[#141414] shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
              <div className="border-b border-border/70 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">More Options</p>
              </div>

              <div className="p-2">
                <Button
                  className="flex h-12 w-full items-center justify-start gap-3 rounded-[0.9rem] px-4 text-left text-foreground hover:bg-white/5"
                  type="button"
                  variant="ghost"
                  onClick={() => setShowMoreOptions(false)}
                >
                  <Flag className="h-4 w-4" />
                  <span className="text-[0.95rem] font-medium">Report {name}</span>
                </Button>

                <Button
                  className="mt-1 flex h-12 w-full items-center justify-start gap-3 rounded-[0.9rem] px-4 text-left text-[#ff5f7d] hover:bg-[#ff5f7d]/10 hover:text-[#ff5f7d]"
                  type="button"
                  variant="ghost"
                  onClick={() => setShowMoreOptions(false)}
                >
                  <Ban className="h-4 w-4" />
                  <span className="text-[0.95rem] font-medium">Block {name}</span>
                </Button>

                <Button
                  className="mt-2 flex h-11 w-full items-center justify-center rounded-[0.9rem] border border-border/70 bg-white/5 text-[0.95rem] font-medium text-foreground hover:bg-white/10"
                  type="button"
                  variant="ghost"
                  onClick={() => setShowMoreOptions(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          <Button
            aria-label="Close conversation"
            className="h-10 w-10 rounded-full border border-border/70 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            size="icon"
            variant="ghost"
            type="button"
            onClick={() => router.replace("/dashboard")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
