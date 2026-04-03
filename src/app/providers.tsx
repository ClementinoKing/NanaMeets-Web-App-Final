"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { PresenceSync } from "@/components/auth/presence-sync";

const ENABLE_PRESENCE_SYNC = process.env.NEXT_PUBLIC_ENABLE_PRESENCE_SYNC === "true";

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {ENABLE_PRESENCE_SYNC ? <PresenceSync /> : null}
      {children}
      <Toaster richColors theme="dark" position="top-right" />
    </QueryClientProvider>
  );
}
