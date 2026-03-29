"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Paperclip, Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { messageSchema, type MessageValues } from "@/lib/validators/profile";
import { sendMessage } from "@/lib/send-message";

interface ChatInputProps {
  recipientLookup: string;
  placeholder?: string;
}

export function ChatInput({ recipientLookup, placeholder = "Type a message..." }: ChatInputProps) {
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

  if (!supabase) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Set the Supabase environment variables to send messages.
      </div>
    );
  }

  const onSubmit = async (values: MessageValues) => {
    setFormError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const message = "You must be signed in to send a message.";
      setFormError(message);
      toast.error(message);
      return;
    }

    try {
      await sendMessage({
        supabase,
        senderId: user.id,
        recipientLookup: values.recipientLookup || recipientLookup,
        message: values.message,
      });

      toast.success("Message sent");
      form.reset({
        recipientLookup,
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
    <form className="flex items-end gap-2.5" onSubmit={form.handleSubmit(onSubmit)}>
      <input type="hidden" {...form.register("recipientLookup")} />

      <div className="flex flex-1 items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-2.5 py-2 shadow-[0_16px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <Button
          aria-label="Add emoji"
          className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Smile className="h-4 w-4" />
        </Button>
        <Button
          aria-label="Attach file"
          className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          className="h-11 flex-1 border-0 bg-transparent px-2 text-[0.98rem] text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder={placeholder}
          {...form.register("message")}
        />
      </div>

      <Button
        aria-label="Send message"
        className="h-14 w-14 shrink-0 rounded-full bg-primary p-0 text-primary-foreground shadow-[0_18px_40px_rgba(0,0,0,0.18)] hover:bg-primary/90"
        disabled={form.formState.isSubmitting}
        type="submit"
      >
        <Send className="h-6 w-6" />
      </Button>

      {formError ? <p className="sr-only">{formError}</p> : null}
    </form>
  );
}
