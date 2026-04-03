import { NextResponse, type NextRequest } from "next/server";

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

function resolveCode(request: NextRequest) {
  return request.nextUrl.pathname.split("/").filter(Boolean)[0] ?? "";
}

async function loadShortLink(code: string) {
  const env = getSupabaseEnv();

  if (!env) {
    return { error: "Short-link service is not configured" as const };
  }

  const queryUrl = new URL(`${env.supabaseUrl}/rest/v1/nanameets_short_links`);
  queryUrl.searchParams.set("select", "id,target_url,is_active,clicks_count");
  queryUrl.searchParams.set("slug", `eq.${code}`);
  queryUrl.searchParams.set("limit", "1");

  const response = await fetch(queryUrl, {
    headers: {
      apikey: env.serviceRoleKey,
      Authorization: `Bearer ${env.serviceRoleKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return { error: "Unable to load short link" as const };
  }

  const records = (await response.json()) as ShortLinkRow[];
  return { record: records[0] ?? null };
}

async function incrementClicks(codeId: number, currentClicks: number | null) {
  const env = getSupabaseEnv();

  if (!env) {
    return;
  }

  await fetch(`${env.supabaseUrl}/rest/v1/nanameets_short_links?id=eq.${codeId}`, {
    method: "PATCH",
    headers: {
      apikey: env.serviceRoleKey,
      Authorization: `Bearer ${env.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ clicks_count: (currentClicks ?? 0) + 1 }),
    cache: "no-store",
  }).catch(() => null);
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

  let destination: URL;

  try {
    destination = new URL(result.record.target_url);
  } catch {
    return NextResponse.json({ error: "Invalid destination" }, { status: 500 });
  }

  if (destination.protocol !== "http:" && destination.protocol !== "https:") {
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
