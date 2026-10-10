import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "lib/supabase/server";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { registerSchema } from "lib/validation/auth";
import { emailIdentityRateLimit, registerRateLimit } from "lib/rateLimit";
import { sendWelcomeEmail } from "lib/email";

export async function POST(req: Request) {
  // Rate limit: 5 registrations per hour per IP
  const limit = await registerRateLimit(req);
  if (limit.error) {
    return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
  }
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan registrasi. Coba lagi dalam 1 jam." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 422 });
    }

    const { email, password, name } = validation.data;
    const emailLimit = await emailIdentityRateLimit(req, email);
    if (emailLimit.error) {
      return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
    }
    if (!emailLimit.ok) {
      return NextResponse.json({ error: "Terlalu banyak email untuk alamat ini. Coba lagi nanti." }, { status: 429 });
    }

    const allowUnverifiedRegistration = process.env.ALLOW_UNVERIFIED_REGISTRATION === "true";
    const useDevShortcut = process.env.NODE_ENV !== "production" && allowUnverifiedRegistration;
    const origin = new URL(req.url).origin;
    let user;
    let session = false;

    if (useDevShortcut) {
      const { data: adminData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, role: "User" },
      });
      if (createError) return NextResponse.json({ error: "Registrasi tidak dapat diproses." }, { status: 400 });
      user = adminData.user;
    } else {
      const supabase = await createSupabaseServerClient();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, role: "User" },
          emailRedirectTo: `${origin}/login`,
        },
      });
      if (signUpError) return NextResponse.json({ error: "Registrasi tidak dapat diproses." }, { status: 400 });
      user = signUpData.user;
      session = Boolean(signUpData.session);
    }

    // Create profile record
    if (user) {
      await supabaseAdmin.from("profiles").upsert(
        { id: user.id, email, role: "User", full_name: name },
        { onConflict: "id" }
      );
      try {
        await sendWelcomeEmail(email, name);
      } catch (emailError) {
        console.error("Welcome email failed:", emailError);
      }
    }

    if (useDevShortcut) {
      const supabase = await createSupabaseServerClient();
      const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
      session = Boolean(signInData.session);
    }

    return NextResponse.json(
      {
        status: "ok",
        user: {
          id: user?.id,
          email: user?.email ?? email,
          role: "User",
        },
        session,
        message: session ? "Registration successful" : "Registration successful. Check your email to confirm your account.",
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error("Register API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
