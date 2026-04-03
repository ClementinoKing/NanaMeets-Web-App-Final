"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { clearSubscriptionCheckoutState, readSubscriptionCheckoutState } from "@/lib/subscription-checkout-state";

type SubscriptionCallbackSuccessProps = {
  tier?: string | null;
  userId?: string | null;
};

export function SubscriptionCallbackSuccess({ tier, userId }: SubscriptionCallbackSuccessProps) {
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    const savedState = readSubscriptionCheckoutState();
    const resolvedTier = tier ?? savedState?.tier ?? null;
    const resolvedUserId = userId ?? savedState?.userId ?? null;

    if (!resolvedTier || !resolvedUserId) {
      setLoadingState(false);
      setError("Could not restore your selected plan. Please try again.");
      return;
    }

    const syncSubscription = async () => {
      const response = await fetch("/api/subscription/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier: resolvedTier, userId: resolvedUserId }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string; status?: string; tier?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Could not activate subscription");
      }

      return data;
    };

    void syncSubscription()
      .then(() => {
        clearSubscriptionCheckoutState();
        window.parent?.postMessage(
          {
            type: "nanameets-payment-success",
            tier: resolvedTier,
            status: "success",
          },
          window.location.origin,
        );
      })
      .catch((syncError) => {
        const message = syncError instanceof Error ? syncError.message : "Could not sync the subscription";
        setError(message);
      })
      .finally(() => {
        setLoadingState(false);
      });
  }, [tier, userId]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,90,116,0.18),_transparent_30%),linear-gradient(180deg,#09090b_0%,#111827_100%)] px-4 py-10 text-white">
      <div className="w-full max-w-xl rounded-[1.75rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_120px_-64px_rgba(0,0,0,0.85)]">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/50">Payment verified</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Subscription activated</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          {error
            ? error
            : loadingState
            ? "Restoring your selected plan..."
            : "We are activating your subscription and closing the payment modal."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 text-white/60">
          <Loader2 className="h-4.5 w-4.5 animate-spin" />
          <span className="text-sm">Finalizing payment</span>
        </div>
      </div>
    </div>
  );
}
