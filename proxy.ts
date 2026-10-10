import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getRequiredEnv } from "lib/env";
import { MFA_COOKIE_NAME, verifyMfaCookieValue } from "lib/mfa";
import { ROLE_HOME, type Role } from "lib/roles";

/**
 * Next.js Proxy (proxy.ts — used in Next.js 16+)
 *
 * Runs on every matched request BEFORE the page renders.
 * - Reads session from cookies via @supabase/ssr
 * - Refreshes expired sessions automatically
 * - Redirects unauthenticated users from protected routes
 * - Enforces role-based routing (Admin → /admin/*, Member → /dashboard, etc.)
 */

const PUBLIC_PATHS = [
  "/",
  "/about",
  "/ministries",
  "/events",
  "/news",
  "/donate",
  "/contact",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/register",
  "/warta-gereja",
  "/ecommerce",
  "/unauthorized",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/admin/verify-otp") {
    return NextResponse.next();
  }

  // Public paths — no auth check needed
  if (
    PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    )
  ) {
    return NextResponse.next();
  }

  // Auth API routes — skip (they handle their own auth)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Create Supabase client with cookie access for session management
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as never)
          );
        },
      },
    }
  );

  // Refresh the session — critical for keeping sessions alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user session → redirect to login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role portal protection — check role from profiles table
  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const specialistAccess =
      (profile?.role === "Penulis" && pathname.includes("/warta-gereja")) ||
      (profile?.role === "Seller" && pathname.includes("/ecommerce")) ||
      (profile?.role === "Bendahara" && pathname.includes("/donations"));
    if (!profile || (profile.role !== "Admin" && !specialistAccess)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (profile.role === "Admin" && !verifyMfaCookieValue(request.cookies.get(MFA_COOKIE_NAME)?.value, user.id)) {
      const verifyUrl = new URL("/admin/verify-otp", request.url);
      verifyUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(verifyUrl);
    }
  }

  const rolePath = Object.entries(ROLE_HOME).find(([, path]) => path !== "/dashboard" && pathname.startsWith(path));
  if (rolePath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || profile.role !== rolePath[0] as Role) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/attendance/:path*",
    "/donations/:path*",
    "/warta-gereja/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/profile",
    "/penulis/:path*",
    "/seller/:path*",
    "/bendahara/:path*",
  ],
};
