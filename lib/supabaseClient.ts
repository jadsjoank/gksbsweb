import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv } from "./env";

const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
