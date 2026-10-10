"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AuthForm } from "components/AuthForm";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const requestInProgress = useRef(false);
  const resendAvailableAt = useRef(0);
  const isCoolingDown = resendSeconds > 0;

  useEffect(() => {
    if (!isCoolingDown) return;
    const timer = window.setInterval(() => {
      setResendSeconds(Math.max(0, Math.ceil((resendAvailableAt.current - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isCoolingDown]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestInProgress.current || resendAvailableAt.current > Date.now()) return;
    requestInProgress.current = true;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get("Retry-After")) || 60;
          resendAvailableAt.current = Date.now() + retryAfter * 1000;
          setResendSeconds(retryAfter);
        }
        setError(data.error ?? "Permintaan tidak dapat diproses.");
      } else {
        setResult(`${data.message} Periksa juga folder spam sebelum meminta link baru.`);
        resendAvailableAt.current = Date.now() + 60_000;
        setResendSeconds(60);
      }
    } catch {
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.");
    } finally {
      requestInProgress.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthForm title="Lupa Password" subtitle="Masukkan email akun Anda untuk menerima link perubahan password." onSubmit={handleSubmit} isLoading={loading} isSubmitDisabled={resendSeconds > 0} submitLabel={resendSeconds > 0 ? `Kirim ulang link (${Math.floor(resendSeconds / 60)}:${String(resendSeconds % 60).padStart(2, "0")})` : "Kirim link reset password"} error={error}>
      {result && <div role="status" className="border border-green-200 bg-green-50 p-4 text-sm text-green-800">{result}</div>}
      {resendSeconds > 0 && <p className="text-sm text-gksbs-brown-medium">Tunggu {Math.floor(resendSeconds / 60)}:{String(resendSeconds % 60).padStart(2, "0")} sebelum meminta link lagi.</p>}
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-gksbs-brown">Email</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@contoh.com" className="input" />
      </div>
      <p className="pt-2 text-center text-sm text-gksbs-brown-medium"><Link href="/login" className="font-semibold text-gksbs-brown hover:underline">Kembali ke login</Link></p>
    </AuthForm>
  );
}
