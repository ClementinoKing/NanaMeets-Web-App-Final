"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [signingOut, setSigningOut] = useState(false);

  if (!supabase) {
    return (
      <Button disabled variant="outline">
        Sign out
      </Button>
    );
  }

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
    setSigningOut(false);
  };

  return (
    <Button className="min-w-28" onClick={handleSignOut} disabled={signingOut} variant="outline">
      {signingOut ? "Signing out..." : "Sign out"}
    </Button>
  );
}
