"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type SubscriptionCallbackSuccessProps = {
  tier: string;
};

export function SubscriptionCallbackSuccess({ tier }: SubscriptionCallbackSuccessProps) {
  const router = useRouter();

  useEffect(() => {
    const message = {
      type: "nanameets-payment-success",
      tier,
      status: "success",
    };

    try {
      window.parent?.postMessage(message, window.location.origin);
    } catch {
      // Ignore cross-window postMessage errors and fall back to local navigation below.
    }

    const timeoutId = window.setTimeout(() => {
      router.replace(`/dashboard/subscription?status=success&tier=${encodeURIComponent(tier)}`);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [router, tier]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,90,116,0.18),_transparent_30%),linear-gradient(180deg,#09090b_0%,#111827_100%)] px-4 py-10 text-white">
      <div className="w-full max-w-xl rounded-[1.75rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_120px_-64px_rgba(0,0,0,0.85)]">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/50">Payment verified</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Subscription activated</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          We verified the PayChangu transaction and are sending you back to the dashboard.
        </p>
      </div>
    </div>
  );
}
