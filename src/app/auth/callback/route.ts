import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const redirectToLogin = (message?: string) => {
    const loginUrl = new URL("/login", url.origin);

    if (message) {
      loginUrl.searchParams.set("error", message);
    }

    return NextResponse.redirect(loginUrl);
  };

  if (error) {
    console.error("OAuth callback returned an error:", {
      error,
      errorDescription,
    });
    return redirectToLogin("oauth");
  }

  if (!code) {
    return redirectToLogin("oauth");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return redirectToLogin("oauth");
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("OAuth code exchange failed:", exchangeError);
    return redirectToLogin("oauth");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToLogin("oauth");
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.redirect(new URL(profile ? "/dashboard" : "/create-profile", url.origin));
}
