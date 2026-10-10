"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function VerifyOtpForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const requestedOtp = useRef(false);
  const requestInProgress = useRef(false);
  const verificationInProgress = useRef(false);
  const resendAvailableAt = useRef(0);
  const isCoolingDown = resendSeconds > 0;

  useEffect(() => {
    if (!isCoolingDown) return;
    const timer = window.setInterval(() => {
      setResendSeconds(Math.max(0, Math.ceil((resendAvailableAt.current - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isCoolingDown]);

  const requestOtp = useCallback(async () => {
    if (requestInProgress.current || resendAvailableAt.current > Date.now()) return;
    requestInProgress.current = true;
    setSendingOtp(true);
    setMessage("");
    setMessageType(null);
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        signal: AbortSignal.timeout(35_000),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.error ?? "OTP tidak dapat dikirim.") as Error & { status: number; retryAfter: number };
        error.status = response.status;
        error.retryAfter = Number(response.headers.get("Retry-After"));
        throw error;
      }
      const cooldown = Number(data.resend_after) || 60;
      resendAvailableAt.current = Date.now() + cooldown * 1000;
      setResendSeconds(cooldown);
      setMessage("OTP berhasil dikirim ke email admin. Kode berlaku selama 10 menit.");
      setMessageType("success");
    } catch (error) {
      if (error instanceof Error && "status" in error && error.status === 429) {
        const retryAfter = Number("retryAfter" in error ? error.retryAfter : 0) || 60;
        resendAvailableAt.current = Date.now() + retryAfter * 1000;
        setResendSeconds(retryAfter);
      }
      setMessage(
        error instanceof DOMException && error.name === "TimeoutError"
          ? "Pengiriman OTP terlalu lama. Periksa koneksi dan log server, lalu coba kirim ulang."
          : error instanceof Error
            ? error.message
            : "OTP tidak dapat dikirim."
      );
      setMessageType("error");
    } finally {
      requestInProgress.current = false;
      setSendingOtp(false);
    }
  }, []);

  useEffect(() => {
    if (requestedOtp.current) return;
    requestedOtp.current = true;
    void requestOtp();
  }, [requestOtp]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (verificationInProgress.current) return;
    verificationInProgress.current = true;
    setVerifyingOtp(true);
    setMessage("");
    setMessageType(null);
    try {
      const response = await fetch("/api/auth/otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp_code: otp }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "OTP tidak valid.");
      router.replace(redirectTo.startsWith("/") ? redirectTo : "/admin/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "OTP tidak valid.");
      setMessageType("error");
    } finally {
      verificationInProgress.current = false;
      setVerifyingOtp(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <section className="w-full border border-[#e5e5e5] bg-white p-8">
        <h1 className="text-2xl font-bold text-on-surface">Verifikasi admin</h1>
        <p className="mt-2 text-sm text-on-surface-muted">Kami mengirim kode 6 digit ke email admin. Kode berlaku 10 menit; gunakan kode terbaru dan jangan minta kode berulang kali.</p>
        <button type="button" onClick={() => void requestOtp()} disabled={sendingOtp || verifyingOtp || resendSeconds > 0} className="mt-6 border border-[#e5e5e5] px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {sendingOtp ? "Mengirim OTP..." : resendSeconds > 0 ? `Kirim ulang OTP (${Math.floor(resendSeconds / 60)}:${String(resendSeconds % 60).padStart(2, "0")})` : "Kirim ulang OTP"}
        </button>
        {resendSeconds > 0 && <p className="mt-2 text-xs text-on-surface-muted">Kode baru dapat diminta lagi setelah hitung mundur selesai.</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Kode OTP" className="input w-full" required disabled={sendingOtp || verifyingOtp} />
          <button type="submit" disabled={sendingOtp || verifyingOtp} className="w-full bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {verifyingOtp ? "Memverifikasi..." : "Verifikasi"}
          </button>
        </form>
        {message && <p role={messageType === "error" ? "alert" : "status"} className={`mt-4 text-sm ${messageType === "error" ? "text-red-600" : "text-green-700"}`}>{message}</p>}
      </section>
    </main>
  );
}
