import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-upload-key, x-upload-content-type",
  };
}

function buildResponse(body: unknown, status = 200, origin: string | null = null) {
  return NextResponse.json(body, {
    status,
    headers: corsHeaders(origin),
  });
}

async function parseResponseBody(response: Response) {
  const responseBody = await response.text();

  if (!responseBody) {
    return null;
  }

  try {
    return JSON.parse(responseBody) as { error?: string; publicUrl?: string };
  } catch {
    return null;
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse("ok", {
    status: 200,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  const key = (request.headers.get("x-upload-key") ?? "").trim();
  const contentType =
    (request.headers.get("x-upload-content-type") ?? "").trim() ||
    request.headers.get("content-type") ||
    "application/octet-stream";

  if (!key) {
    return buildResponse({ error: "Missing key" }, 400, origin);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return buildResponse(
      { error: "Supabase env vars are not configured on the web app" },
      500,
      origin,
    );
  }

  try {
    const body = await request.blob();
    const baseUrl = supabaseUrl.replace(/\/+$/, "");
    const functionNames = ["r2-presign-web", "r2-presign-admin"];

    let lastError: string | null = null;

    for (const functionName of functionNames) {
      const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": contentType,
          "x-upload-key": key,
          "x-upload-content-type": contentType,
        },
        body,
      });

      const parsedBody = await parseResponseBody(response);

      if (response.ok && parsedBody?.publicUrl) {
        return buildResponse(
          {
            ...parsedBody,
            key,
          },
          200,
          origin,
        );
      }

      lastError =
        parsedBody?.error ||
        response.statusText ||
        `Failed to upload file via ${functionName}`;
    }

    return buildResponse({ error: lastError || "Failed to upload file" }, 500, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload file";
    return buildResponse({ error: message }, 500, origin);
  }
}
