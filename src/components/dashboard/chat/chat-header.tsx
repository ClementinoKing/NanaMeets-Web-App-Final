"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoreHorizontal, X } from "lucide-react";

interface ChatHeaderProps {
  name: string;
  avatarUrl: string | null;
  online: boolean;
  typingLabel?: string | null;
  className?: string;
}

export function ChatHeader({ name, avatarUrl, online, typingLabel, className }: ChatHeaderProps) {
  const router = useRouter();

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

        <div className="flex items-center gap-2">
          <Button
            aria-label="More options"
            className="h-10 w-10 rounded-full border border-border/70 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            size="icon"
            variant="ghost"
            type="button"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
          <Button
            aria-label="Close conversation"
            className="h-10 w-10 rounded-full border border-border/70 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            size="icon"
            variant="ghost"
            type="button"
            onClick={() => router.back()}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
