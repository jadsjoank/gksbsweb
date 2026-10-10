import { supabaseAdmin } from "lib/supabaseAdmin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Berita dan Pengumuman | GKSBS Tanjung Karang",
  description: "Ikuti berita, pengumuman, dan kegiatan terbaru jemaat GKSBS Tanjung Karang.",
  alternates: { canonical: "/news" },
};

type NewsItem = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  type: string;
  image_url: string | null;
};

export default async function NewsPage() {
  // Fetch recent events as news/announcements
  const { data: events, error: eventsError } = await supabaseAdmin
    .from("events")
    .select("id, title, description, start_date, type, image_url")
    .eq("is_public", true)
    .order("start_date", { ascending: false })
    .limit(20) as { data: NewsItem[] | null; error: { message: string } | null };

  const newsList = events ?? [];

  const typeLabel: Record<string, string> = {
    ibadah_minggu: "Ibadah",
    ibadah_rabu: "Ibadah",
    ibadah_pemuda: "Pemuda",
    ibadah_anak: "Anak",
    persekutuan: "Persekutuan",
    lainnya: "Pengumuman",
  };

  return (
    <>
      {/* Hero */}
      <section className="relative w-full py-24 overflow-hidden" style={{ backgroundImage: "url('/community.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="container relative z-10">
          <p className="text-sm font-medium uppercase tracking-widest text-yellow-200">Berita & Pengumuman</p>
          <h1 className="mt-4 text-5xl font-bold text-white max-w-2xl">Kabar Terbaru GKSBS</h1>
          <p className="mt-6 text-lg text-yellow-100 max-w-2xl">
            Ikuti berita terkini, pengumuman, dan kegiatan jemaat GKSBS Tanjung Karang.
          </p>
        </div>
      </section>

      {/* News Grid */}
      <section className="w-full bg-gksbs-cream py-20">
        <div className="container">
          {eventsError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-12 text-center text-red-800">
              Berita dan pengumuman belum dapat dimuat. Silakan coba lagi beberapa saat lagi.
            </div>
          ) : newsList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gksbs-border bg-gksbs-card p-12 text-center text-gksbs-brown-medium">
              Belum ada berita atau pengumuman.
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {newsList.map((item) => (
                <article key={item.id} className="bg-white rounded-3xl border border-gksbs-border overflow-hidden hover:shadow-lg transition">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gksbs-card flex items-center justify-center">
                      <span className="text-4xl">📰</span>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="rounded-full bg-gksbs-cream border border-gksbs-border px-2 py-0.5 text-xs font-semibold text-gksbs-brown-accent">
                        {typeLabel[item.type] || "Berita"}
                      </span>
                      <span className="text-xs text-gksbs-brown-medium">
                        {new Date(item.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gksbs-brown line-clamp-2">{item.title}</h3>
                    {item.description && (
                      <p className="mt-2 text-sm text-gksbs-brown-medium leading-relaxed line-clamp-3">{item.description}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
