"use client";

import { useState } from "react";

export function ContactForm({ dark = false }: { dark?: boolean }) {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  const inputCls = dark
    ? "input border-white/20 bg-white/5 text-black placeholder:text-white/30 focus:border-white"
    : "input";

  const labelCls = `label-caps block mb-2 ${dark ? "text-white/50" : ""}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const res  = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json().catch(() => ({ error: "Server error" }));
      if (!res.ok) { setResult({ type: "error", text: data.error || "Gagal mengirim." }); return; }
      setResult({ type: "success", text: "Pesan berhasil dikirim ke admin. Terima kasih!" });
      setName(""); setEmail(""); setSubject(""); setMessage("");
    } catch {
      setResult({ type: "error", text: "Terjadi kesalahan koneksi." });
    } finally { setSending(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {result && (
        <div className={`p-4 text-body-sm border ${
          result.type === "success"
            ? dark ? "border-green-400/30 bg-green-400/10 text-green-300" : "border-green-200 bg-green-50 text-green-800"
            : dark ? "border-red-400/30 bg-red-400/10 text-red-300" : "border-red-200 bg-red-50 text-red-800"
        }`}>
          {result.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Nama Lengkap</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            placeholder="Nama Anda" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            placeholder="nama@email.com" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Subjek</label>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} required className={inputCls}>
          <option value="">Pilih subjek...</option>
          <option value="general">Pertanyaan Umum</option>
          <option value="prayer">Permintaan Doa</option>
          <option value="volunteer">Pendaftaran Volunteer</option>
          <option value="feedback">Saran & Masukan</option>
        </select>
      </div>

      <div>
        <label className={labelCls}>Pesan</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={5}
          placeholder="Tulis pesan Anda..." className={`${inputCls} resize-none`} />
      </div>

      <button type="submit" disabled={sending}
        className={`btn-primary w-full ${dark ? "bg-white text-black hover:bg-white/90" : ""}`}>
        {sending ? "Mengirim..." : "Kirim Pesan →"}
      </button>
    </form>
  );
}
