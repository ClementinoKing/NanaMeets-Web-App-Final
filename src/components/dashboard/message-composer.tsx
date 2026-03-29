"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchProfilesForIdentityIds } from "@/lib/message-feed";
import { messageSchema, type MessageValues } from "@/lib/validators/profile";

interface MessageComposerProps {
  defaultRecipientLookup?: string;
  mode?: "compose" | "reply";
}

export function MessageComposer({ defaultRecipientLookup = "", mode = "compose" }: MessageComposerProps) {
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
      const errorMessage = "You must be signed in to send a message.";
      setFormError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    const lookup = (values.recipientLookup || defaultRecipientLookup).trim();

    if (!lookup) {
      const errorMessage = "Could not find that user. Try their email address or user ID.";
      setFormError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    const { data: emailRecipient, error: emailLookupError } = lookup.includes("@")
      ? await supabase.from("profile").select("id,user_id,f_name,email,profile_pic").eq("email", lookup).maybeSingle()
      : { data: null, error: null };

    if (emailLookupError) {
      setFormError(emailLookupError.message);
      toast.error(emailLookupError.message);
      return;
    }

    const recipient =
      emailRecipient ??
      (lookup.includes("@") ? null : (await fetchProfilesForIdentityIds(supabase, [lookup]))[0] ?? null);

    if (!recipient) {
      const errorMessage = "Could not find that user. Try their email address or user ID.";
      setFormError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: recipient.user_id ?? recipient.id,
      message: values.message,
      hangout: false,
      match: true,
      unmatch: false,
      blocked: false,
    });

    if (error) {
      setFormError(error.message);
      toast.error(error.message);
      return;
    }

    toast.success("Message sent");
    form.reset({
      recipientLookup: replyMode ? defaultRecipientLookup : "",
      message: "",
    });
    router.refresh();
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
            className="h-12 w-12 shrink-0 rounded-full bg-[#ff4b6f] p-0 text-white hover:bg-[#ff5f7f]"
            disabled={form.formState.isSubmitting}
            type="submit"
          >
            {form.formState.isSubmitting ? "..." : "➤"}
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
