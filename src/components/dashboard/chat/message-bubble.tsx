"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  sentByMe: boolean;
  compact?: boolean;
  pending?: boolean;
  groupPosition?: "single" | "first" | "middle" | "last";
  children: ReactNode;
}

export function MessageBubble({
  sentByMe,
  compact = false,
  pending = false,
  groupPosition = "single",
  children,
}: MessageBubbleProps) {
  const bubbleRadius = {
    single: "rounded-2xl",
    first: "rounded-t-2xl rounded-b-md",
    middle: "rounded-md",
    last: "rounded-b-2xl rounded-t-md",
  }[groupPosition];

  return (
    <div
      className={cn(
        "chat-fade-in flex w-full",
        sentByMe ? "justify-end" : "justify-start",
        compact ? "mt-1.5" : "mt-4",
        pending ? "opacity-70" : "",
      )}
    >
      <div
        className={cn(
          "max-w-[70%] px-4 py-3.5 shadow-sm transition duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md sm:max-w-[65%]",
          bubbleRadius,
          pending ? "animate-pulse" : "",
          sentByMe
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border border-border bg-card text-card-foreground"
        )}
      >
        <p className="whitespace-pre-wrap text-[0.95rem] leading-6 sm:text-[1rem]">{children}</p>
      </div>
    </div>
  );
}
