"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { buildSubscriptionCheckoutPayload } from "@/lib/subscription-checkout";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/lib/subscriptions";
import { saveSubscriptionCheckoutState } from "@/lib/subscription-checkout-state";
import { getPaymentCallbackUrl, getPaymentReturnUrl } from "@/lib/payment-urls";
import { requestPaymentCheckout } from "@/lib/payment-gateway";
import { SubscriptionPaymentModal } from "@/components/dashboard/subscription-payment-modal";

interface SubscriptionPromptModalProps {
  open: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
  userId: string;
  email?: string;
  displayName?: string;
}

function SubscriptionPlanCard({
  plan,
  loading,
  onSelect,
}: {
  plan: SubscriptionPlan;
  loading: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      className={cn(
        "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,248,250,0.98))] shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]",
        plan.recommended ? "border-[#ff5a74]/30 ring-1 ring-[#ff5a74]/15" : "border-white/10",
      )}
    >
      <CardHeader className="relative pb-4">
        {plan.recommended ? (
          <div className="absolute -top-3 right-6 inline-flex items-center gap-1.5 rounded-full bg-[#ff5a74] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white shadow-[0_12px_30px_rgba(255,90,116,0.35)]">
            <Sparkles className="h-3.5 w-3.5" />
            Most Popular
          </div>
        ) : null}
        <CardDescription className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
          {plan.title}
        </CardDescription>
        <CardTitle className="text-3xl tracking-tight text-slate-950">{plan.newPrice}</CardTitle>
        <p className="text-sm leading-6 text-slate-500 line-through">{plan.oldPrice}</p>
        <p className="text-sm leading-6 text-slate-600">{plan.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-white">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/60">
              Discounted price
            </p>
            <p className="mt-1 text-lg font-semibold">
              {plan.amount.toLocaleString("en-US")} {plan.currency}
            </p>
          </div>
          <p className="text-sm text-white/72">Original {plan.oldPrice}</p>
        </div>
        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#ff5a74]" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className={cn(
            "h-12 w-full rounded-full text-sm font-semibold",
            plan.recommended ? "bg-[#ff5a74] text-white hover:bg-[#e84a66]" : "bg-slate-950 text-white hover:bg-slate-800",
          )}
          disabled={loading}
          onClick={onSelect}
        >
          {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <ArrowRight className="h-4.5 w-4.5" />}
          Continue to payment
        </Button>
      </CardFooter>
    </Card>
  );
}

export function SubscriptionPromptModal({
  open,
  onClose,
  plans = [],
  userId,
  email = "",
  displayName = "",
}: SubscriptionPromptModalProps) {
  const router = useRouter();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const visiblePlans = plans.length > 0 ? plans : SUBSCRIPTION_PLANS;

  const startCheckout = async (planId: string) => {
    try {
      setLoadingPlanId(planId);

      const plan = visiblePlans.find((item) => item.id === planId);

      if (!plan) {
        throw new Error("Invalid subscription plan");
      }

      if (typeof window === "undefined") {
        throw new Error("Subscription checkout must run in the browser");
      }

      const payload = buildSubscriptionCheckoutPayload({
        plan,
        userId,
        firstName: displayName || email || "User",
        email,
        callbackUrl: getPaymentCallbackUrl(plan.id, userId, window.location.origin),
        returnUrl: getPaymentReturnUrl(plan.id, userId, window.location.origin),
      });

      saveSubscriptionCheckoutState({ tier: plan.id, userId });

      const { checkoutUrl } = await requestPaymentCheckout(payload, "Subscription checkout");

      onClose();
      setCheckoutUrl(checkoutUrl);
    } finally {
      setLoadingPlanId(null);
    }
  };

  if (!open && !checkoutUrl) {
    return null;
  }

  return (
    <>
      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md"
          role="dialog"
          onClick={onClose}
        >
          <Card
            className="relative w-full max-w-6xl overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(23,23,23,0.98))] p-6 text-white shadow-[0_32px_120px_rgba(0,0,0,0.65)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label="Close subscription modal"
              className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mt-2 grid gap-4 xl:grid-cols-3">
              {visiblePlans.map((plan) => (
                <SubscriptionPlanCard
                  key={plan.id}
                  loading={loadingPlanId === plan.id}
                  onSelect={() => void startCheckout(plan.id)}
                  plan={plan}
                />
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      <SubscriptionPaymentModal
        checkoutUrl={checkoutUrl}
        onClose={() => setCheckoutUrl(null)}
        onSuccess={() => {
          toast.success("Payment successful");
          setCheckoutUrl(null);
          router.refresh();
        }}
        onCancel={() => setCheckoutUrl(null)}
        open={Boolean(checkoutUrl)}
      />
    </>
  );
}
