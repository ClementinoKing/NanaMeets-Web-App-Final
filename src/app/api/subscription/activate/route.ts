import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSubscriptionPlanById, saveVerifiedSubscription } from "@/lib/subscriptions";
import type { Database } from "@/types/database";

export const runtime = "nodejs";

function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl.replace(/\/+$/, ""), serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const tierId = readString((body as { tier?: unknown }).tier);
  const requestedUserId = readString((body as { userId?: unknown; uid?: unknown }).userId) ||
    readString((body as { userId?: unknown; uid?: unknown }).uid);
  const referral = readString((body as { referral?: unknown }).referral) || null;

  const plan = getSubscriptionPlanById(tierId);

  if (!plan) {
    return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();

  if (!supabase) {
    return NextResponse.json({ error: "Subscription activation is not configured" }, { status: 500 });
  }

  if (!requestedUserId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  try {
    await saveVerifiedSubscription(supabase, {
      userId: requestedUserId,
      plan,
      txRef: null,
      verifiedAt: new Date().toISOString(),
      paymentStatus: "successful",
      paymentReference: null,
      amount: plan.amount,
      currency: plan.currency,
      referral,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not activate subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    status: "success",
    tier: plan.id,
  });
}
