import { NextResponse } from "next/server";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { sendPasswordResetEmail } from "lib/email";
import { emailIdentityRateLimit, rateLimit } from "lib/rateLimit";

const forgotPasswordRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 5 });
const genericResponse = {
  status: "ok",
  message: "Jika email terdaftar, link reset password akan dikirim ke email tersebut.",
};

export async function POST(req: Request) {
  const limit = await forgotPasswordRateLimit(req);
  if (limit.error) {
    return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
  }
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))) } }
    );
  }

  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Masukkan email yang valid." }, { status: 422 });
    }

    const emailLimit = await emailIdentityRateLimit(req, email);
    if (emailLimit.error) return NextResponse.json(genericResponse);
    if (!emailLimit.ok) return NextResponse.json(genericResponse);

    const origin = new URL(req.url).origin;
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${origin}/reset-password` },
    });

    // Keep the response identical for unknown addresses to avoid account enumeration.
    if (error || !data.properties?.hashed_token) return NextResponse.json(genericResponse);

    const resetUrl = new URL("/reset-password", origin);
    resetUrl.searchParams.set("token_hash", data.properties.hashed_token);
    resetUrl.searchParams.set("type", "recovery");

    try {
      await sendPasswordResetEmail(email, resetUrl.toString());
    } catch (emailError) {
      console.error("Password reset email failed:", emailError);
    }

    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(genericResponse);
  }
}
