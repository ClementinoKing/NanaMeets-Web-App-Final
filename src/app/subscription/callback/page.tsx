import { SubscriptionCallbackSuccess } from "@/components/dashboard/subscription-callback-success";
import { getSubscriptionPlanById } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

type QueryValue = string | string[] | undefined;

function readQueryValue(value: QueryValue) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default function SubscriptionCallbackPage({
  searchParams,
}: Readonly<{
  searchParams?: Record<string, QueryValue>;
}>) {
  const tierId = readQueryValue(searchParams?.tier ?? searchParams?.plan_id ?? searchParams?.planId);
  const plan = getSubscriptionPlanById(tierId) ?? getSubscriptionPlanById("monthly");

  if (!plan) {
    return null;
  }

  return <SubscriptionCallbackSuccess tier={plan.id} />;
}
