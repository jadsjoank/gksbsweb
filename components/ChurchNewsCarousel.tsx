"use client";

import Link from "next/link";
import { useState } from "react";

type NewsItem = {
  id: string;
  title: string;
  narration: string;
  created_at: string;
  image_url: string | null;
};

const getNewsImage = (title: string, imageUrl: string | null) => {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes("digtive")) {
    return "/digtive.jpeg";
  }

  if (normalizedTitle.includes("sensus")) {
    return "/sensus.jpeg";
  }

  return imageUrl ?? "/community.jpg";
};

export default function ChurchNewsCarousel({ news }: { news: NewsItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const activeNews = news[activeIndex];

  const move = (direction: 1 | -1) => {
    setActiveIndex((current) => (current + direction + news.length) % news.length);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    setTouchStart(event.touches[0].clientX);
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStart === null) return;
    const distance = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(distance) > 50) move(distance < 0 ? 1 : -1);
    setTouchStart(null);
  };

  if (!activeNews) {
    return (
      <section className="my-4 overflow-hidden border-y border-white/10 bg-gradient-to-br from-[#171717] via-black to-[#2a2119] md:my-8">
        <div className="container py-section text-white">
          <p className="label-caps text-white/60 mb-6">Warta Gereja</p>
          <h2 className="text-h1 tracking-tighter mb-6">Warta Gereja</h2>
          <p className="text-body-lg text-white/70 mb-10">Berita dan pengumuman gereja akan ditampilkan di sini.</p>
          <Link href="/warta-gereja" className="btn-primary bg-white text-black hover:bg-white/90">Lihat Semua Warta</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="my-4 overflow-hidden border-y border-white/10 bg-gradient-to-br from-[#171717] via-black to-[#2a2119] md:my-8" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="order-1 flex items-center lg:order-1">
          <div className="container py-section lg:px-16">
            <p className="label-caps text-white/60 mb-6">Warta Gereja</p>
            <article className="max-w-2xl" aria-live="polite">
              <p className="label-caps text-white/40 mb-4">
                {new Date(activeNews.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <h2 className="text-h1 text-white tracking-tighter mb-6">{activeNews.title}</h2>
              <p className="text-body-lg text-white/70 mb-10 line-clamp-4">{activeNews.narration}</p>
              <div className="flex flex-wrap items-center gap-4">
                <Link href={`/warta-gereja/${activeNews.id}`} className="btn-primary bg-white text-black hover:bg-white/90">Baca Warta</Link>
                {news.length > 1 && (
                  <div className="flex items-center gap-2" aria-label="Navigasi warta gereja">
                    <button type="button" onClick={() => move(-1)} aria-label="Warta sebelumnya" className="border border-white/40 px-3 py-2 text-white hover:bg-white/10">←</button>
                    <span className="px-2 text-caption text-white/60">{activeIndex + 1} / {news.length}</span>
                    <button type="button" onClick={() => move(1)} aria-label="Warta berikutnya" className="border border-white/40 px-3 py-2 text-white hover:bg-white/10">→</button>
                  </div>
                )}
              </div>
              {news.length > 1 && (
                <div className="mt-6 flex gap-2" aria-label="Pilih warta">
                  {news.map((item, index) => (
                    <button key={item.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`Tampilkan warta ${index + 1}`} aria-current={index === activeIndex} className={`h-1.5 transition-all ${index === activeIndex ? "w-8 bg-white" : "w-4 bg-white/30 hover:bg-white/60"}`} />
                  ))}
                </div>
              )}
            </article>
          </div>
        </div>
        <div
          key={activeNews.id}
          className="relative order-2 min-h-[310px] bg-cover bg-center lg:order-2 lg:min-h-[500px]"
          style={{ backgroundImage: `url('${getNewsImage(activeNews.title, activeNews.image_url)}')` }}
          aria-label={`Foto ${activeNews.title}`}
        >
          <div className="absolute inset-0 bg-black/35" />
        </div>
      </div>
    </section>
  );
}
