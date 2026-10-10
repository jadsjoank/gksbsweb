"use client";

import { useState } from "react";
import ImageUpload from "components/ImageUpload";

type NewsItem = { id: string; title: string; narration: string; image_url: string | null; is_published: boolean };

type Props = { editingNews: NewsItem | null; onSaved: () => void; onCancel: () => void };

export default function AdminWartaForm({ editingNews, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState(editingNews?.title ?? "");
  const [narration, setNarration] = useState(editingNews?.narration ?? "");
  const [imageUrl, setImageUrl] = useState(editingNews?.image_url ?? "");
  const [isPublished, setIsPublished] = useState(editingNews?.is_published ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/warta-gereja", {
        method: editingNews ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingNews?.id, title, narration, image_url: imageUrl, is_published: isPublished }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== "ok") throw new Error(data.message || "Gagal menyimpan warta.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan warta.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-5">
      <div>
        <label className="label-caps block mb-2">Judul</label>
        <input value={title} onChange={(event) => setTitle(event.target.value)} required className="w-full border border-gksbs-border px-4 py-3 text-body-sm" />
      </div>
      <div>
        <label className="label-caps block mb-2">Narasi</label>
        <textarea value={narration} onChange={(event) => setNarration(event.target.value)} required rows={8} className="w-full border border-gksbs-border px-4 py-3 text-body-sm resize-y" />
      </div>
      <ImageUpload value={imageUrl} onChange={setImageUrl} label="Foto Warta" />
      <label className="flex items-center gap-3 text-body-sm">
        <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} />
        Tampilkan kepada pengguna
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? "Menyimpan..." : editingNews ? "Perbarui Warta" : "Terbitkan Warta"}</button>
        {editingNews && <button type="button" onClick={onCancel} className="btn-secondary">Batal</button>}
      </div>
    </form>
  );
}
