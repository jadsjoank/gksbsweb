"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "components/AdminLayout";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
};

const SUBJECT_MAP: Record<string, { label:string; color: string }> = {
  general: { label: "Pertanyaan Umum", color: "bg-black-50 text-black-800 border-black-200" },
  prayer:  { label: "Permintaan Doa", color: "bg-black-50 text-black-800 border-black-200" },
  volunteer: { label: "Daftar Volunteer", color: "bg-black-50 text-black-800 border-black-200" },
  feedback:  { label: "Saran & Masukan", color: "bg-black-50 text-black-800 border-black-200" },
};

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contact");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || "Gagal mengambil pesan.");
      } else {
        setMessages(data.messages ?? []);
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  return (
    <AdminLayout
      title="Pesan Kontak Masuk"
      description="Daftar pesan yang dikirim jemaat melalui halaman kontak. Hanya dapat dilihat oleh Admin."
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-on-surface-muted">
            Total: <span className="font-semibold text-on-surface">{messages.length}</span> pesan masuk
          </p>
          <button
            onClick={fetchMessages}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-low transition disabled:opacity-50"
          >
            <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m0 0l3 3m-3-3v12" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            ⚠️ {error}
            {error.includes("contact_messages") && (
              <p className="mt-2 font-medium">
                Jalankan isi file <code className="bg-red-100 px-1 rounded">update_schema.sql</code> di Supabase SQL Editor terlebih dahulu.
              </p>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Message List */}
          <div className="lg:col-span-2 space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse border border-[#e5e5e5] bg-white p-5 space-y-2">
                  <div className="h-3 bg-surface-low rounded w-2/3" />
                  <div className="h-2 bg-surface-low rounded w-1/2" />
                  <div className="h-2 bg-surface-low rounded w-full" />
                </div>
              ))
            ) : messages.length === 0 ? (
              <div className="border border-dashed border-[#e5e5e5] bg-white p-12 text-center space-y-2">
                <span className="text-4xl block">📭</span>
                <p className="text-sm font-medium text-on-surface-muted">Belum ada pesan masuk.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const subj = SUBJECT_MAP[msg.subject] ?? { label: msg.subject,color: "bg-gray-50 text-gray-800 border-gray-200" };
                const isSelected = selected?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    onClick={() => setSelected(msg)}
                    className={`w-full text-left border p-5 transition space-y-2 ${
                      isSelected
                        ? "border-black bg-surface-low focus:ring-0"
                        : "border-[#e5e5e5] bg-white hover:bg-surface-low/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-on-surface truncate">{msg.name}</p>
                      <span className="text-[10px] shrink-0 text-on-surface-muted/60">
                        {new Date(msg.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${subj.color}`}>
                      {subj.label}
                    </span>
                    <p className="text-xs text-on-surface-muted line-clamp-2 leading-relaxed">
                      {msg.message}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-3">
            {selected ? (
              <div className="border border-[#e5e5e5] bg-white p-8 space-y-5 sticky top-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-on-surface">{selected.name}</h2>
                    <a href={`mailto:${selected.email}`} className="text-sm text-black hover:underline">
                      {selected.email}
                    </a>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1.5 rounded-full hover:bg-surface-low text-on-surface-muted transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="border-t border-[#e5e5e5] pt-4 space-y-3">
                  {(() => {
                    const subj = SUBJECT_MAP[selected.subject] ?? { label: selected.subject,color: "bg-gray-50 text-gray-800 border-gray-200" };
                    return (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${subj.color}`}>
                        {subj.label}
                      </span>
                    );
                  })()}
                  <p className="text-xs text-on-surface-muted">
                    {new Date(selected.created_at).toLocaleString("id-ID", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>

                <div className="bg-surface-low border border-[#e5e5e5] p-5">
                  <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>

                <a
                  href={`mailto:${selected.email}?subject=Re: Pesan dari ${selected.name}`}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-surface-highest hover:bg-on-surface-muted transition"
                >
                  📧 Balas via Email
                </a>
              </div>
            ) : (
              <div className="border border-dashed border-[#e5e5e5] bg-white/50 p-16 text-center space-y-2 sticky top-6">
                <span className="text-4xl block">👈</span>
                <p className="text-sm font-medium text-on-surface-muted">Pilih pesan dari daftar kiri untuk melihat detailnya.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
