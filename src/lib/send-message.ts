import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { fetchProfilesForIdentityIds } from "@/lib/message-feed";

type SendMessageParams = {
  supabase: SupabaseClient<Database>;
  senderId: string;
  recipientLookup: string;
  message: string;
};

export async function sendMessage({ supabase, senderId, recipientLookup, message }: SendMessageParams) {
  const lookup = recipientLookup.trim();

  if (!lookup) {
    throw new Error("Could not find that user. Try their email address or user ID.");
  }

  const { data: emailRecipient, error: emailLookupError } = lookup.includes("@")
    ? await supabase.from("profile").select("id,user_id,f_name,email,profile_pic").eq("email", lookup).maybeSingle()
    : { data: null, error: null };

  if (emailLookupError) {
    throw emailLookupError;
  }

  const recipient =
    emailRecipient ??
    (lookup.includes("@") ? null : (await fetchProfilesForIdentityIds(supabase, [lookup]))[0] ?? null);

  if (!recipient) {
    throw new Error("Could not find that user. Try their email address or user ID.");
  }

  const { error } = await supabase.from("messages").insert({
    sender_id: senderId,
    receiver_id: recipient.user_id ?? recipient.id,
    message,
    hangout: false,
    match: true,
    unmatch: false,
    blocked: false,
  });

  if (error) {
    throw error;
  }
}
