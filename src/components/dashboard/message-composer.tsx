"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchProfilesForIdentityIds } from "@/lib/message-feed";
import { messageSchema, type MessageValues } from "@/lib/validators/profile";

interface MessageComposerProps {
  defaultRecipientLookup?: string;
}

export function MessageComposer({ defaultRecipientLookup = "" }: MessageComposerProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
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
    setSaved(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFormError("You must be signed in to send a message.");
      return;
    }

    const lookup = values.recipientLookup.trim();
    const { data: emailRecipient, error: emailLookupError } = lookup.includes("@")
      ? await supabase
          .from("profile")
          .select("id,user_id,f_name,email,profile_pic")
          .eq("email", lookup)
          .maybeSingle()
      : { data: null, error: null };

    if (emailLookupError) {
      setFormError(emailLookupError.message);
      return;
    }

    const recipient =
      emailRecipient ??
      (lookup.includes("@")
        ? null
        : (await fetchProfilesForIdentityIds(supabase, [lookup]))[0] ?? null);

    if (!recipient) {
      setFormError("Could not find that user. Try their email address or user ID.");
      return;
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: recipient.user_id ?? recipient.id,
      message: values.message,
      match: true,
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    setSaved(true);
    form.reset({
      recipientLookup: "",
      message: "",
    });
    router.refresh();
  };

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      {saved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Message sent.
        </div>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Recipient email or user ID</span>
        <Input placeholder="name@example.com or user id" {...form.register("recipientLookup")} />
        {form.formState.errors.recipientLookup ? (
          <span className="text-sm text-[#c2410c]">{form.formState.errors.recipientLookup.message}</span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Message</span>
        <Textarea placeholder="Say hello and introduce yourself." {...form.register("message")} />
        {form.formState.errors.message ? (
          <span className="text-sm text-[#c2410c]">{form.formState.errors.message.message}</span>
        ) : null}
      </label>

      {formError ? <p className="text-sm text-[#c2410c]">{formError}</p> : null}

      <Button className="w-fit" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
