"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "lib/supabase/client";

export function SettingsForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password baru minimal 8 karakter." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Konfirmasi password tidak cocok." });
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setMessage({ type: "error", text: "Layanan autentikasi belum dikonfigurasi." });
        return;
      }

      // Update password via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
        return;
      }

      setMessage({ type: "success", text: "Password berhasil diperbarui." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan. Silakan coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-gksbs-border bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-gksbs-brown">Ubah Password</h2>
      <p className="mt-2 text-sm text-gksbs-brown-medium">Masukkan password baru untuk mengamankan akun Anda.</p>

      {message && (
        <div className={`mt-6 rounded-2xl p-4 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gksbs-brown-medium">Password Saat Ini</label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-gksbs-border px-4 py-3 outline-none transition focus:border-gksbs-brown-accent focus:ring-2 focus:ring-gksbs-gold/30"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gksbs-brown-medium">Password Baru</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-gksbs-border px-4 py-3 outline-none transition focus:border-gksbs-brown-accent focus:ring-2 focus:ring-gksbs-gold/30"
            placeholder="Minimal 8 karakter"
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gksbs-brown-medium">Konfirmasi Password Baru</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-gksbs-border px-4 py-3 outline-none transition focus:border-gksbs-brown-accent focus:ring-2 focus:ring-gksbs-gold/30"
            placeholder="Ulangi password baru"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-gksbs-brown px-8 py-3 text-sm font-semibold text-white transition hover:bg-gksbs-brown-medium disabled:opacity-50"
        >
          {loading ? "Memperbarui..." : "Ubah Password"}
        </button>
      </form>
    </div>
  );
}
