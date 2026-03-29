import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "./config";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function updateSession(request: NextRequest) {
  const cookiesToSet: CookieToSet[] = [];
  const config = getSupabaseConfig();

  if (!config) {
    return { response: NextResponse.next({ request: { headers: request.headers } }), user: null };
  }

  const supabase = createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookiesToSet.push(...cookies);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return { response, user };
}
