import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "./supabase/server";
import { supabaseAdmin } from "./supabaseAdmin";
import type { Role } from "./roles";
import { MFA_COOKIE_NAME, verifyMfaCookieValue } from "./mfa";

/**
 * Auth utilities for API Routes and Server Actions.
 *
 * Uses @supabase/ssr createServerClient for session management
 * (reads from cookies automatically) and supabaseAdmin for
 * operations that need to bypass RLS.
 */

/**
 * Gets the current authenticated user's profile from the database.
 * Uses the SSR server client which reads session from cookies.
 *
 * @returns Profile with role, or null if not authenticated.
 */
export async function getProfileFromRequest() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return null;

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, role, full_name")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return {
      id: user.id,
      email: user.email ?? "",
      role: "User" as const,
      full_name: null,
    };
  }

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role as Role,
    full_name: profile.full_name ?? null,
  } as const;
}

/**
 * Admin guard — returns profile only when the session is Admin and has a valid
 * signed MFA cookie. The OTP verification endpoint explicitly disables the MFA
 * check so it can establish that cookie.
 *
 * Usage:
 *   const admin = await requireAdmin();
 *   if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 */
export async function requireAdmin(options: { requireMfa?: boolean } = {}) {
  const profile = await getProfileFromRequest();
  if (!profile || profile.role !== "Admin") return null;
  if (options.requireMfa !== false) {
    const cookieStore = await cookies();
    if (!verifyMfaCookieValue(cookieStore.get(MFA_COOKIE_NAME)?.value, profile.id)) return null;
  }
  return profile;
}

export async function requireRoles(roles: Role[]) {
  const profile = await getProfileFromRequest();
  if (!profile || !roles.includes(profile.role)) return null;
  if (profile.role === "Admin") {
    const cookieStore = await cookies();
    if (!verifyMfaCookieValue(cookieStore.get(MFA_COOKIE_NAME)?.value, profile.id)) return null;
  }
  return profile;
}

/**
 * Creates a standardized unauthorized response.
 */
export function unauthorizedResponse(message = "Authentication required") {
  return NextResponse.json(
    { status: "unauthorized", message },
    { status: 401 }
  );
}

/**
 * Creates a standardized forbidden response.
 */
export function forbiddenResponse(message = "Insufficient permissions") {
  return NextResponse.json(
    { status: "forbidden", message },
    { status: 403 }
  );
}
