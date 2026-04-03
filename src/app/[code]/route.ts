import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ShortLinkRow = {
  id: number;
  target_url: string;
  is_active: boolean;
  clicks_count: number | null;
};

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

function createShortLinkClient() {
  const env = getSupabaseEnv();

  if (!env) {
    return null;
  }

  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function resolveCode(request: NextRequest) {
  return request.nextUrl.pathname.split("/").filter(Boolean)[0] ?? "";
}

function resolveDestinationUrl(rawTargetUrl: string, origin: string) {
  const trimmed = rawTargetUrl.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const direct = new URL(trimmed);

    if (direct.protocol === "http:" || direct.protocol === "https:") {
      return direct;
    }
  } catch {
    // Fall through to normalized forms below.
  }

  if (trimmed.startsWith("//")) {
    try {
      return new URL(`https:${trimmed}`);
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith("/")) {
    try {
      return new URL(trimmed, origin);
    } catch {
      return null;
    }
  }

  try {
    return new URL(`https://${trimmed}`);
  } catch {
    return null;
  }
}

async function loadShortLink(code: string) {
  const supabase = createShortLinkClient();

  if (!supabase) {
    return { error: "Short-link service is not configured" as const };
  }

  const { data, error } = await supabase
    .from("nanameets_short_links")
    .select("id,target_url,is_active,clicks_count")
    .eq("slug", code)
    .maybeSingle();

  if (error) {
    console.error("Failed to load short link", error);
    return { error: "Unable to load short link" as const };
  }

  return { record: data as ShortLinkRow | null };
}

async function incrementClicks(codeId: number, currentClicks: number | null) {
  const supabase = createShortLinkClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("nanameets_short_links")
    .update({ clicks_count: (currentClicks ?? 0) + 1 })
    .eq("id", codeId);

  if (error) {
    console.error("Failed to increment short-link clicks", error);
  }
}

async function handleShortLink(request: NextRequest, countClick: boolean) {
  const code = resolveCode(request);

  if (!code) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await loadShortLink(code);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  if (!result.record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!result.record.is_active) {
    return NextResponse.json({ error: "Gone" }, { status: 410 });
  }

  const destination = resolveDestinationUrl(result.record.target_url, request.nextUrl.origin);

  if (!destination) {
    return NextResponse.json({ error: "Invalid destination" }, { status: 500 });
  }

  if (countClick) {
    void incrementClicks(result.record.id, result.record.clicks_count);
  }

  return NextResponse.redirect(destination, 302);
}

export function GET(request: NextRequest) {
  return handleShortLink(request, true);
}

export function HEAD(request: NextRequest) {
  return handleShortLink(request, false);
}
