"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "components/AdminLayout";

type Settings = {
  church_name: string;
  church_address: string;
  church_phone: string;
  church_email: string;
  midtrans_environment: string;
  notifications_enabled: boolean;
  registration_open: boolean;
  maintenance_mode: boolean;
};

const DEFAULT: Settings = {
  church_name:           "GKSBS Tanjung Karang",
  church_address:        "Jl. Sutan Syahrir No.27, Pahoman, Lampung",
  church_phone:          "0821-8457-1705",
  church_email:          "gksbs.tk@gmail.com",
  midtrans_environment:  "sandbox",
  notifications_enabled: true,
  registration_open:     true,
  maintenance_mode:      false,
};

type Tab = "gereja" | "pembayaran" | "sistem";
type BooleanSettingKey = "notifications_enabled" | "registration_open" | "maintenance_mode";

export default function AdminSettingsPage() {
  const [tab,      setTab]      = useState<Tab>("gereja");
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings((p) => ({ ...p, ...d.settings }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const res  = await fetch("/api/admin/settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.status === "ok") setMsg({ type: "ok", text: "Pengaturan berhasil disimpan." });
      else setMsg({ type: "err", text: data.error || "Gagal menyimpan." });
    } catch { setMsg({ type: "err", text: "Tidak dapat terhubung ke server." }); }
    setSaving(false);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "gereja",    label: "Profil Gereja"   },
    { id: "pembayaran",label: "Pembayaran"       },
    { id: "sistem",    label: "Sistem & Akses"   },
  ];

  if (loading) {
    return (
      <AdminLayout title="Pengaturan" description="Konfigurasi sistem gereja.">
        <div className="border border-[#e5e5e5] bg-white p-16 text-center">
          <p className="label-caps text-on-surface-muted">Memuat...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pengaturan" description="Konfigurasi profil gereja, integrasi pembayaran, dan sistem akses.">
      {/* Tab bar */}
      <div className="flex border-b border-[#e5e5e5] mb-8 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-6 py-3 text-body-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? "border-black text-black" : "border-transparent text-on-surface-muted hover:text-black"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl space-y-6">

        {/* ── Profil Gereja ── */}
        {tab === "gereja" && (
          <>
            <div className="border border-[#e5e5e5] bg-white p-8">
              <p className="label-caps mb-6">Informasi Gereja</p>
              <div className="space-y-5">
                <div>
                  <label className="label-caps block mb-2">Nama Gereja</label>
                  <input value={settings.church_name}
                    onChange={(e) => setSettings((p) => ({ ...p, church_name: e.target.value }))}
                    className="input" placeholder="GKSBS Tanjung Karang" />
                </div>
                <div>
                  <label className="label-caps block mb-2">Alamat</label>
                  <textarea value={settings.church_address}
                    onChange={(e) => setSettings((p) => ({ ...p, church_address: e.target.value }))}
                    rows={2} className="input resize-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label-caps block mb-2">Telepon</label>
                    <input value={settings.church_phone}
                      onChange={(e) => setSettings((p) => ({ ...p, church_phone: e.target.value }))}
                      className="input" />
                  </div>
                  <div>
                    <label className="label-caps block mb-2">Email</label>
                    <input type="email" value={settings.church_email}
                      onChange={(e) => setSettings((p) => ({ ...p, church_email: e.target.value }))}
                      className="input" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Pembayaran ── */}
        {tab === "pembayaran" && (
          <>
            <div className="border border-[#e5e5e5] bg-white p-8">
              <p className="label-caps mb-1">Midtrans</p>
              <p className="text-body-sm text-on-surface-muted mb-6">
                Konfigurasi integrasi pembayaran Midtrans. Key sensitif disimpan sebagai environment variable di server.
              </p>
              <div className="space-y-5">
                <div>
                  <label className="label-caps block mb-2">Environment</label>
                  <select value={settings.midtrans_environment}
                    onChange={(e) => setSettings((p) => ({ ...p, midtrans_environment: e.target.value }))}
                    className="input">
                    <option value="sandbox">Sandbox — Testing</option>
                    <option value="production">Production — Live</option>
                  </select>
                  {settings.midtrans_environment === "production" && (
                    <p className="mt-2 text-caption text-error">
                      ⚠️ Mode Production aktif — transaksi akan diproses secara nyata.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-[#e5e5e5] bg-surface-low p-6">
              <p className="label-caps mb-3">Environment Variables (Server-side)</p>
              <p className="text-body-sm text-on-surface-muted mb-4">
                Key-key berikut harus diset di environment server (Vercel / .env.local), bukan di UI ini.
              </p>
              <div className="space-y-2">
                {["MIDTRANS_SERVER_KEY", "MIDTRANS_CLIENT_KEY", "SMTP_HOST", "SMTP_USER", "SUPABASE_SERVICE_ROLE_KEY"].map((k) => (
                  <div key={k} className="flex items-center justify-between border border-[#e5e5e5] bg-white px-4 py-2.5">
                    <code className="text-body-sm font-mono">{k}</code>
                    <span className="text-caption text-on-surface-muted">env var</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Sistem ── */}
        {tab === "sistem" && (
          <>
            <div className="border border-[#e5e5e5] bg-white p-8">
              <p className="label-caps mb-6">Kontrol Akses & Fitur</p>
              <div className="space-y-4">
                {([
                  {
                    key: "notifications_enabled" as const,
                    label: "Notifikasi Aktif",
                    desc:  "Kirim notifikasi ke jemaat setelah kolekte berhasil.",
                    danger: false,
                  },
                  {
                    key: "registration_open" as const,
                    label: "Registrasi Terbuka",
                    desc:  "Izinkan pendaftaran akun baru. Matikan saat maintenance.",
                    danger: false,
                  },
                  {
                    key: "maintenance_mode" as const,
                    label: "Mode Maintenance",
                    desc:  "Tampilkan halaman maintenance ke pengunjung publik.",
                    danger: true,
                  },
                ] as { key: BooleanSettingKey; label: string; desc: string; danger: boolean }[]).map((item) => {
                  const isEnabled = settings[item.key];

                  return (
                    <div key={item.key}
                      className={`flex items-start justify-between gap-6 border p-5 ${item.danger && isEnabled ? "border-red-300 bg-red-50" : "border-[#e5e5e5]"}`}>
                      <div>
                        <p className="text-body-sm font-semibold">{item.label}</p>
                        <p className="text-caption text-on-surface-muted mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings((p) => ({ ...p, [item.key]: !p[item.key] }))}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                          isEnabled ? (item.danger ? "bg-error" : "bg-black") : "bg-surface-high"
                        }`}
                        aria-checked={isEnabled}
                        role="switch"
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                          isEnabled ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border border-[#e5e5e5] bg-white p-8">
              <p className="label-caps mb-4">Informasi Deploy</p>
              <div className="space-y-2 text-body-sm">
                {[
                  { label: "Next.js",  value: "16+" },
                  { label: "Database", value: "Supabase (PostgreSQL)" },
                  { label: "Storage",  value: "Supabase Storage" },
                  { label: "Auth",     value: "Supabase Auth + @supabase/ssr" },
                  { label: "Email",    value: "Hostinger SMTP" },
                  { label: "Payment",  value: "Midtrans Snap" },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between border-b border-[#e5e5e5] pb-2 last:border-0 last:pb-0">
                    <span className="text-on-surface-muted">{r.label}</span>
                    <span className="font-medium">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Save button */}
        <div className="flex items-center gap-4 pt-2">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? "Menyimpan..." : "Simpan Pengaturan →"}
          </button>
          {msg && (
            <p className={`text-body-sm font-medium ${msg.type === "ok" ? "text-green-700" : "text-error"}`}>
              {msg.type === "ok" ? "✓" : "✗"} {msg.text}
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
