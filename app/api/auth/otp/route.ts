import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { sendEmail } from "lib/email";
import { createMfaCookieValue, MFA_COOKIE_NAME } from "lib/mfa";
import { getRequiredSecret } from "lib/env";
import { emailIdentityRateLimit, otpAttemptRateLimit, otpCooldownRateLimit, otpRateLimit, otpVerifyIdentityRateLimit } from "lib/rateLimit";

/**
 * /api/auth/otp
 *
 * Admin OTP verification:
 *   1. Login via Supabase Auth (email + password)
 *   2. The OTP endpoint requires an Admin session but is the only path that can
 *      establish the short-lived signed MFA cookie.
 *   3. All other admin guards require that cookie in addition to the role.
 *
 * POST: Generate OTP → store in admin_otps → send via SMTP
 * PUT:  Verify OTP → mark as used → return success
 */

const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;

function generateOTP(): string {
  return Array.from({ length: OTP_LENGTH }, () => randomInt(0, 10)).join("");
}

function hashOTP(adminId: string, code: string) {
  return createHmac("sha256", getRequiredSecret("OTP_PEPPER")).update(`${adminId}:${code}`).digest("hex");
}

function hashesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

// POST — Generate and send OTP
export async function POST(req: Request) {
  const admin = await requireAdmin({ requireMfa: false });
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  }

  const cooldown = await otpCooldownRateLimit(req, admin.email);
  if (cooldown.error) return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
  if (!cooldown.ok) {
    return NextResponse.json(
      { error: "Permintaan OTP terlalu cepat. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((cooldown.resetAt - Date.now()) / 1000))) } }
    );
  }

  // Reject rapid repeats before consuming the broader per-IP request quota.
  const limit = await otpRateLimit(req);
  if (limit.error) {
    return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
  }
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan OTP. Coba lagi dalam 10 menit." },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))) } }
    );
  }

  const emailLimit = await emailIdentityRateLimit(req, admin.email);
  if (emailLimit.error) {
    return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
  }
  if (!emailLimit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan email OTP. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((emailLimit.resetAt - Date.now()) / 1000))) } }
    );
  }

  const otpCode = generateOTP();
  const otpHash = hashOTP(admin.id, otpCode);
  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  ).toISOString();

  const { error: expireError } = await supabaseAdmin
    .from("admin_otps")
    .update({ is_used: true })
    .eq("admin_id", admin.id)
    .eq("is_used", false);

  if (expireError) {
    console.error("Failed to expire previous admin OTPs:", expireError.message);
    return NextResponse.json({ error: "OTP tidak dapat dibuat. Coba lagi nanti." }, { status: 500 });
  }

  // Store only a hash of the OTP before attempting delivery.
  const { error: insertError } = await supabaseAdmin
    .from("admin_otps")
    .insert([
      {
        admin_id: admin.id,
        otp_code: otpHash,
        expires_at: expiresAt,
        is_used: false,
      },
    ]);

  if (insertError) {
    console.error("Failed to create admin OTP:", insertError.message);
    return NextResponse.json({ error: "OTP tidak dapat dibuat. Coba lagi nanti." }, { status: 500 });
  }

  const emailResult = await sendEmail(
    admin.email,
    "Kode Verifikasi Admin GKSBS",
    `<div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #2C1810;">Verifikasi Admin</h2>
      <p>Gunakan kode berikut untuk verifikasi akses admin:</p>
      <div style="background: #FEF9F1; border: 2px solid #FFDEA0; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2C1810; margin: 0;">${otpCode}</p>
      </div>
      <p style="color: #504440; font-size: 14px;">Kode ini berlaku selama ${OTP_EXPIRY_MINUTES} menit. Jangan bagikan kode ini kepada siapapun.</p>
    </div>`
  );

  if (!emailResult.ok) {
    const { error: invalidateError } = await supabaseAdmin
      .from("admin_otps")
      .update({ is_used: true })
      .eq("admin_id", admin.id)
      .eq("otp_code", otpHash)
      .eq("is_used", false);
    if (invalidateError) console.error("Failed to invalidate undelivered admin OTP:", invalidateError.message);
    return NextResponse.json({ error: "Email OTP gagal dikirim. Coba lagi nanti." }, { status: 502 });
  }

  return NextResponse.json({
    status: "ok",
    message: "OTP sent.",
    expires_in: OTP_EXPIRY_MINUTES * 60,
    resend_after: Math.max(1, Math.ceil((cooldown.resetAt - Date.now()) / 1000)),
  });
}

// PUT — Verify OTP
export async function PUT(req: Request) {
  const admin = await requireAdmin({ requireMfa: false });
  if (!admin) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 401 }
    );
  }

  const limit = await otpVerifyIdentityRateLimit(req, admin.email);
  if (limit.error) {
    return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
  }
  if (!limit.ok) {
    return NextResponse.json({ error: "Terlalu banyak percobaan OTP. Minta kode baru nanti." }, { status: 429 });
  }

  const body = await req.json();
  const otpCode = typeof body?.otp_code === "string" ? body.otp_code.trim() : "";

  if (!/^\d{6}$/.test(otpCode)) {
    return NextResponse.json(
      { error: "OTP code is required." },
      { status: 400 }
    );
  }

  const { data: otp, error } = await supabaseAdmin
    .from("admin_otps")
    .select("id, otp_code, expires_at, is_used")
    .eq("admin_id", admin.id)
    .eq("is_used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !otp) {
    return NextResponse.json(
      { error: "Kode OTP tidak valid atau sudah kedaluwarsa. Pastikan Anda memakai kode terbaru dari email." },
      { status: 401 }
    );
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex");
  const attemptLimit = await otpAttemptRateLimit(`otp-attempt:${otp.id}:${ipHash}`);
  if (attemptLimit.error) {
    return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
  }
  if (!attemptLimit.ok) {
    return NextResponse.json({ error: "Terlalu banyak percobaan OTP. Minta kode baru nanti." }, { status: 429 });
  }

  if (!hashesMatch(hashOTP(admin.id, otpCode), otp.otp_code)) {
    return NextResponse.json(
      { error: "Kode OTP tidak valid atau sudah kedaluwarsa. Pastikan Anda memakai kode terbaru dari email." },
      { status: 401 }
    );
  }

  // Mark OTP as used
  const { error: consumeError } = await supabaseAdmin
    .from("admin_otps")
    .update({ is_used: true })
    .eq("id", otp.id);

  if (consumeError) {
    return NextResponse.json({ error: "OTP verification failed. Try again." }, { status: 500 });
  }

  const response = NextResponse.json({
    status: "ok",
    message: "OTP verified. Admin MFA is active.",
  });
  response.cookies.set(MFA_COOKIE_NAME, createMfaCookieValue(admin.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return response;
}
