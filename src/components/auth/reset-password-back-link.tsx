"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ResetPasswordBackLink() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [signingOut, setSigningOut] = useState(false);

  const handleBackToSignIn = async () => {
    setSigningOut(true);

    if (supabase) {
      await supabase.auth.signOut();
    }

    router.replace("/login");
    router.refresh();
  };

  return (
    <button
      className="font-semibold text-rose-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={signingOut}
      onClick={() => {
        void handleBackToSignIn();
      }}
      type="button"
    >
      {signingOut ? "Signing out..." : "Back to Sign In"}
    </button>
  );
}
