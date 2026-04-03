import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionCallbackSuccess } from "@/components/dashboard/subscription-callback-success";
import { loadCurrentProfile } from "@/lib/current-profile";
import { verifyPayChanguTransaction } from "@/lib/paychangu";
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
  const txRef = readQueryValue(searchParams?.tx_ref ?? searchParams?.txRef ?? searchParams?.reference);

  if (!txRef) {
    return (
      <ResultCard
        title="Missing transaction reference"
        description="PayChangu returned without a transaction reference, so the subscription could not be verified."
        icon={<ShieldAlert className="h-6 w-6 text-rose-500" />}
        ctaLabel="Back to subscriptions"
        ctaHref="/dashboard/subscription"
      />
    );
  }

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

  let verification;

  try {
    verification = await verifyPayChanguTransaction(txRef);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify the transaction";
    return (
      <ResultCard
        title="Verification failed"
        description={message}
        icon={<ShieldAlert className="h-6 w-6 text-rose-500" />}
        ctaLabel="Retry subscription"
        ctaHref="/dashboard/subscription"
      />
    );
  }

  const verified = verification?.data;
  const paymentStatus = verified?.status?.toLowerCase();
  const meta = verified?.meta && typeof verified.meta === "object" ? verified.meta : null;
  const planId = typeof meta?.plan_id === "string" ? meta.plan_id : null;
  const plan = getSubscriptionPlanById(planId);
  const verifiedUserId = typeof meta?.uuid === "string" ? meta.uuid : null;
  const paymentReference = typeof verified?.reference === "string" ? verified.reference : txRef;
  const verifiedAt = new Date().toISOString();

  if (!plan || verifiedUserId !== user.id) {
    return (
      <ResultCard
        title="Payment payload mismatch"
        description="The verified transaction did not match the expected NanaMeets subscription details."
        icon={<ShieldAlert className="h-6 w-6 text-rose-500" />}
        ctaLabel="Back to subscriptions"
        ctaHref="/dashboard/subscription"
      />
    );
  }

  if (!["success", "successful", "completed", "paid"].includes(paymentStatus ?? "")) {
    return (
      <ResultCard
        title="Payment not completed"
        description="PayChangu did not confirm a successful payment for this transaction."
        icon={<ShieldAlert className="h-6 w-6 text-rose-500" />}
        ctaLabel="Try again"
        ctaHref="/dashboard/subscription"
      />
    );
  }

  try {
    const paymentAmount = typeof verified?.amount === "number" ? verified.amount : plan.amount;
    const paymentCurrency = typeof verified?.currency === "string" ? verified.currency : plan.currency;

    await saveVerifiedSubscription(supabase, {
      userId: user.id,
      plan,
      txRef,
      verifiedAt,
      paymentStatus: paymentStatus ?? "successful",
      paymentReference,
      amount: paymentAmount,
      currency: paymentCurrency,
      referral: profile.referral ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the verified subscription";
    const missingPaymentColumns =
      /tx_ref|payment_reference|payment_status|verified_at|currency|amount/i.test(message) ||
      /column .* does not exist/i.test(message);

    if (missingPaymentColumns) {
      const { error: legacyError } = await supabase.from("subscription").insert({
        user_id: user.id,
        tier: plan.tier,
        referral: profile.referral ?? null,
      });

      if (!legacyError) {
        redirect(`/dashboard/subscription?status=success&tier=${plan.id}`);
      }
    }

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

  return <SubscriptionCallbackSuccess tier={plan.id} txRef={txRef} />;
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
