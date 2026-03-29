import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const AUTH_ROUTES = new Set(["/login", "/signup"]);

function redirectWithCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname === "/" && user) {
    return redirectWithCookies(request, response, "/dashboard");
  }

  if (pathname.startsWith("/dashboard") && !user) {
    return redirectWithCookies(request, response, "/login");
  }

  if (AUTH_ROUTES.has(pathname) && user) {
    return redirectWithCookies(request, response, "/dashboard");
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard", "/dashboard/:path*"],
};
