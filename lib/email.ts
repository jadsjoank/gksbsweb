import nodemailer from "nodemailer";
import { logAuditAction } from "./audit";
import { getRequiredEnv } from "./env";

function getTransporter() {
  const port = Number(getRequiredEnv("SMTP_PORT"));
  return nodemailer.createTransport({
    host: getRequiredEnv("SMTP_HOST"),
    port,
    secure: port === 465,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
    auth: {
      user: getRequiredEnv("SMTP_USER"),
      pass: getRequiredEnv("SMTP_PASS"),
    },
  });
}

export type EmailResult = { ok: true } | { ok: false; error: string };

export async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<EmailResult> {
  try {
    await getTransporter().sendMail({
      from: getRequiredEnv("SMTP_FROM"),
      to,
      subject,
      html,
      text,
    });
    return { ok: true };
  } catch (error) {
    const mailError = error instanceof Error ? error as Error & {
      code?: string;
      responseCode?: number;
      command?: string;
    } : null;
    console.error("Email delivery failed", {
      code: mailError?.code,
      responseCode: mailError?.responseCode,
      command: mailError?.command,
    });
    void logAuditAction({
      entityType: "email",
      action: "delivery_failed",
      details: { recipient: to, subject },
    });
    return { ok: false, error: "Email delivery failed" };
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail(to, "Selamat datang di GKSBS Tanjung Karang", `<div style="font-family: sans-serif; max-width: 560px; margin: auto"><h2>Selamat datang, ${name}!</h2><p>Akun GKSBS Anda berhasil dibuat. Silakan masuk untuk mengakses layanan jemaat.</p></div>`);
}

export async function sendRoleChangedEmail(to: string, name: string, role: string) {
  return sendEmail(to, "Perubahan peran akun GKSBS", `<div style="font-family: sans-serif; max-width: 560px; margin: auto"><h2>Peran akun diperbarui</h2><p>Halo ${name}, peran akun GKSBS Anda sekarang adalah <strong>${role}</strong>.</p><p>Silakan masuk kembali untuk membuka portal sesuai peran Anda.</p></div>`);
}

export async function sendPasswordResetEmail(to: string, actionLink: string) {
  return sendEmail(to, "Atur ulang password GKSBS", `<div style="font-family: sans-serif; max-width: 560px; margin: auto"><h2>Atur ulang password</h2><p>Klik tombol berikut untuk membuat password baru. Link berlaku sesuai masa berlaku recovery.</p><p><a href="${actionLink}" style="display:inline-block;background:#000;color:#fff;padding:12px 20px;text-decoration:none">Atur Ulang Password</a></p><p>Jika Anda tidak meminta perubahan ini, abaikan email ini.</p></div>`);
}
