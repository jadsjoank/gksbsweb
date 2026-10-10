import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv } from "./env";

const supabaseAdminUrl = getRequiredEnv("SUPABASE_URL");
const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

export const supabaseAdmin = createClient(supabaseAdminUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
