"use client";

import { useState } from "react";

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
}

export function ProfileEditForm({ profile }: { profile: Profile | null }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, phone, date_of_birth: dateOfBirth, address }),
      });

      const result = await response.json().catch(() => ({ error: "Server error" }));

      if (!response.ok) {
        setMessage({ type: "error", text: result.error || "Gagal menyimpan profil." });
        return;
      }

      setMessage({ type: "success", text: "Profil berhasil diperbarui." });
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan. Silakan coba lagi." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-gksbs-border bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-gksbs-brown">Edit Profil</h2>
      <p className="mt-2 text-sm text-gksbs-brown-medium">Perbarui informasi pribadi Anda di bawah ini.</p>

      {message && (
        <div className={`mt-6 rounded-2xl p-4 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gksbs-brown-medium">Nama Lengkap</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-gksbs-border px-4 py-3 outline-none transition focus:border-gksbs-brown-accent focus:ring-2 focus:ring-gksbs-gold/30"
            placeholder="Nama lengkap Anda"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gksbs-brown-medium">Email</label>
          <input
            id="email"
            type="email"
            value={profile?.email ?? ""}
            disabled
            className="mt-2 w-full rounded-2xl border border-gksbs-border bg-gksbs-cream px-4 py-3 text-gksbs-brown-medium outline-none"
          />
          <p className="mt-1 text-xs text-gksbs-brown-medium">Email tidak dapat diubah.</p>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gksbs-brown-medium">Nomor Telepon</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-gksbs-border px-4 py-3 outline-none transition focus:border-gksbs-brown-accent focus:ring-2 focus:ring-gksbs-gold/30"
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <div>
          <label htmlFor="dob" className="block text-sm font-medium text-gksbs-brown-medium">Tanggal Lahir</label>
          <input
            id="dob"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-gksbs-border px-4 py-3 outline-none transition focus:border-gksbs-brown-accent focus:ring-2 focus:ring-gksbs-gold/30"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gksbs-brown-medium">Alamat</label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-gksbs-border px-4 py-3 outline-none transition focus:border-gksbs-brown-accent focus:ring-2 focus:ring-gksbs-gold/30 resize-none"
            placeholder="Alamat lengkap Anda"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-gksbs-brown px-8 py-3 text-sm font-semibold text-white transition hover:bg-gksbs-brown-medium disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </div>
  );
}
