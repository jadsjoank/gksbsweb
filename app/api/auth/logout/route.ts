import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "lib/supabase/server";
import { MFA_COOKIE_NAME } from "lib/mfa";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const response = NextResponse.json({ status: "ok", message: "Logged out" });
  response.cookies.set(MFA_COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
