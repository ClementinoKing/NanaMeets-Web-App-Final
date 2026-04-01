"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserSafely } from "@/lib/supabase/browser-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { messageSchema, type MessageValues } from "@/lib/validators/profile";
import { sendMessage } from "@/lib/send-message";
import { EmojiPicker } from "@/components/dashboard/chat/emoji-picker";

interface ChatInputProps {
  recipientLookup: string;
  conversationKey: string;
  placeholder?: string;
  canDirectMessage?: boolean;
}

type OptimisticMessageEventDetail = {
  conversationKey: string;
  tempId: string;
  message: {
    id: string;
    sender_id: string;
    receiver_id: string;
    message: string | null;
    created_at: string;
  };
};

const OPTIMISTIC_MESSAGE_EVENT = "nanameets-chat-optimistic-message";
const REMOVE_OPTIMISTIC_MESSAGE_EVENT = "nanameets-chat-remove-optimistic-message";

export function ChatInput({ recipientLookup, conversationKey, placeholder = "Type a message...", canDirectMessage }: ChatInputProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<MessageValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      recipientLookup,
      message: "",
    },
  });
  const messageValue = form.watch("message");
  const monthlyMessagingAllowed = canDirectMessage ?? true;

  if (!supabase) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Set the Supabase environment variables to send messages.
      </div>
    );
  }

  const onSubmit = async (values: MessageValues) => {
    setFormError(null);

    if (!monthlyMessagingAllowed) {
      const message = "A monthly subscription is required to send direct messages.";
      setFormError(message);
      toast.error(message);
      return;
    }

    const user = await getCurrentUserSafely(supabase);
    const tempId = `temp-${crypto.randomUUID()}`;

    if (!user) {
      const message = "You must be signed in to send a message.";
      setFormError(message);
      toast.error(message);
      return;
    }

    try {
      const optimisticMessage = {
        id: tempId,
        sender_id: user.id,
        receiver_id: conversationKey,
        message: values.message,
        created_at: new Date().toISOString(),
      };

      window.dispatchEvent(
        new CustomEvent<OptimisticMessageEventDetail>(OPTIMISTIC_MESSAGE_EVENT, {
          detail: {
            conversationKey,
            tempId,
            message: optimisticMessage,
          },
        }),
      );

      await sendMessage({
        supabase,
        senderId: user.id,
        recipientLookup: values.recipientLookup || recipientLookup,
        message: values.message,
      });

      form.reset({
        recipientLookup,
        message: "",
      });
      router.refresh();
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent(REMOVE_OPTIMISTIC_MESSAGE_EVENT, {
          detail: {
            conversationKey,
            tempId,
          },
        }),
      );

      const message = error instanceof Error ? error.message : "Could not send your message.";
      setFormError(message);
      toast.error(message);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const currentMessage = form.getValues("message") || "";
    form.setValue("message", `${currentMessage}${emoji}`, { shouldDirty: true, shouldTouch: true });
  };

  return (
    <form className="flex items-end gap-2.5" onSubmit={form.handleSubmit(onSubmit)}>
      <input type="hidden" {...form.register("recipientLookup")} />

      <div className="flex flex-1 items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-2.5 py-2 shadow-[0_16px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <EmojiPicker onSelect={handleEmojiSelect} />
        <Input
          className="h-11 flex-1 border-0 bg-transparent px-2 text-[0.98rem] text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder={placeholder}
          {...form.register("message")}
        />
      </div>

      <Button
        aria-label="Send message"
        className="h-14 w-14 shrink-0 rounded-full bg-primary p-0 text-primary-foreground shadow-[0_18px_40px_rgba(0,0,0,0.18)] hover:bg-primary/90"
        disabled={form.formState.isSubmitting || !messageValue?.trim()}
        type="submit"
      >
        <Send className="h-6 w-6" />
      </Button>

      {formError ? <p className="sr-only">{formError}</p> : null}
    </form>
  );
}
