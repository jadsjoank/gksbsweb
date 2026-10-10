"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "lib/supabase/client";
import { AuthForm } from "components/AuthForm";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Layanan autentikasi belum dikonfigurasi.");
      setReady(true);
      return;
    }
    const supabaseClient = supabase;

    let active = true;
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    async function establishRecoverySession() {
      try {
        if (tokenHash && type === "recovery") {
          const { error: verifyError } = await supabaseClient.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (verifyError) throw verifyError;
          window.history.replaceState({}, "", window.location.pathname);
        } else {
          const { data, error: sessionError } = await supabaseClient.auth.getSession();
          if (sessionError || !data.session) {
            throw sessionError ?? new Error("Recovery session is missing.");
          }
        }
      } catch {
        if (active) setError("Link reset tidak valid atau sudah kedaluwarsa. Minta link reset yang baru.");
      } finally {
        if (active) setReady(true);
      }
    }

    void establishRecoverySession();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (password !== confirmPassword) return setError("Konfirmasi password tidak cocok.");
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Layanan autentikasi belum dikonfigurasi.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else {
      setResult("Password berhasil diubah. Anda akan diarahkan ke login.");
      setTimeout(() => router.push("/login"), 1500);
    }
    setLoading(false);
  }

  return (
    <AuthForm title="Buat Password Baru" subtitle="Gunakan minimal 8 karakter untuk password baru Anda." onSubmit={handleSubmit} isLoading={loading || !ready} error={error}>
      {result && <div className="border border-green-200 bg-green-50 p-4 text-sm text-green-800">{result}</div>}
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-gksbs-brown">Password Baru</label>
        <input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="input" />
      </div>
      <div>
        <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-gksbs-brown">Konfirmasi Password</label>
        <input id="confirm-password" type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="input" />
      </div>
    </AuthForm>
  );
}
