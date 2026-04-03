import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionCallbackSuccess } from "@/components/dashboard/subscription-callback-success";
import { loadCurrentProfile } from "@/lib/current-profile";
import { getSubscriptionPlanById, saveVerifiedSubscription } from "@/lib/subscriptions";
import { getServerAuthSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type QueryValue = string | string[] | undefined;

function readQueryValue(value: QueryValue) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function SubscriptionCallbackPage({
  searchParams,
}: Readonly<{
  searchParams?: Record<string, QueryValue>;
}>) {
  const tierId = readQueryValue(searchParams?.tier ?? searchParams?.plan_id ?? searchParams?.planId);

  const { supabase, user } = await getServerAuthSession();

  if (!supabase || !user) {
    redirect("/login");
  }

  const { profile } = await loadCurrentProfile(supabase, {
    email: user.email ?? null,
    userId: user.id,
  });

  if (!profile) {
    redirect("/create-profile");
  }

  const plan = getSubscriptionPlanById(tierId);
  if (!plan) {
    return (
      <ResultCard
        title="Missing plan information"
        description="PayChangu returned without a plan tier, so the subscription could not be activated."
        icon={<ShieldAlert className="h-6 w-6 text-rose-500" />}
        ctaLabel="Back to subscriptions"
        ctaHref="/dashboard/subscription"
      />
    );
  }

  try {
    await saveVerifiedSubscription(supabase, {
      userId: user.id,
      plan,
      txRef: null,
      verifiedAt: new Date().toISOString(),
      paymentStatus: "successful",
      paymentReference: null,
      amount: plan.amount,
      currency: plan.currency,
      referral: profile.referral ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the verified subscription";
    return (
      <ResultCard
        title="Could not save subscription"
        description={message}
        icon={<ShieldAlert className="h-6 w-6 text-rose-500" />}
        ctaLabel="Retry subscription"
        ctaHref="/dashboard/subscription"
      />
    );
  }

  return <SubscriptionCallbackSuccess tier={plan.id} />;
}

function ResultCard({
  title,
  description,
  icon,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,90,116,0.18),_transparent_30%),linear-gradient(180deg,#09090b_0%,#111827_100%)] px-4 py-10 text-white">
      <Card className="w-full max-w-xl border-white/10 bg-white/5 text-white shadow-[0_30px_120px_-64px_rgba(0,0,0,0.85)]">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            {icon}
          </div>
          <CardTitle className="text-2xl text-white">{title}</CardTitle>
          <CardDescription className="text-white/70">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Loader2 className="h-4.5 w-4.5 animate-spin text-white/55" />
          <Link
            className="inline-flex items-center justify-center rounded-full bg-[#ff5a74] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e84a66]"
            href={ctaHref}
          >
            {ctaLabel}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
