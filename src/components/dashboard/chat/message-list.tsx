"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import Lottie from "lottie-react";
import { formatUtcDateTime } from "@/lib/date-format";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/database";
import { MessageBubble } from "./message-bubble";
import emptyMessagesAnimation from "../../../../public/json/Messages_Empty.json";

type ChatMessage = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "sender_id" | "receiver_id" | "message" | "created_at"
>;

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  typingLabel?: string | null;
}

function subscribeToMessages(supabase: SupabaseClient<Database>, onChange: () => void) {
  const channel = supabase
    .channel("chat-messages-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
      onChange();
    })
    .subscribe();

  return channel;
}

export function MessageList({ messages, currentUserId, typingLabel }: MessageListProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const orderedMessages = [...messages].reverse();
  const latestMessageId = orderedMessages.at(-1)?.id ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [latestMessageId, orderedMessages.length, typingLabel]);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    const channel = subscribeToMessages(supabase, () => {
      router.refresh();
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex min-h-full flex-1 flex-col">
        {orderedMessages.length ? (
          orderedMessages.map((message, index) => {
            const sentByMe = message.sender_id === currentUserId;
            const previousMessage = orderedMessages[index - 1];
            const compact = Boolean(previousMessage && previousMessage.sender_id === message.sender_id);

            return (
              <MessageBubble key={message.id} compact={compact} sentByMe={sentByMe} timestamp={formatUtcDateTime(message.created_at)}>
                {message.message ?? "No message text yet."}
              </MessageBubble>
            );
          })
        ) : (
          <div className="flex h-full items-center justify-center px-6 py-12">
            <div className="flex max-w-md flex-col items-center text-center">
              <div className="flex h-56 w-56 items-center justify-center">
                <Lottie animationData={emptyMessagesAnimation} autoplay loop={false} />
              </div>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white">Break the Ice</h2>
              <p className="mt-2 text-base leading-7 text-white/70">Start a conversation with Ismailar</p>
            </div>
          </div>
        )}

        {typingLabel ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="chat-typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
            <span className="chat-typing-dot h-2 w-2 rounded-full bg-muted-foreground [animation-delay:140ms]" />
            <span className="chat-typing-dot h-2 w-2 rounded-full bg-muted-foreground [animation-delay:280ms]" />
            <span>{typingLabel}</span>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
