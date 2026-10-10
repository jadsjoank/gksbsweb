import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "lib/supabase/server";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { loginRateLimit } from "lib/rateLimit";

export async function POST(req: Request) {
  // Rate limit: 10 attempts per 15 minutes per IP
  const limit = await loginRateLimit(req);
  if (limit.error) {
    return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
  }
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await req.json();

    const { loginSchema } = await import("lib/validation/auth");
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 422 }
      );
    }

    const { email, password } = validation.data;
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message ?? "Invalid credentials" },
        { status: 401 }
      );
    }

    // Fetch user's role from profiles table
    let role = "User";
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    if (profile?.role) role = profile.role;

    return NextResponse.json({
      status: "ok",
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error("Login API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
