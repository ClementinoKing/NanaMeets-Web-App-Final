import type { SubscriptionPlan } from "@/lib/subscriptions";

type PaymentMeta = {
  uuid: string;
  response: string;
  plan_id: string;
  tier: string;
  amount: number;
};

export type PayChanguCheckoutPayload = {
  amount: number;
  currency: "MWK";
  tx_ref: string;
  first_name: string;
  last_name: string;
  callback_url: string;
  return_url: string;
  email: string;
  meta: PaymentMeta;
  uuid: string;
  customization: {
    title: string;
    description: string;
  };
};

export type PayChanguCheckoutResponse = {
  status?: string;
  message?: string;
  data?: {
    checkout_url?: string;
    tx_ref?: string;
    data?: {
      tx_ref?: string;
      currency?: string;
      amount?: number;
      status?: string;
    };
  };
};

export type PayChanguVerificationResponse = {
  status?: string;
  message?: string;
  data?: {
    tx_ref?: string;
    status?: string;
    currency?: string;
    amount?: number;
    reference?: string;
    meta?: Record<string, unknown> | null;
    customization?: {
      title?: string | null;
      description?: string | null;
      logo?: string | null;
    } | null;
    customer?: {
      email?: string | null;
      first_name?: string | null;
      last_name?: string | null;
    } | null;
  };
};

function getPayChanguApiKey() {
  const apiKey = process.env.PAYCHANGU_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("PAYCHANGU_API_KEY is not configured");
  }

  return apiKey;
}

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
}): PayChanguCheckoutPayload {
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

export async function requestPayChanguCheckout(payload: PayChanguCheckoutPayload) {
  const response = await fetch("https://api.paychangu.com/payment", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getPayChanguApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();
  let body: PayChanguCheckoutResponse | null = null;

  try {
    body = bodyText ? (JSON.parse(bodyText) as PayChanguCheckoutResponse) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.message || bodyText || "Unable to start PayChangu checkout");
  }

  const checkoutUrl = body?.data?.checkout_url;
  const txRef = body?.data?.tx_ref ?? body?.data?.data?.tx_ref ?? payload.tx_ref;

  if (!checkoutUrl) {
    throw new Error("PayChangu did not return a checkout URL");
  }

  return {
    checkoutUrl,
    txRef,
    raw: body,
  };
}

export async function verifyPayChanguTransaction(txRef: string) {
  const response = await fetch(`https://api.paychangu.com/verify-payment/${encodeURIComponent(txRef)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getPayChanguApiKey()}`,
    },
  });

  const bodyText = await response.text();
  let body: PayChanguVerificationResponse | null = null;

  try {
    body = bodyText ? (JSON.parse(bodyText) as PayChanguVerificationResponse) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.message || bodyText || "Unable to verify PayChangu transaction");
  }

  return body;
}
