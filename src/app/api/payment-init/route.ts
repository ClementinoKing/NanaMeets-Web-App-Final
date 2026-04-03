import { NextRequest, NextResponse } from "next/server";
import { loadCurrentProfile } from "@/lib/current-profile";
import { getPaymentCallbackUrl, getPaymentReturnUrl } from "@/lib/payment-urls";
import {
  buildSubscriptionCheckoutPayload,
  requestPayChanguCheckout,
  type PayChanguCheckoutPayload,
} from "@/lib/paychangu";
import { getSubscriptionPlanById } from "@/lib/subscriptions";
import { getServerAuthSession } from "@/lib/supabase/server";

export const runtime = "nodejs";

function buildCallbackUrl(request: NextRequest, pathname: string, tier?: string | null, userId?: string | null) {
  if (pathname === "/subscription/callback") {
    return getPaymentCallbackUrl(tier ?? undefined, userId ?? undefined, request.headers.get("origin") ?? request.nextUrl.origin);
  }

  if (pathname === "/subscription/return") {
    return getPaymentReturnUrl(tier ?? undefined, userId ?? undefined, request.headers.get("origin") ?? request.nextUrl.origin);
  }

  const origin = request.headers.get("origin") ?? request.nextUrl.origin;
  return new URL(pathname, origin).toString();
}

function isPayChanguCheckoutPayload(body: unknown): body is PayChanguCheckoutPayload {
  if (!body || typeof body !== "object") {
    return false;
  }

  const record = body as Record<string, unknown>;
  return typeof record.tx_ref === "string" && typeof record.callback_url === "string" && typeof record.uuid === "string";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const { supabase, user } = await getServerAuthSession();

  if (!supabase || !user) {
    return NextResponse.json({ error: "You must be signed in to subscribe" }, { status: 401 });
  }

  const { profile } = await loadCurrentProfile(supabase, {
    email: user.email ?? null,
    userId: user.id,
  });

  const payload = isPayChanguCheckoutPayload(body)
    ? body
    : (() => {
        const { planId } = body as { planId?: string };
        const plan = getSubscriptionPlanById(planId);

        if (!plan) {
          return null;
        }

        return buildSubscriptionCheckoutPayload({
          plan,
          userId: user.id,
          firstName: profile?.f_name ?? user.email ?? "User",
          email: user.email ?? profile?.email ?? "",
          callbackUrl: buildCallbackUrl(request, "/subscription/callback", plan.id, user.id),
          returnUrl: buildCallbackUrl(request, "/subscription/return", plan.id, user.id),
        });
      })();

  if (!payload) {
    return NextResponse.json({ error: "Invalid subscription plan" }, { status: 400 });
  }

  try {
    const result = await requestPayChanguCheckout(payload);

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      txRef: result.txRef,
      planId: isPayChanguCheckoutPayload(body) ? payload.meta.plan_id : getSubscriptionPlanById((body as { planId?: string }).planId)?.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start subscription checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
