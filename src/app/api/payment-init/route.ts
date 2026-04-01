import { NextRequest, NextResponse } from "next/server";
import { loadCurrentProfile } from "@/lib/current-profile";
import { buildSubscriptionCheckoutPayload, requestPayChanguCheckout } from "@/lib/paychangu";
import { getSubscriptionPlanById } from "@/lib/subscriptions";
import { getServerAuthSession } from "@/lib/supabase/server";

export const runtime = "nodejs";

function buildCallbackUrl(request: NextRequest, pathname: string) {
  const origin = request.headers.get("origin") ?? request.nextUrl.origin;
  return new URL(pathname, origin).toString();
}

export async function POST(request: NextRequest) {
  const { planId } = (await request.json().catch(() => ({}))) as { planId?: string };
  const plan = getSubscriptionPlanById(planId);

  if (!plan) {
    return NextResponse.json({ error: "Invalid subscription plan" }, { status: 400 });
  }

  const { supabase, user } = await getServerAuthSession();

  if (!supabase || !user) {
    return NextResponse.json({ error: "You must be signed in to subscribe" }, { status: 401 });
  }

  const { profile } = await loadCurrentProfile(supabase, {
    email: user.email ?? null,
    userId: user.id,
  });

  const payload = buildSubscriptionCheckoutPayload({
    plan,
    userId: user.id,
    firstName: profile?.f_name ?? user.email ?? "User",
    email: user.email ?? profile?.email ?? "",
    callbackUrl: buildCallbackUrl(request, "/subscription/callback"),
    returnUrl: buildCallbackUrl(request, "/subscription/return"),
  });

  try {
    const result = await requestPayChanguCheckout(payload);

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      txRef: result.txRef,
      planId: plan.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start subscription checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
