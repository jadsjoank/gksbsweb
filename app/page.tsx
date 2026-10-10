import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "lib/supabaseAdmin";
import EventCountdown from "components/EventCountdown";
import ChurchNewsCarousel from "components/ChurchNewsCarousel";


export const dynamic = "force-dynamic";
export const revalidate = 0;

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "GKSBS Tanjungkarang",
  url: "https://gksbstanjungkarang.org",
  logo: "https://gksbstanjungkarang.org/logo.png",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Jl. Sutan Syahrir No.27",
    addressLocality: "Bandar Lampung",
    addressRegion: "Lampung",
    addressCountry: "ID",
  },
};

type EventItem = {
  id: string; title: string; description: string | null;
  start_date: string; location: string | null; type: string;
};

const typeLabel: Record<string, string> = {
  ibadah_minggu: "Ibadah Minggu", ibadah_rabu: "Ibadah Rabu",
  ibadah_pemuda: "Ibadah Pemuda", ibadah_anak: "Ibadah Anak",
  persekutuan: "Persekutuan", lainnya: "Lainnya",
};

export default async function HomePage() {
  const now = new Date().toISOString();
  const { data: events } = await supabaseAdmin
    .from("events")
    .select("id, title, description, start_date, location, type")
    .eq("is_active", true)
    .or(`end_date.gte.${now},and(end_date.is.null,start_date.gte.${now})`)
    .order("start_date", { ascending: true })
    .limit(3) as { data: EventItem[] | null };

  const upcomingEvents = events ?? [];
  const nextEvent      = upcomingEvents[0] ?? null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData),
        }}
      />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="page-hero flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        <div className="hero-gradient absolute inset-0" />

        {/* Hero text */}
        <div className="container relative z-10 py-24">
          <h1 className="text-display text-white leading-none tracking-tighter max-w-3xl">
            GEREJA GKSBS<br />TANJUNGKARANG
          </h1>
          <p className="mt-8 text-body-lg text-white/70 max-w-lg">
            Gereja GKSBS Tanjungkarang di Bandar Lampung untuk jadwal ibadah, event gereja GKSBS,
            kolekte, presensi, dan pelayanan komunitas jemaat.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/events"     className="btn-primary">Lihat Jadwal</Link>
            <Link href="/ministries" className="btn-secondary border-white text-white hover:bg-white/10">Bergabung</Link>
          </div>
        </div>

        {/* Countdown bar — pinned at bottom of hero */}
        {nextEvent && (
          <div className="absolute bottom-0 left-0 right-0 z-10 border-white/10">
            <EventCountdown
              targetDate={nextEvent.start_date}
              eventTitle={nextEvent.title}
              eventLocation={nextEvent.location}
            />
          </div>
        )}
      </section>

      {/* ── Upcoming Events ──────────────────────────── */}
      <section className="bg-surface py-section">
        <div className="container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="label-caps mb-3">Kegiatan Mendatang</p>
              <h2 className="text-h1 tracking-tighter">Event Gereja GKSBS<br />Tanjungkarang</h2>
            </div>
            <Link href="/events" className="label-caps text-on-surface-muted hover:text-black border-b border-current pb-0.5 transition-colors">
              View all →
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="border border-dashed border-[#e5e5e5] p-16 text-center">
              <p className="text-body text-on-surface-muted">Belum ada event mendatang.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#e5e5e5] border border-[#e5e5e5]">
              {upcomingEvents.slice(0, 2).map((event) => {
                const d = new Date(event.start_date);
                return (
                  <div key={event.id} className="group bg-white p-8 hover:bg-black hover:text-white transition-colors cursor-pointer">
                    <p className="label-caps text-on-surface-muted group-hover:text-white/60 mb-6">
                      {d.toLocaleString("id-ID", { month: "short", day: "numeric", timeZone: "Asia/Jakarta" }).toUpperCase()} ·{" "}
                      {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" })} WIB
                    </p>
                    <h3 className="text-h3 font-bold mb-3 group-hover:text-white">{event.title}</h3>
                    <p className="text-body text-on-surface-muted group-hover:text-white/70 line-clamp-2 mb-6">
                      {typeLabel[event.type] ?? ""}
                    </p>
                    {event.location && (
                      <p className="label-caps text-on-surface-muted group-hover:text-white/50">{event.location}</p>
                    )}
                    <div className="mt-6 flex items-center justify-between">
                      <span className="label-caps">{typeLabel[event.type] ?? "Event Gereja GKSBS"}</span>
                      <span className="text-body-sm group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
     <section className="bg-black py-section">
      {/* ── Church News ─────────────────────────────── */}
      {/* <ChurchNewsCarousel news={churchNews} /> */}

      {/* ── Community CTA ────────────────────────────── */}
      <section className="mt-4 overflow-hidden border-y border-white/10 bg-gradient-to-bl from-[#2a2119] via-black to-[#171717] md:mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div
            className="relative min-h-[390px] bg-cover bg-[center_35%] lg:min-h-[560px] lg:bg-center"
            style={{ backgroundImage: "url('/community.jpg')" }}
          >
            <div className="absolute inset-0 bg-black/35" />
          </div>
          <div className="flex items-center">
            <div className="container py-section lg:px-16">
              <div className="max-w-2xl">
                <p className="label-caps text-white/60 mb-6">Pelayanan</p>
                <h2 className="text-h1 text-white tracking-tighter mb-6">
                  Temukan Tempat<br />Pelayananmu
                </h2>
                <p className="text-body-lg text-white/70 mb-10">
                  Di GKSBS Tanjungkarang, setiap bakat punya tempat. Bergabunglah dan berikan dampak nyata bagi komunitas.
                </p>
                <Link href="/ministries" className="btn-primary bg-white text-black hover:bg-white/90">
                  Lihat Posisi Terbuka
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>

      {/* ── Donation CTA ─────────────────────────────── */}
      <section className="bg-black py-section">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="label-caps text-white/40 mb-6">Dukungan Pelayanan</p>
            <h2 className="text-h1 text-white tracking-tighter mb-6">
              Dukung Misi<br />Gereja
            </h2>
            <p className="text-body-lg text-white/60 max-w-md">
              Setiap pemberian membantu kami memperluas jangkauan kasih Tuhan melalui pelayanan dan misi sosial.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-white/20 p-6">
              <p className="text-h4 text-white font-bold mb-4 text-align:justify">Kolekte Mingguan</p>
              <Image
                src="/kolekte1.png"
                alt="Kolekte QR Code 1"
                width={400}
                height={300}
                className="w-full h-auto object-cover"
              />
              <p className="text-body text-white/60 mt-4 text-center">Persembahan Minggu</p>
              <a
                href="/kolekte1.png"
                download="kolekte-mingguan.png"
                className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Unduh QRIS
              </a>
            </div>
            <div className="border border-white/20 p-6">
              <p className="text-h4 text-white font-bold mb-4">Persembahan Sar-Pras</p>
              <Image
                src="/kolekte2.png"
                alt="Kolekte QR Code 2"
                width={400}
                height={300}
                className="w-full h-auto object-cover"
              />
              <p className="text-body text-white/60 mt-3 text-center">Persembahan Sarana dan Prasarana</p>
              <a
                href="/kolekte2.png"
                download="kolekte-sar-pras.png"
                className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Unduh QRIS
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quote ────────────────────────────────────── */}
      <section className="border-y border-[#e5e5e5] bg-white py-16 text-center">
        <div className="container">
          <p className="text-h3 font-light italic max-w-2xl mx-auto text-on-surface-muted">
            &quot;Gereja Yang Menjadi Berkat Bagi Masyarakat.&quot;
          </p>
        </div>
      </section>
    </>
  );
}