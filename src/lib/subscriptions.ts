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

type PriceRow = Database["public"]["Tables"]["prices"]["Row"];

export type SubscriptionRow = Database["public"]["Tables"]["subscription"]["Row"];

const SUBSCRIPTION_PLAN_IDS = new Set<SubscriptionPlanId>(SUBSCRIPTION_PLANS.map((plan) => plan.id));
const PLAN_PRICE_FIELDS: Record<SubscriptionPlanId, { current: keyof PriceRow; previous: keyof PriceRow }> = {
  daily: { current: "daily", previous: "dis_daily" },
  weekly: { current: "weekly", previous: "dis_weekly" },
  monthly: { current: "monthly", previous: "dis_monthly" },
};

type PriceValue = string | number | null | undefined;

function parseAmount(value: PriceValue, fallback: number) {
  if (!value) {
    return fallback;
  }

  const numericValue = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback;
}

function formatPriceLabel(value: PriceValue, fallback: string) {
  if (!value || !String(value).trim()) {
    return fallback;
  }

  const trimmed = String(value).trim();
  const numericValue = Number(trimmed.replace(/[^\d.]/g, ""));

  if (Number.isFinite(numericValue) && numericValue > 0) {
    return `MK ${numericValue.toLocaleString("en-US")}`;
  }

  if (trimmed.toUpperCase().startsWith("MK")) {
    return trimmed;
  }

  return `MK ${trimmed}`;
}

function parseSubscriptionExpiry(subscription: SubscriptionRow | null) {
  if (!subscription?.end_date) {
    return null;
  }

  const parsed = new Date(subscription.end_date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function isSubscriptionActive(subscription: SubscriptionRow | null) {
  const expiry = parseSubscriptionExpiry(subscription);

  return Boolean(subscription?.tier && expiry && expiry.getTime() > Date.now());
}

export function getSubscriptionPlanId(subscription: SubscriptionRow | null): SubscriptionPlanId | null {
  if (!subscription?.tier) {
    return null;
  }

  const planId = subscription.tier.toLowerCase();
  return SUBSCRIPTION_PLAN_IDS.has(planId as SubscriptionPlanId) ? (planId as SubscriptionPlanId) : null;
}

export function getSubscriptionPlanById(planId: string | null | undefined) {
  if (!planId) {
    return null;
  }

  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) ?? null;
}

export async function loadSubscriptionPlans(supabase: SupabaseClient<Database>) {
  try {
    const { data, error } = await supabase
      .from("prices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const priceRow = data as PriceRow | null;

    if (error) {
      console.warn("Failed to load subscription prices, using fallback plans:", error.message);
      return SUBSCRIPTION_PLANS;
    }

    if (!priceRow) {
      return SUBSCRIPTION_PLANS;
    }

    return SUBSCRIPTION_PLANS.map((plan) => {
      const fieldMap = PLAN_PRICE_FIELDS[plan.id];
      if (!fieldMap) {
        return plan;
      }

      return {
        ...plan,
        amount: parseAmount(priceRow[fieldMap.current], plan.amount),
        newPrice: formatPriceLabel(priceRow[fieldMap.current], plan.newPrice),
        oldPrice: formatPriceLabel(priceRow[fieldMap.previous], plan.oldPrice),
      };
    });
  } catch (error) {
    console.warn("Unexpected error loading subscription prices, using fallback plans:", error);
    return SUBSCRIPTION_PLANS;
  }
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
  if (!isSubscriptionActive(subscription)) {
    return "Subscribe";
  }

  const endDate = formatSubscriptionEndDate(subscription?.end_date ?? null);
  const tierLabel = subscription?.tier ?? "Subscription";

  if (endDate) {
    return `${tierLabel} active until ${endDate}`;
  }

  return `${tierLabel} active`;
}

export function canDirectMessageUsers(subscription: SubscriptionRow | null) {
  if (!isSubscriptionActive(subscription)) {
    return false;
  }

  if (subscription?.tier !== "Monthly") {
    return false;
  }

  return true;
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

export async function saveVerifiedSubscription(
  supabase: SupabaseClient<Database>,
  {
    userId,
    plan,
    txRef,
    verifiedAt,
    paymentStatus,
    paymentReference,
    amount,
    currency,
    referral,
  }: {
    userId: string;
    plan: SubscriptionPlan;
    txRef?: string | null;
    verifiedAt: string;
    paymentStatus: string;
    paymentReference: string | null;
    amount: number | null;
    currency: string | null;
    referral: string | null;
  },
) {
  const startDate = new Date(verifiedAt);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  const record = {
    user_id: userId,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    tier: plan.tier,
    referral,
    tx_ref: txRef,
    payment_reference: paymentReference,
    payment_status: paymentStatus,
    amount: amount ?? plan.amount,
    currency: currency ?? plan.currency,
    verified_at: verifiedAt,
  };

  if (!txRef) {
    const { error } = await supabase.from("subscription").insert({
      ...record,
      tx_ref: null,
    });

    if (error) {
      throw error;
    }

    return record;
  }

  const { error } = await supabase.from("subscription").upsert(
    {
      ...record,
      tx_ref: txRef ?? null,
    },
    { onConflict: "tx_ref" },
  );

  if (error) {
    throw error;
  }

  return record;
}
