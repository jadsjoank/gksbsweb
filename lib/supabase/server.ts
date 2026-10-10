import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getRequiredEnv } from "../env";

/**
 * Creates a Supabase client for Server Components, API Routes, and Server Actions.
 * Uses @supabase/ssr to properly handle cookie-based sessions.
 *
 * IMPORTANT: This client can refresh expired sessions automatically
 * because it has access to both the access token and refresh token cookies.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component where cookies
            // cannot be set. This is expected — the middleware will
            // handle session refresh instead.
          }
        },
      },
    }
  );
}
