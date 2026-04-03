import { redirect } from "next/navigation";
import { loadCurrentProfile } from "@/lib/current-profile";
import { getSubscriptionPlanId, loadActiveSubscription, loadSubscriptionPlans } from "@/lib/subscriptions";
import { getServerAuthSession } from "@/lib/supabase/server";
import { SubscriptionPlansClient } from "@/components/dashboard/subscription-plans-client";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage({
  searchParams,
}: Readonly<{
  searchParams?: Record<string, string | string[] | undefined>;
}>) {
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

  const activeSubscription = await loadActiveSubscription(supabase, user.id);
  const subscriptionPlans = await loadSubscriptionPlans(supabase);
  const currentPlanId = getSubscriptionPlanId(activeSubscription);
  const flashMessage =
    typeof searchParams?.status === "string" && searchParams.status === "success"
      ? "Your payment was verified and your subscription is now active."
      : typeof searchParams?.status === "string" && searchParams.status === "cancelled"
        ? "The payment was cancelled or did not complete. You can try again below."
        : null;

  return (
    <SubscriptionPlansClient
      activeSubscription={activeSubscription}
      currentPlanId={currentPlanId}
      plans={subscriptionPlans}
      displayName={profile.f_name ?? user.email ?? "NanaMeets member"}
      email={user.email ?? profile.email ?? ""}
      userId={user.id}
      flashMessage={flashMessage}
    />
  );
}
