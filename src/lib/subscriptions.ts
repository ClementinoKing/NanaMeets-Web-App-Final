import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type SubscriptionTier = "Daily" | "Weekly" | "Monthly" | "Student" | "Upgrade";

export type SubscriptionPlanId = "daily" | "weekly" | "monthly";

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  tier: Exclude<SubscriptionTier, "Student" | "Upgrade">;
  title: string;
  amount: number;
  currency: "MWK";
  oldPrice: string;
  newPrice: string;
  features: string[];
  description: string;
  durationDays: number;
  recommended?: boolean;
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "daily",
    tier: "Daily",
    title: "Daily",
    amount: 1000,
    currency: "MWK",
    oldPrice: "MK 2,500",
    newPrice: "MK 1,000",
    description: "Try the full membership experience for a single day.",
    durationDays: 1,
    features: [
      "See who likes you",
      "+25 more likes",
      "+10 more messages",
      "Location-based matching",
      "Hide ads",
    ],
  },
  {
    id: "weekly",
    tier: "Weekly",
    title: "Weekly",
    amount: 2500,
    currency: "MWK",
    oldPrice: "MK 5,000",
    newPrice: "MK 2,500",
    description: "A short-term membership for active swipers.",
    durationDays: 7,
    features: [
      "See who likes you",
      "+25 more daily likes",
      "+10 more daily messages",
      "Location-based matching",
      "Hide ads",
    ],
  },
  {
    id: "monthly",
    tier: "Monthly",
    title: "Monthly",
    amount: 6000,
    currency: "MWK",
    oldPrice: "MK 10,000",
    newPrice: "MK 6,000",
    description: "The best value for regular NanaMeets users.",
    durationDays: 30,
    recommended: true,
    features: [
      "See who likes you",
      "Unlimited likes",
      "Unlimited messaging",
      "Direct messages",
      "Location-based matching",
      "Hide ads",
      "Rewind last swipe",
    ],
  },
];

export type SubscriptionRow = Database["public"]["Tables"]["subscription"]["Row"];

export function getSubscriptionPlanById(planId: string | null | undefined) {
  if (!planId) {
    return null;
  }

  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) ?? null;
}

export function formatSubscriptionEndDate(endDate: string | null) {
  if (!endDate) {
    return null;
  }

  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function formatMembershipLabel(subscription: SubscriptionRow | null) {
  if (!subscription) {
    return "No active subscription";
  }

  const endDate = formatSubscriptionEndDate(subscription.end_date);
  const tierLabel = subscription.tier ?? "Subscription";
  return endDate ? `${tierLabel} active until ${endDate}` : `${tierLabel} active`;
}

export function canDirectMessageUsers(subscription: SubscriptionRow | null) {
  if (!subscription?.tier || !subscription.end_date) {
    return false;
  }

  if (subscription.tier !== "Monthly") {
    return false;
  }

  return new Date(subscription.end_date).getTime() > Date.now();
}

export async function loadActiveSubscription(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("subscription")
    .select("*")
    .eq("user_id", userId)
    .gt("end_date", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function loadDirectMessageAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const activeSubscription = await loadActiveSubscription(supabase, userId);
  return {
    activeSubscription,
    canDirectMessageUsers: canDirectMessageUsers(activeSubscription),
  };
}
