"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  sentByMe: boolean;
  timestamp: string;
  compact?: boolean;
  children: ReactNode;
}

export function MessageBubble({ sentByMe, timestamp, compact = false, children }: MessageBubbleProps) {
  return (
    <div className={cn("chat-fade-in flex w-full", sentByMe ? "justify-end" : "justify-start", compact ? "mt-1" : "mt-3.5")}>
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-3.5 shadow-sm transition duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md sm:max-w-[65%]",
          sentByMe
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border border-border bg-card text-card-foreground"
        )}
      >
        <p className="whitespace-pre-wrap text-[0.95rem] leading-6 sm:text-[1rem]">{children}</p>
        <p className={cn("mt-2 text-xs", sentByMe ? "text-primary-foreground/70" : "text-muted-foreground")}>{timestamp}</p>
      </div>
    </div>
  );
}
