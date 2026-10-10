"use client";

import { useEffect, useState } from "react";
import AdminWartaForm from "components/AdminWartaForm";
import { AdminLayout } from "components/AdminLayout";

type NewsItem = {
  id: string;
  title: string;
  narration: string;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
};

export default function AdminWartaGerejaPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      const response = await fetch("/api/admin/warta-gereja");
      const data = await response.json();
      if (data.status === "ok") setNews(data.news);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const removeNews = async (id: string) => {
    if (!confirm("Hapus warta ini? Tindakan tidak dapat dibatalkan.")) return;
    await fetch("/api/admin/warta-gereja", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchNews();
  };

  return (
    <AdminLayout title="Warta Gereja" description="Kelola narasi, foto, publikasi, dan interaksi warta gereja.">
      <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="bg-white p-8 border border-gksbs-border">
          <h2 className="text-2xl font-semibold text-gksbs-brown">Daftar Warta</h2>
          <div className="mt-6 space-y-4">
            {loading ? <p className="text-gksbs-brown-medium">Memuat...</p> : news.length === 0 ? (
              <p className="border border-dashed border-gksbs-border p-8 text-center text-gksbs-brown-medium">Belum ada warta gereja.</p>
            ) : news.map((item) => (
              <article key={item.id} className="border border-gksbs-border bg-gksbs-cream p-6">
                <div className="flex gap-5">
                  {item.image_url && <img src={item.image_url} alt={item.title} className="h-24 w-24 shrink-0 object-cover" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-gksbs-brown">{item.title}</h3>
                      <span className={`shrink-0 px-2 py-1 text-xs font-semibold ${item.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {item.is_published ? "Terbit" : "Draft"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gksbs-brown-medium line-clamp-3">{item.narration}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 border-t border-gksbs-border pt-4">
                  <button onClick={() => setEditingNews(item)} className="border border-gksbs-border px-4 py-2 text-xs font-semibold hover:bg-white">Edit</button>
                  <button onClick={() => removeNews(item.id)} className="border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Hapus</button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="h-fit bg-white p-8 border border-gksbs-border lg:sticky lg:top-24">
          <h2 className="text-xl font-semibold text-gksbs-brown">{editingNews ? `Edit: ${editingNews.title}` : "Tambah Warta Baru"}</h2>
          <AdminWartaForm key={editingNews?.id || "new"} editingNews={editingNews} onSaved={() => { setEditingNews(null); fetchNews(); }} onCancel={() => setEditingNews(null)} />
        </section>
      </div>
    </AdminLayout>
  );
}
