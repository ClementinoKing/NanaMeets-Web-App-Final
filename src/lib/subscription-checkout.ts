import type { SubscriptionPlan } from "@/lib/subscriptions";

export type SubscriptionCheckoutPayload = {
  amount: number;
  currency: "MWK";
  tx_ref: string;
  first_name: string;
  last_name: string;
  callback_url: string;
  return_url: string;
  email: string;
  meta: {
    uuid: string;
    response: string;
    plan_id: string;
    tier: string;
    amount: number;
  };
  uuid: string;
  customization: {
    title: string;
    description: string;
  };
};

export function buildSubscriptionCheckoutPayload({
  plan,
  userId,
  firstName,
  email,
  callbackUrl,
  returnUrl,
}: {
  plan: SubscriptionPlan;
  userId: string;
  firstName: string;
  email: string;
  callbackUrl: string;
  returnUrl: string;
}): SubscriptionCheckoutPayload {
  const txRef = `nanameets_${plan.id}_${crypto.randomUUID()}`;

  return {
    amount: plan.amount,
    currency: plan.currency,
    tx_ref: txRef,
    first_name: firstName || "User",
    last_name: plan.title,
    callback_url: callbackUrl,
    return_url: returnUrl,
    email: email || "user@example.com",
    meta: {
      uuid: userId,
      response: "Subscription checkout",
      plan_id: plan.id,
      tier: plan.title,
      amount: plan.amount,
    },
    uuid: userId,
    customization: {
      title: `NanaMeets ${plan.title} Membership`,
      description: plan.description,
    },
  };
}
