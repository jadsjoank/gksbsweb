import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { EventAttendanceCard } from "components/EventAttendanceCard";

const SITE_URL = "https://gksbstanjungkarang.org";

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  attendance_enabled: boolean | null;
  image_url: string | null;
  type: string;
  warta_url: string | null;
  liturgi_url: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Belum ditentukan";

  return new Date(value).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });
}

async function getEvent(id: string) {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("id,title,description,location,start_date,end_date,attendance_enabled,image_url,type,warta_url,liturgi_url")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load event detail:", error.message);
    return null;
  }

  return data as EventItem | null;
}

function formatMetadataDate(value: string | null) {
  if (!value) return "tanggal yang akan datang";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function createDescription(event: EventItem) {
  const date = formatMetadataDate(event.start_date);
  const location = event.location || "GKSBS Tanjungkarang, Bandar Lampung";
  const raw = `Ikuti ${event.title} pada ${date} di ${location}, bagian dari jadwal ibadah dan event gereja GKSBS Tanjungkarang, Bandar Lampung.`;
  const expanded = raw.length < 150
    ? `${raw} Informasi lengkap tersedia bagi jemaat lokal di Bandar Lampung.`
    : raw;
  return expanded.slice(0, 160).trimEnd();
}

function createEventStructuredData(event: EventItem, description: string) {
  const locationName = event.location || "GKSBS Tanjungkarang";

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.start_date,
    ...(event.end_date ? { endDate: event.end_date } : {}),
    location: {
      "@type": "Place",
      name: locationName,
      address: {
        "@type": "PostalAddress",
        streetAddress: locationName,
        addressLocality: "Bandar Lampung",
        addressRegion: "Lampung",
        addressCountry: "ID",
      },
    },
    image: [event.image_url || `${SITE_URL}/community.jpg`],
    description,
    organizer: {
      "@type": "Organization",
      name: "GKSBS Tanjungkarang",
      url: SITE_URL,
    },
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${SITE_URL}/events/${event.id}`,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return {
      title: "Event Gereja GKSBS Tanjungkarang, Bandar Lampung",
      description:
        "Informasi event gereja GKSBS Tanjungkarang dan jadwal ibadah GKSBS Bandar Lampung.",
      alternates: { canonical: `${SITE_URL}/events/${id}` },
    };
  }

  const title = `${event.title} — GKSBS Tanjungkarang, Bandar Lampung`;
  const description = createDescription(event);
  const url = `${SITE_URL}/events/${event.id}`;
  const image = event.image_url || `${SITE_URL}/community.jpg`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "GKSBS Tanjungkarang",
      locale: "id_ID",
      images: [{ url: image, alt: `${event.title} GKSBS Tanjungkarang` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) notFound();

  const description =
    event.description?.trim() ||
    `${event.title} diselenggarakan oleh GKSBS Tanjungkarang untuk jemaat dan masyarakat di Bandar Lampung.`;

  return (
    <section className="bg-surface py-section">
      <div className="container max-w-5xl">
        <Link
          href="/events"
          className="label-caps text-on-surface-muted transition-colors hover:text-black"
        >
          ← Semua Jadwal Ibadah GKSBS
        </Link>

        <article className="mt-8 overflow-hidden border border-[#e5e5e5] bg-white">
          {event.image_url && (
            <Image
              src={event.image_url}
              alt={`${event.title} GKSBS Tanjungkarang`}
              width={1600}
              height={900}
              className="max-h-[520px] w-full object-cover"
            />
          )}

          <div className="p-6 md:p-12">
            <p className="label-caps text-on-surface-muted mb-5">
              {event.type.replaceAll("_", " ")}
            </p>
            <h1 className="text-display font-black tracking-tighter leading-none">
              {event.title}
            </h1>

            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(createEventStructuredData(event, description)),
              }}
            />

            <div className="mt-8 grid gap-px border border-[#e5e5e5] bg-[#e5e5e5] md:grid-cols-2">
              <div className="bg-surface-low p-5">
                <p className="label-caps mb-2">Mulai</p>
                <p className="text-body">{formatDate(event.start_date)}</p>
              </div>
              <div className="bg-surface-low p-5">
                <p className="label-caps mb-2">Selesai</p>
                <p className="text-body">{formatDate(event.end_date)}</p>
              </div>
              <div className="bg-surface-low p-5 md:col-span-2">
                <p className="label-caps mb-2">Lokasi</p>
                <p className="text-body">{event.location || "GKSBS Tanjungkarang, Bandar Lampung"}</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-h3 font-bold">Tentang {event.title}</h2>
              <p className="mt-4 whitespace-pre-line text-body-lg leading-relaxed text-on-surface-muted">
                {description}
              </p>
            </div>

            {(event.warta_url || event.liturgi_url) && (
              <div className="mt-8 border border-[#e5e5e5] p-5">
                <h2 className="label-caps mb-4">Dokumen Ibadah</h2>
                <div className="flex flex-wrap gap-3">
                  {event.warta_url && (
                    <a
                      href={event.warta_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-black px-4 py-2 text-body-sm font-semibold transition-colors hover:bg-black hover:text-white"
                    >
                      Warta Jemaat
                    </a>
                  )}
                  {event.liturgi_url && (
                    <a
                      href={event.liturgi_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-black px-4 py-2 text-body-sm font-semibold transition-colors hover:bg-black hover:text-white"
                    >
                      Liturgi Ibadah
                    </a>
                  )}
                </div>
              </div>
            )}

            {event.attendance_enabled && (
              <div className="mt-8 border-t border-[#e5e5e5] pt-8">
                <h2 className="text-h3 font-bold">Presensi Kehadiran</h2>
                <p className="mt-2 mb-5 text-body-sm text-on-surface-muted">
                  Catat kehadiran Anda pada event GKSBS Tanjungkarang ini saat jendela presensi aktif.
                </p>
                <EventAttendanceCard event={event} />
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
