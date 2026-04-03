"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { buildSubscriptionCheckoutPayload } from "@/lib/subscription-checkout";
import {
  SUBSCRIPTION_PLANS,
  formatMembershipLabel,
  type SubscriptionPlan,
  type SubscriptionPlanId,
  type SubscriptionRow,
} from "@/lib/subscriptions";
import { getPaymentCallbackUrl, getPaymentReturnUrl } from "@/lib/payment-urls";
import { requestPaymentCheckout } from "@/lib/payment-gateway";
import { SubscriptionPaymentModal } from "@/components/dashboard/subscription-payment-modal";

type SubscriptionPlansClientProps = {
  displayName: string;
  email: string;
  userId: string;
  plans: SubscriptionPlan[];
  activeSubscription: SubscriptionRow | null;
  currentPlanId?: SubscriptionPlanId | null;
  flashMessage?: string | null;
};

function PlanCard({
  plan,
  onSelect,
  loading,
  isCurrentPlan,
}: {
  plan: SubscriptionPlan;
  onSelect: () => void;
  loading: boolean;
  isCurrentPlan: boolean;
}) {
  return (
    <Card
      className={cn(
        "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,248,250,0.98))] shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]",
        isCurrentPlan
          ? "border-emerald-400/30 ring-1 ring-emerald-400/15"
          : plan.recommended
          ? "border-[#ff5a74]/30 ring-1 ring-[#ff5a74]/15"
          : "border-white/10"
      )}
    >
      <CardHeader className="relative pb-4">
        {isCurrentPlan ? (
          <div className="absolute -top-3 right-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white shadow-[0_12px_30px_rgba(16,185,129,0.35)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Current plan
          </div>
        ) : plan.recommended ? (
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
            <p className="mt-1 text-lg font-semibold">{plan.amount.toLocaleString("en-US")} {plan.currency}</p>
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
            isCurrentPlan
              ? "bg-emerald-500 text-white hover:bg-emerald-500"
              : plan.recommended
              ? "bg-[#ff5a74] text-white hover:bg-[#e84a66]"
              : "bg-slate-950 text-white hover:bg-slate-800"
          )}
          disabled={loading || isCurrentPlan}
          onClick={onSelect}
        >
          {loading ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : isCurrentPlan ? (
            <CheckCircle2 className="h-4.5 w-4.5" />
          ) : (
            <ArrowRight className="h-4.5 w-4.5" />
          )}
          {isCurrentPlan ? "Current plan" : "Continue to payment"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function SubscriptionPlansClient({
  displayName,
  email,
  userId,
  plans,
  activeSubscription,
  currentPlanId,
  flashMessage,
}: SubscriptionPlansClientProps) {
  const router = useRouter();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId | null>(null);
  const visiblePlans = plans.length > 0 ? plans : SUBSCRIPTION_PLANS;

  const membershipLabel = useMemo(() => formatMembershipLabel(activeSubscription), [activeSubscription]);
  const currentPlan = useMemo(
    () => visiblePlans.find((plan) => plan.id === currentPlanId) ?? null,
    [currentPlanId, visiblePlans],
  );

  const startCheckout = async (planId: string) => {
    try {
      setLoadingPlanId(planId);
      setError(null);

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
        callbackUrl: getPaymentCallbackUrl(window.location.origin),
        returnUrl: getPaymentReturnUrl(window.location.origin),
      });

      const { checkoutUrl } = await requestPaymentCheckout(payload, "Subscription checkout");

      setSelectedPlanId(plan.id);
      setCheckoutUrl(checkoutUrl);
    } catch (checkoutError) {
      const message = checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout";
      setError(message);
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(255,90,116,0.14),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2f6_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-7 text-white shadow-[0_30px_120px_-64px_rgba(15,23,42,0.9)] sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-white/70">
                <ShieldCheck className="h-3.5 w-3.5" />
                PayChangu subscriptions
              </div>
              <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                Choose the membership that fits your pace.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
                {displayName}
                {email ? ` · ${email}` : ""} can upgrade instantly, then PayChangu will bring you back
                after verification so the subscription row is written only once.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/52">
                Membership status
              </p>
              <p className="mt-2 max-w-xs text-lg font-medium leading-7 text-white">
                {membershipLabel}
              </p>
              {currentPlan ? (
                <p className="mt-2 text-sm leading-6 text-white/60">
                  You are on the {currentPlan.title} membership right now.
                </p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Monthly membership unlocks direct messages and premium access.
                </p>
              )}
            </div>
          </div>
          {flashMessage ? (
            <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-100">
              {flashMessage}
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm leading-6 text-rose-100">
              {error}
            </div>
          ) : null}
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {visiblePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              loading={loadingPlanId === plan.id}
              isCurrentPlan={currentPlanId === plan.id}
              onSelect={() => void startCheckout(plan.id)}
              plan={plan}
            />
          ))}
        </section>

        <SubscriptionPaymentModal
          checkoutUrl={checkoutUrl}
          open={Boolean(checkoutUrl)}
          onClose={() => {
            setCheckoutUrl(null);
            setSelectedPlanId(null);
          }}
          onCancel={() => {
            setCheckoutUrl(null);
            setSelectedPlanId(null);
          }}
          onSuccess={() => {
            setCheckoutUrl(null);
            const nextUrl = selectedPlanId
              ? `/dashboard/subscription?status=success&tier=${selectedPlanId}`
              : "/dashboard/subscription?status=success";
            setSelectedPlanId(null);
            router.replace(nextUrl);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
