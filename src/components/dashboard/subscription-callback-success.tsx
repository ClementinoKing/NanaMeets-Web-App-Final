"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { getCurrentUserSafely } from "@/lib/supabase/browser-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getSubscriptionPlanById, saveVerifiedSubscription } from "@/lib/subscriptions";

type SubscriptionCallbackSuccessProps = {
  tier: string;
};

export function SubscriptionCallbackSuccess({ tier }: SubscriptionCallbackSuccessProps) {
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const plan = getSubscriptionPlanById(tier);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    if (!plan) {
      return;
    }

    const syncSubscription = async () => {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        throw new Error("Subscription sync unavailable");
      }

      const user = await getCurrentUserSafely(supabase);

      if (!user?.id) {
        throw new Error("Could not identify the signed-in user");
      }

      await saveVerifiedSubscription(supabase, {
        userId: user.id,
        plan,
        txRef: null,
        verifiedAt: new Date().toISOString(),
        paymentStatus: "successful",
        paymentReference: null,
        amount: plan.amount,
        currency: plan.currency,
        referral: null,
      });
    };

    void syncSubscription()
      .then(() => {
        window.parent?.postMessage(
          {
            type: "nanameets-payment-success",
            tier: plan.id,
            status: "success",
          },
          window.location.origin,
        );
      })
      .catch((syncError) => {
        const message = syncError instanceof Error ? syncError.message : "Could not sync the subscription";
        setError(message);

        window.parent?.postMessage(
          {
            type: "nanameets-payment-success",
            tier: plan.id,
            status: "success",
          },
          window.location.origin,
        );
      });
  }, [plan, tier]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,90,116,0.18),_transparent_30%),linear-gradient(180deg,#09090b_0%,#111827_100%)] px-4 py-10 text-white">
      <div className="w-full max-w-xl rounded-[1.75rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_120px_-64px_rgba(0,0,0,0.85)]">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/50">Payment verified</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Subscription activated</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          {error
            ? error
            : plan
              ? "We are syncing your subscription now and closing the payment modal."
              : "Missing subscription plan information."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 text-white/60">
          <Loader2 className="h-4.5 w-4.5 animate-spin" />
          <span className="text-sm">Finalizing payment</span>
        </div>
      </div>
    </div>
  );
}
