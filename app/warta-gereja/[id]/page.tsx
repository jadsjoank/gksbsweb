import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "lib/supabaseAdmin";
import WartaInteractions from "components/WartaInteractions";
import WartaShareLinks from "components/WartaShareLinks";

type NewsItem = {
  id: string;
  title: string;
  narration: string;
  image_url: string | null;
  created_at: string;
};

const descriptionLength = 160;
const siteUrl = "https://gksbstanjungkarang.org";

async function getNews(id: string) {
  const { data, error } = await supabaseAdmin
    .from("church_news")
    .select("id,title,narration,image_url,created_at")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("[WartaDetailPage] Failed to load article:", error.message);
    throw new Error("Failed to load church news.");
  }

  return data as NewsItem | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const news = await getNews(id);
  if (!news) return { title: "Warta Gereja | GKSBS" };

  return {
    title: `${news.title} | Warta Gereja GKSBS`,
    description: news.narration.slice(0, descriptionLength),
    alternates: {
      canonical: `${siteUrl}/warta-gereja/${news.id}`,
    },
    openGraph: {
      title: news.title,
      description: news.narration.slice(0, descriptionLength),
      url: `${siteUrl}/warta-gereja/${news.id}`,
      type: "article",
      publishedTime: news.created_at,
      images: news.image_url ? [{ url: news.image_url, alt: news.title }] : [{ url: "/community.jpg", alt: "Warta Gereja GKSBS" }],
    },
    twitter: {
      card: "summary_large_image",
      title: news.title,
      description: news.narration.slice(0, descriptionLength),
      images: [news.image_url ?? "/community.jpg"],
    },
  };
}

export default async function WartaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const news = await getNews(id);
  if (!news) notFound();

  const { count } = await supabaseAdmin
    .from("church_news_likes")
    .select("news_id", { count: "exact", head: true })
    .eq("news_id", news.id);

  const coverImage = news.image_url ?? "/community.jpg";

  return (
    <section className="bg-surface py-section">
      <div className="container max-w-4xl">
        <Link href="/warta-gereja" className="label-caps text-on-surface-muted hover:text-black">← Semua Warta</Link>
        <article className="mt-8 overflow-hidden border border-[#e5e5e5] bg-white">
          <img src={coverImage} alt={news.title} className="max-h-[520px] w-full object-cover" />
          <div className="p-6 md:p-12">
            <p className="label-caps text-on-surface-muted mb-5">
              {new Date(news.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="text-display font-black tracking-tighter leading-none">{news.title}</h1>
            <p className="mt-8 whitespace-pre-line text-body-lg leading-relaxed text-on-surface-muted">{news.narration}</p>
            <WartaShareLinks id={news.id} title={news.title} />
            <WartaInteractions newsId={news.id} initialLikes={count ?? 0} />
          </div>
        </article>
      </div>
    </section>
  );
}
