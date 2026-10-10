import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for Client Components.
 * Uses @supabase/ssr createBrowserClient which handles session
 * refresh and cookie management in the browser automatically.
 *
 * Usage:
 *   import { createSupabaseBrowserClient } from "lib/supabase/client";
 *   const supabase = createSupabaseBrowserClient();
 */
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }
  } catch {
    return null;
  }

  return { url, anonKey };
}

export function createSupabaseBrowserClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  return config ? createBrowserClient(config.url, config.anonKey) : null;
}
