import Link from "next/link";
import { supabaseAdmin } from "lib/supabaseAdmin";
import type { Metadata } from "next";
import WartaInteractions from "components/WartaInteractions";
import WartaShareLinks from "components/WartaShareLinks";

export const metadata: Metadata = {
  title: "Warta Gereja dan Berita | GKSBS Tanjung Karang",
  description: "Baca warta gereja, berita, dan informasi terbaru dari GKSBS Tanjung Karang.",
  alternates: { canonical: "/warta-gereja" },
};

type NewsItem = {
  id: string;
  title: string;
  narration: string;
  image_url: string | null;
  created_at: string;
};

const getNewsImage = (imageUrl: string | null) => imageUrl ?? "/community.jpg";

export default async function WartaGerejaPage() {
  const { data: news, error: newsError } = await supabaseAdmin
    .from("church_news")
    .select("id,title,narration,image_url,created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(20) as { data: NewsItem[] | null; error: { message: string } | null };
  const newsList = news ?? [];
  const likeCounts = await Promise.all(newsList.map(async (item) => {
    const { count } = await supabaseAdmin
      .from("church_news_likes")
      .select("news_id", { count: "exact", head: true })
      .eq("news_id", item.id);
    return [item.id, count ?? 0] as const;
  }));
  const likes = new Map(likeCounts);

  return (
    <>
      <section className="border-b border-[#e5e5e5] bg-white">
        <div className="container py-16">
          <p className="label-caps mb-4">Informasi Gereja</p>
          <h1 className="text-display font-black tracking-tighter leading-none">WARTA GEREJA</h1>
          <p className="mt-6 text-body-lg text-on-surface-muted max-w-xl">
            Narasi, berita, dan informasi terbaru dari GKSBS Tanjung Karang.
          </p>
        </div>
      </section>

      <section className="bg-surface py-section">
        <div className="container">
          {newsError ? (
            <div className="border border-red-200 bg-red-50 p-12 text-center text-red-800">
              <p className="text-h3 font-semibold mb-2">Warta belum dapat dimuat</p>
              <p className="text-body">Silakan coba lagi beberapa saat lagi.</p>
            </div>
          ) : newsList.length === 0 ? (
            <div className="border border-dashed border-[#e5e5e5] p-20 text-center">
              <p className="text-h3 font-semibold mb-2">Belum ada warta gereja</p>
              <p className="text-body text-on-surface-muted">Berita akan muncul saat ditambahkan oleh admin.</p>
            </div>
          ) : (
            <div className="grid gap-px bg-[#e5e5e5] border border-[#e5e5e5] md:grid-cols-2 lg:grid-cols-3">
              {newsList.map((item) => {
                const imageSrc = getNewsImage(item.image_url);

                return (
                <article key={item.id} className="bg-white overflow-hidden hover:bg-surface-low transition-colors">
                  {imageSrc ? (
                    <img src={imageSrc} alt={item.title} className="w-full h-48 object-cover grayscale" />
                  ) : (
                    <div className="w-full h-48 bg-surface-low flex items-center justify-center">
                      <span className="label-caps text-on-surface-muted">Warta Gereja</span>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="label-caps">Warta Gereja</span>
                      <span className="text-caption text-on-surface-muted">
                        {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                    <h2 className="text-h3 font-bold line-clamp-2">
                      <Link href={`/warta-gereja/${item.id}`} className="hover:underline">{item.title}</Link>
                    </h2>
                    <p className="mt-3 whitespace-pre-line text-body text-on-surface-muted leading-relaxed line-clamp-4">{item.narration}</p>
                    <Link href={`/warta-gereja/${item.id}`} className="mt-4 inline-block label-caps hover:underline">Baca selengkapnya →</Link>
                    <WartaShareLinks id={item.id} title={item.title} />
                    <WartaInteractions newsId={item.id} initialLikes={likes.get(item.id) ?? 0} />
                  </div>
                </article>
                );
              })}
            </div>
          )}
          <Link href="/" className="label-caps inline-block mt-10 text-on-surface-muted hover:text-black transition-colors">
            ← Kembali ke Beranda
          </Link>
        </div>
      </section>
    </>
  );
}