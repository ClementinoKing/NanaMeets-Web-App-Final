"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUserSafely } from "@/lib/supabase/browser-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { sendMessage } from "@/lib/send-message";
import { messageSchema, type MessageValues } from "@/lib/validators/profile";

interface MessageComposerProps {
  defaultRecipientLookup?: string;
  mode?: "compose" | "reply";
  canDirectMessage?: boolean;
}

export function MessageComposer({ defaultRecipientLookup = "", mode = "compose", canDirectMessage }: MessageComposerProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [formError, setFormError] = useState<string | null>(null);
  const replyMode = mode === "reply";
  const form = useForm<MessageValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      recipientLookup: defaultRecipientLookup,
      message: "",
    },
  });
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
      const errorMessage = "A monthly subscription is required to send direct messages.";
      setFormError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    const user = await getCurrentUserSafely(supabase);

    if (!user) {
      const errorMessage = "You must be signed in to send a message.";
      setFormError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    try {
      await sendMessage({
        supabase,
        senderId: user.id,
        recipientLookup: values.recipientLookup || defaultRecipientLookup,
        message: values.message,
      });

      toast.success("Message sent");
      form.reset({
        recipientLookup: replyMode ? defaultRecipientLookup : "",
        message: "",
      });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send your message.";
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <form
      className={replyMode ? "space-y-0" : "grid gap-4"}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {!replyMode ? (
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Recipient email or user ID</span>
          <Input placeholder="name@example.com or user id" {...form.register("recipientLookup")} />
          {form.formState.errors.recipientLookup ? (
            <span className="text-sm text-[#c2410c]">{form.formState.errors.recipientLookup.message}</span>
          ) : null}
        </label>
      ) : (
        <input type="hidden" {...form.register("recipientLookup")} />
      )}

      {replyMode ? (
        <div className="flex items-center gap-3 rounded-full bg-white/[0.08] px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
          <Input
            className="h-auto border-0 bg-transparent px-0 py-0 text-[1rem] text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Type a message"
            {...form.register("message")}
          />
          <Button
            aria-label="Send message"
            className="h-12 w-12 shrink-0 rounded-full bg-primary p-0 text-primary-foreground hover:bg-primary/90"
            disabled={form.formState.isSubmitting}
            type="submit"
          >
            <span className="text-[1.65rem] leading-none">
              {form.formState.isSubmitting ? "..." : "➤"}
            </span>
          </Button>
        </div>
      ) : (
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Message</span>
          <Textarea placeholder="Say hello and introduce yourself." {...form.register("message")} />
        </label>
      )}

      {!replyMode ? (
        <Button className="w-fit" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? "Sending..." : "Send message"}
        </Button>
      ) : null}

      {formError ? <p className="text-sm text-[#c2410c]">{formError}</p> : null}
    </form>
  );
}
