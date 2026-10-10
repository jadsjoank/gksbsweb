"use client";

import { useState } from "react";
import { useAuthStore } from "lib/store/useAuthStore";

const DEFAULT_QRIS_IMAGE_URL = "/kolekte1.png";

function getQrisImageUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_QRIS_IMAGE_URL?.trim();
  if (!configuredUrl) return DEFAULT_QRIS_IMAGE_URL;
  if (configuredUrl.startsWith("/")) return configuredUrl;

  try {
    const parsedUrl = new URL(configuredUrl);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
      ? configuredUrl
      : DEFAULT_QRIS_IMAGE_URL;
  } catch {
    return DEFAULT_QRIS_IMAGE_URL;
  }
}

export default function DonatePage() {
  const user        = useAuthStore((s) => s.user);
  const [qrisImageUrl, setQrisImageUrl] = useState(getQrisImageUrl);
  const [qrisAvailable, setQrisAvailable] = useState(true);
  const [amount,    setAmount] = useState<number>(0);
  const [custom,    setCustom] = useState("");
  const [name,      setName]   = useState("");
  const [email,     setEmail]  = useState("");
  const [phone,     setPhone]  = useState("");
  const [notes,     setNotes]  = useState("");
  const [loading,   setLoading]= useState(false);
  const [result,    setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const finalAmount = amount || Number(custom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    if (!finalAmount || finalAmount <= 0) {
      setResult({ type: "error", text: "Masukkan nominal kolekte." }); return;
    }
    if (!qrisAvailable) {
      setResult({ type: "error", text: "QRIS sedang tidak tersedia. Silakan coba lagi nanti." });
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          donor_name: name || user?.email || "Guest",
          donor_email: email || user?.email || "",
          donor_phone: phone, notes,
        }),
      });
      const data = await res.json().catch(() => ({ error: "Server error" }));
      if (!res.ok) { setResult({ type: "error", text: data.error || "Gagal memproses kolekte." }); return; }
      setResult({ type: "success", text: `Kolekte Rp ${finalAmount.toLocaleString("id-ID")} tercatat. Silakan selesaikan pembayaran melalui QRIS.` });
    } catch { setResult({ type: "error", text: "Terjadi kesalahan. Silakan coba lagi." }); }
    finally { setLoading(false); }
  };

  return (
    <>
      {/* ── Header ───────────────────────────────────── */}
      <section className="border-b border-[#e5e5e5] bg-white">
        <div className="container py-16">
          <h1 className="text-display font-black tracking-tighter leading-none">Kolekte</h1>
          <p className="mt-6 text-body-lg text-on-surface-muted max-w-xl">
            Setiap pemberian membantu memperluas jangkauan kasih Tuhan melalui pelayanan dan misi sosial.
          </p>
        </div>
      </section>

      <section className="bg-surface py-section">
        <div className="container grid grid-cols-1 lg:grid-cols-3 gap-px bg-[#e5e5e5] border border-[#e5e5e5]">
          {/* Form */}
          <div className="lg:col-span-2 bg-white p-10">
            {result && (
              <div className={`mb-8 p-4 border text-body-sm ${
                result.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
              }`}>
                {result.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="bg-black text-white text-caption font-bold px-2 py-0.5">01</span>
                  <p className="label-caps">Nominal Kolekte</p>
                </div>
                <div className="relative">
                  <input type="number" value={custom}
                    onChange={(e) => { setCustom(e.target.value); setAmount(0); }}
                    placeholder="Masukkan nominal..." className="input pl-12" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="bg-black text-white text-caption font-bold px-2 py-0.5">02</span>
                  <p className="label-caps">Informasi Jemaat</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label-caps block mb-2">Nama</label>
                    <input value={name} onChange={(e) => setName(e.target.value)}
                      placeholder={user?.email || "Nama Anda"} className="input" />
                  </div>
                  <div>
                    <label className="label-caps block mb-2">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder={user?.email || "email@contoh.com"} className="input" />
                  </div>
                </div>
                <div className="mt-5">
                  <label className="label-caps block mb-2">Catatan (opsional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                    placeholder="Pesan atau doa..." className="input resize-none" />
                </div>
              </div>

              <button type="submit" disabled={loading || !finalAmount}
                className="btn-primary w-full py-4 text-body disabled:opacity-40">
                {loading ? "Memproses..." : `kolekte Rp ${finalAmount.toLocaleString("id-ID")} →`}
              </button>
            </form>
          </div>

          {/* Summary */}
          <div className="bg-black p-10 flex flex-col">
            <p className="label-caps text-white/40 mb-6">Ringkasan</p>
            <div className="mb-8 border border-white/20 p-4">
              <p className="label-caps text-white/40 mb-3">Bayar via QRIS</p>
              {qrisAvailable ? (
                <img
                  src={qrisImageUrl}
                  alt="QRIS GKSBS"
                  onError={() => {
                    setQrisAvailable(false);
                    setQrisImageUrl("");
                  }}
                  className="mx-auto aspect-square w-full max-w-[220px] bg-white object-contain p-3"
                />
              ) : (
                <p className="text-caption text-white/60 leading-relaxed">
                  QRIS belum tersedia. Admin perlu mengatur NEXT_PUBLIC_QRIS_IMAGE_URL atau memastikan aset /kolekte1.png tersedia.
                </p>
              )}
            </div>
            <div className="space-y-5 flex-1">
              {[
                { label: "Metode", value: "QRIS" },
                { label: "Frekuensi", value: "Satu kali" },
              ].map((row) => (
                <div key={row.label} className="border-b border-white/10 pb-5">
                  <p className="label-caps text-white/40 mb-1">{row.label}</p>
                  <p className="text-body text-white font-semibold capitalize">{row.value}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-white/20 pt-6 mt-6">
              <p className="label-caps text-white/40 mb-2">Total</p>
              <p className="text-h1 text-white font-black tracking-tighter">
                {finalAmount > 0 ? `Rp ${finalAmount.toLocaleString("id-ID")}` : "—"}
              </p>
            </div>
            <p className="text-caption text-white/30 mt-8 leading-relaxed">
              Kolekte hanya diproses melalui QRIS. Midtrans digunakan khusus untuk e-commerce.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
