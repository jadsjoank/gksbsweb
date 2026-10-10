"use client";

import { useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  uploadEndpoint?: string;
};

export default function ImageUpload({ value, onChange, label = "Gambar", uploadEndpoint = "/api/admin/upload" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(uploadEndpoint, { method: "POST", body: form });
      const data = await res.json();

      if (res.ok && data.status === "ok") {
        onChange(data.url);
      } else {
        setError(data.error || "Gagal mengupload gambar.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="label-caps block">{label}</label>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center border border-dashed transition
          ${uploading ? "border-[#e5e5e5] bg-surface-low cursor-not-allowed" : "border-[#e5e5e5] hover:border-black hover:bg-surface-low"}
          ${value ? "p-3" : "p-10"}`}
      >
        {value ? (
          <div className="w-full">
            <img src={value} alt="preview" className="w-full h-40 rounded-xl object-cover" />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gksbs-brown-medium truncate max-w-xs">{value.split("/").pop()}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
                className="ml-2 px-2 py-0.5 text-caption font-bold border border-red-300 text-red-600 hover:bg-red-50 transition"
              >
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-2">🖼️</div>
            {uploading ? (
              <p className="text-sm text-gksbs-brown-medium">Mengupload...</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gksbs-brown">Klik atau drag & drop gambar</p>
                <p className="text-xs text-gksbs-brown-medium mt-1">JPG, PNG, WebP — maks. 5MB</p>
              </>
            )}
          </>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gksbs-brown border-t-transparent" />
          </div>
        )}
      </div>

      {error && <p className="text-caption text-error">❌ {error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />
    </div>
  );
}
