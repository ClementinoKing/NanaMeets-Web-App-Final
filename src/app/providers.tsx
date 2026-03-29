"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { PresenceSync } from "@/components/auth/presence-sync";

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PresenceSync />
      {children}
      <Toaster richColors theme="dark" position="top-right" />
    </QueryClientProvider>
  );
}
