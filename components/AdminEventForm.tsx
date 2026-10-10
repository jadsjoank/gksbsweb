"use client";

import { FormEvent, useRef, useState } from "react";

interface EventData {
  id: string; title: string; description: string | null;
  location: string | null; start_date: string; end_date: string | null;
  attendance_enabled: boolean | null; is_active: boolean | null; type: string | null;
  theme: string | null; speaker: string | null;
  image_url: string | null;
  warta_url: string | null; liturgi_url: string | null;
}

interface AdminEventFormProps {
  editingEvent?: EventData | null;
  onSaved?: () => void;
  onCancel?: () => void;
}

function toDateTimeLocal(isoStr: string | null) {
  if (!isoStr) return { date: "", hour: "", min: "" };
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(isoStr));
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    date: `${value.year}-${value.month}-${value.day}`,
    hour: value.hour,
    min: value.minute,
  };
}

const hourOptions   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minuteOptions = ["00", "15", "30", "45"];

/** Reusable PDF upload row */
function PdfUploadField({
  label, docType, value, onChange,
}: {
  label: string; docType: "warta" | "liturgi";
  value: string; onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.type !== "application/pdf") { setError("Hanya file PDF."); return; }
    if (file.size > 10 * 1024 * 1024)   { setError("Maks 10MB."); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", docType);
      const res  = await fetch("/api/admin/upload-pdf", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok && data.status === "ok") onChange(data.url);
      else setError(data.error || "Gagal upload.");
    } catch { setError("Error upload."); }
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <label className="label-caps block">{label}</label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border border-dashed p-4 cursor-pointer transition-colors ${
          uploading ? "border-[#e5e5e5] bg-surface-low cursor-not-allowed" : "border-[#e5e5e5] hover:border-black hover:bg-surface-low"
        }`}
      >
        {value ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-body-sm">📄</span>
              <a href={value} target="_blank" rel="noopener noreferrer"
                className="text-body-sm font-semibold underline truncate max-w-xs"
                onClick={(e) => e.stopPropagation()}>
                Lihat PDF
              </a>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="text-caption text-error border border-red-200 px-2 py-0.5 hover:bg-red-50 transition-colors">
              Hapus
            </button>
          </div>
        ) : (
          <p className="text-body-sm text-on-surface-muted text-center">
            {uploading ? "Mengupload..." : "Klik atau drag PDF di sini — maks 10MB"}
          </p>
        )}
      </div>
      {error && <p className="text-caption text-error">{error}</p>}
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        disabled={uploading} />
    </div>
  );
}

export default function AdminEventForm({ editingEvent, onSaved, onCancel }: AdminEventFormProps) {
  const isEditing = Boolean(editingEvent);
  const sp = editingEvent ? toDateTimeLocal(editingEvent.start_date) : { date: "", hour: "", min: "" };
  const ep = editingEvent ? toDateTimeLocal(editingEvent.end_date)   : { date: "", hour: "", min: "" };

  const recurringFromDescription = /recurring_weekly\s*:\s*(true|1|yes)/i.test(editingEvent?.description ?? "");

  const [f, setF] = useState<{
    title: string;
    description: string;
    theme: string;
    speaker: string;
    location: string;
    startDate: string;
    startHour: string;
    startMin: string;
    endDate: string;
    endHour: string;
    endMin: string;
    attendanceEnabled: boolean;
    isActive: boolean;
    type: string;
    imageUrl: string;
    wartaUrl: string;
    liturgiUrl: string;
    repeatWeekly: boolean;
  }>({
    title:              editingEvent?.title ?? "",
    description:        editingEvent?.description ?? "",
    theme:              editingEvent?.theme ?? "",
    speaker:            editingEvent?.speaker ?? "",
    location:           editingEvent?.location ?? "",
    startDate: sp.date, startHour: sp.hour, startMin: sp.min,
    endDate:   ep.date, endHour:   ep.hour, endMin:   ep.min,
    attendanceEnabled:  editingEvent?.attendance_enabled ?? false,
    isActive:           editingEvent?.is_active ?? true,
    type:               editingEvent?.type ?? "lainnya",
    imageUrl:           editingEvent?.image_url ?? "",
    wartaUrl:           editingEvent?.warta_url ?? "",
    liturgiUrl:         editingEvent?.liturgi_url ?? "",
    repeatWeekly:       recurringFromDescription,
  });

  const [msg,         setMsg]         = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);

  const ts = (date: string, h: string, m: string) => {
    if (!date || !h || !m) return null;
    const [year, month, day] = date.split("-").map(Number);
    const utcMillis = Date.UTC(year, month - 1, day, Number(h), Number(m)) - 7 * 60 * 60 * 1000;
    return new Date(utcMillis).toISOString();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = "checked" in e.target ? (e.target as HTMLInputElement).checked : false;
    setF((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const startDate = ts(f.startDate, f.startHour, f.startMin);
    const endDate = ts(f.endDate, f.endHour, f.endMin);
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      setMsg("Waktu selesai harus setelah waktu mulai.");
      return;
    }
    setSubmitting(true); setMsg(null);
    const metadataParts = [
      f.description?.trim(),
      f.theme ? `Tema: ${f.theme}` : null,
      f.speaker ? `Pembawa Firman: ${f.speaker}` : null,
      f.repeatWeekly ? "recurring_weekly: true" : null,
    ].filter(Boolean);

    const payload: Record<string, unknown> = {
      title:              f.title,
      description:        f.description || null,
      theme:              f.theme || null,
      speaker:            f.speaker || null,
      location:           f.location || null,
      start_date:         startDate,
      end_date:           endDate,
      attendance_enabled: f.attendanceEnabled,
      is_active:          f.isActive,
      type:               f.type,
      image_url:          f.imageUrl || null,
      warta_url:          f.wartaUrl || null,
      liturgi_url:        f.liturgiUrl || null,
      repeat_weekly:      f.repeatWeekly,
    };
    if (isEditing && editingEvent) payload.id = editingEvent.id;
    try {
      const res  = await fetch("/api/admin/events", {
        method:  isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({ status: "error", message: "Server error" }));
      if (!res.ok || data.status !== "ok") {
        setMsg(data.message || "Terjadi kesalahan.");
      } else {
        setMsg(isEditing ? "Event berhasil diperbarui." : "Event berhasil dibuat.");
        if (!isEditing) {
             setF({ title: "", description: "", theme: "", speaker: "", location: "", startDate: "", startHour: "", startMin: "",
               endDate: "", endHour: "", endMin: "", attendanceEnabled: false, isActive: true, type: "lainnya", imageUrl: "",
                 wartaUrl: "", liturgiUrl: "", repeatWeekly: false });
        }
        onSaved?.();
      }
    } catch { setMsg("Tidak dapat terhubung ke server."); }
    finally { setSubmitting(false); }
  };

  const sel = "input w-auto";

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      {/* Title */}
      <div>
        <label className="label-caps block mb-2">Judul Event</label>
        <input name="title" value={f.title} onChange={handleChange} required
          placeholder="Contoh: Ibadah Minggu Pagi" className="input" />
      </div>

      {/* Description */}
      <div>
        <label className="label-caps block mb-2">Deskripsi</label>
        <textarea name="description" value={f.description} onChange={handleChange} rows={3}
          placeholder="Ringkasan acara..." className="input resize-none" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label-caps block mb-2">Tema</label>
          <input name="theme" value={f.theme} onChange={handleChange}
            placeholder="Contoh: Kuat dalam Kasih" className="input" />
        </div>
        <div>
          <label className="label-caps block mb-2">Pembawa Firman</label>
          <input name="speaker" value={f.speaker} onChange={handleChange}
            placeholder="Contoh: Pdt. Budi Santoso" className="input" />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="label-caps block mb-2">Lokasi</label>
        <input name="location" value={f.location} onChange={handleChange}
          placeholder="Gedung GKSBS" className="input" />
      </div>

      {/* Start */}
      <div>
        <label className="label-caps block mb-2">Waktu Mulai</label>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <input type="date" name="startDate" value={f.startDate} onChange={handleChange} required className="input" />
          <select name="startHour" value={f.startHour} onChange={handleChange} required className={sel}>
            <option value="">Jam</option>
            {hourOptions.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <select name="startMin" value={f.startMin} onChange={handleChange} required className={sel}>
            <option value="">Mnt</option>
            {minuteOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* End */}
      <div>
        <label className="label-caps block mb-2">Waktu Selesai</label>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <input type="date" name="endDate" value={f.endDate} onChange={handleChange} className="input" />
          <select name="endHour" value={f.endHour} onChange={handleChange} className={sel}>
            <option value="">Jam</option>
            {hourOptions.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <select name="endMin" value={f.endMin} onChange={handleChange} className={sel}>
            <option value="">Mnt</option>
            {minuteOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Attendance */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" name="attendanceEnabled" checked={f.attendanceEnabled} onChange={handleChange}
          className="h-4 w-4 border border-[#e5e5e5]" />
        <span className="label-caps">Aktifkan Attendance</span>
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" name="repeatWeekly" checked={f.repeatWeekly} onChange={handleChange}
          className="h-4 w-4 border border-[#e5e5e5]" />
        <span className="label-caps">Tampilkan tiap minggu pada hari & jam yang sama</span>
      </label>

      <div>
        <label className="label-caps block mb-2">Kategori Event</label>
        <select name="type" value={f.type} onChange={handleChange} className="input">
          <option value="ibadah_minggu">Ibadah Minggu</option>
          <option value="ibadah_rabu">Ibadah Rabu</option>
          <option value="ibadah_pemuda">Ibadah Pemuda</option>
          <option value="ibadah_anak">Ibadah Anak</option>
          <option value="persekutuan">Persekutuan</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" name="isActive" checked={f.isActive} onChange={handleChange}
          className="h-4 w-4 border border-[#e5e5e5]" />
        <span className="label-caps">Tampilkan di halaman publik</span>
      </label>

      {/* Image URL */}
      <div>
        <label className="label-caps block mb-2">URL Gambar (opsional)</label>
        <input name="imageUrl" value={f.imageUrl} onChange={handleChange}
          placeholder="https://..." className="input" />
      </div>

      {/* PDF Warta */}
      <PdfUploadField
        label="Warta Jemaat (PDF)"
        docType="warta"
        value={f.wartaUrl}
        onChange={(url) => setF((p) => ({ ...p, wartaUrl: url }))}
      />

      {/* PDF Liturgi */}
      <PdfUploadField
        label="Liturgi Ibadah (PDF)"
        docType="liturgi"
        value={f.liturgiUrl}
        onChange={(url) => setF((p) => ({ ...p, liturgiUrl: url }))}
      />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={submitting} className="btn-primary flex-1">
          {submitting ? "Menyimpan..." : isEditing ? "Perbarui Event" : "Buat Event"}
        </button>
        {isEditing && onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary px-6">Batal</button>
        )}
      </div>

      {msg && (
        <div className={`p-4 text-body-sm border ${
          msg.includes("berhasil")
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-800"
        }`}>
          {msg}
        </div>
      )}
    </form>
  );
}
