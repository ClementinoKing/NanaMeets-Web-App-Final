"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import Lottie from "lottie-react";
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
  conversationKey: string;
  typingLabel?: string | null;
}

type PendingMessage = ChatMessage & {
  tempId: string;
  pending: boolean;
};

type RenderItem =
  | {
      type: "separator";
      id: string;
      label: string;
    }
  | {
      type: "message";
      id: string;
      message: ChatMessage;
      pending: boolean;
      groupPosition: "single" | "first" | "middle" | "last";
      compactTopSpacing: boolean;
    };

type OptimisticMessageEventDetail = {
  conversationKey: string;
  tempId: string;
  message: ChatMessage;
};

const OPTIMISTIC_MESSAGE_EVENT = "nanameets-chat-optimistic-message";
const REMOVE_OPTIMISTIC_MESSAGE_EVENT = "nanameets-chat-remove-optimistic-message";
const GROUP_WINDOW_MINUTES = 8;
const SEPARATOR_GAP_MINUTES = 45;

function getMessageDate(value: string) {
  return new Date(value);
}

function isSameCalendarDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function formatMessageSeparatorLabel(value: string) {
  const date = getMessageDate(value);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  if (isSameCalendarDay(date, now)) {
    return `Today · ${timePart}`;
  }

  if (isSameCalendarDay(date, yesterday)) {
    return `Yesterday · ${timePart}`;
  }

  const dayPart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);

  return `${dayPart} · ${timePart}`;
}

function isWithinGroupWindow(left: ChatMessage, right: ChatMessage) {
  const leftDate = getMessageDate(left.created_at);
  const rightDate = getMessageDate(right.created_at);
  return Math.abs(rightDate.getTime() - leftDate.getTime()) <= GROUP_WINDOW_MINUTES * 60 * 1000;
}

function shouldInsertSeparator(previous: ChatMessage, current: ChatMessage) {
  const previousDate = getMessageDate(previous.created_at);
  const currentDate = getMessageDate(current.created_at);

  if (!isSameCalendarDay(previousDate, currentDate)) {
    return true;
  }

  return Math.abs(currentDate.getTime() - previousDate.getTime()) >= SEPARATOR_GAP_MINUTES * 60 * 1000;
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

export function MessageList({ messages, currentUserId, conversationKey, typingLabel }: MessageListProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);

  const reconciledPendingMessages = useMemo(() => {
    return pendingMessages.filter((pendingMessage) => {
      return !messages.some((message) => {
        return (
          message.sender_id === pendingMessage.sender_id &&
          message.receiver_id === pendingMessage.receiver_id &&
          message.message === pendingMessage.message &&
          Math.abs(new Date(message.created_at).getTime() - new Date(pendingMessage.created_at).getTime()) < 2 * 60 * 1000
        );
      });
    });
  }, [messages, pendingMessages]);

  useEffect(() => {
    setPendingMessages((current) =>
      current.filter((pendingMessage) => {
        return !messages.some((message) => {
          return (
            message.sender_id === pendingMessage.sender_id &&
            message.receiver_id === pendingMessage.receiver_id &&
            message.message === pendingMessage.message &&
            Math.abs(new Date(message.created_at).getTime() - new Date(pendingMessage.created_at).getTime()) < 2 * 60 * 1000
          );
        });
      }),
    );
  }, [messages]);

  const orderedMessages = [...messages, ...reconciledPendingMessages].sort(
    (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
  );

  const renderItems = useMemo<RenderItem[]>(() => {
    const items: RenderItem[] = [];

    orderedMessages.forEach((message, index) => {
      const previousMessage = orderedMessages[index - 1] ?? null;
      const nextMessage = orderedMessages[index + 1] ?? null;
      const sentByMe = message.sender_id === currentUserId;
      const pending = "pending" in message ? Boolean((message as PendingMessage).pending) : false;

      if (previousMessage && shouldInsertSeparator(previousMessage, message)) {
        items.push({
          type: "separator",
          id: `separator-${previousMessage.id}-${message.id}`,
          label: formatMessageSeparatorLabel(message.created_at),
        });
      }

      const withinPreviousGroup =
        previousMessage !== null &&
        previousMessage.sender_id === message.sender_id &&
        isWithinGroupWindow(previousMessage, message);
      const withinNextGroup =
        nextMessage !== null && nextMessage.sender_id === message.sender_id && isWithinGroupWindow(message, nextMessage);

      let groupPosition: "single" | "first" | "middle" | "last" = "single";

      if (withinPreviousGroup && withinNextGroup) {
        groupPosition = "middle";
      } else if (withinPreviousGroup) {
        groupPosition = "last";
      } else if (withinNextGroup) {
        groupPosition = "first";
      }

      items.push({
        type: "message",
        id: pending ? `${message.id}-pending` : String(message.id),
        message,
        pending,
        groupPosition,
        compactTopSpacing: withinPreviousGroup,
      });
    });

    return items;
  }, [currentUserId, orderedMessages]);

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

  useEffect(() => {
    setPendingMessages([]);
  }, [conversationKey]);

  useEffect(() => {
    const handleOptimisticMessage = (event: Event) => {
      const customEvent = event as CustomEvent<OptimisticMessageEventDetail>;

      if (customEvent.detail.conversationKey !== conversationKey) {
        return;
      }

      setPendingMessages((current) => {
        const nextPending = current.filter((item) => item.tempId !== customEvent.detail.tempId);
        return [
          ...nextPending,
          {
            ...customEvent.detail.message,
            tempId: customEvent.detail.tempId,
            pending: true,
          },
        ];
      });
    };

    window.addEventListener(OPTIMISTIC_MESSAGE_EVENT, handleOptimisticMessage as EventListener);

    return () => {
      window.removeEventListener(OPTIMISTIC_MESSAGE_EVENT, handleOptimisticMessage as EventListener);
    };
  }, [conversationKey]);

  useEffect(() => {
    const handleRemoveOptimisticMessage = (event: Event) => {
      const customEvent = event as CustomEvent<{ conversationKey: string; tempId: string }>;

      if (customEvent.detail.conversationKey !== conversationKey) {
        return;
      }

      setPendingMessages((current) => current.filter((item) => item.tempId !== customEvent.detail.tempId));
    };

    window.addEventListener(REMOVE_OPTIMISTIC_MESSAGE_EVENT, handleRemoveOptimisticMessage as EventListener);

    return () => {
      window.removeEventListener(REMOVE_OPTIMISTIC_MESSAGE_EVENT, handleRemoveOptimisticMessage as EventListener);
    };
  }, [conversationKey]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-10 pt-4 sm:px-5 sm:pb-12 sm:pt-5">
      <div className="flex min-h-full flex-1 flex-col">
        {renderItems.length ? (
          renderItems.map((item) => {
            if (item.type === "separator") {
              return (
                <div key={item.id} className="my-4 flex justify-center">
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.72rem] font-medium tracking-[0.08em] text-muted-foreground shadow-sm">
                    {item.label}
                  </div>
                </div>
              );
            }

            return (
              <MessageBubble
                key={item.id}
                compact={item.compactTopSpacing}
                groupPosition={item.groupPosition}
                pending={item.pending}
                sentByMe={item.message.sender_id === currentUserId}
              >
                {item.message.message ?? "No message text yet."}
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

        <div className="h-4 shrink-0 sm:h-6" ref={bottomRef} />
      </div>
    </div>
  );
}
