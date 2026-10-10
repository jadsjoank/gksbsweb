import { supabaseAdmin } from "lib/supabaseAdmin";
import { EventAttendanceCard } from "components/EventAttendanceCard";
import Image from "next/image";
import type { Metadata } from "next";

const SITE_URL = "https://gksbstanjungkarang.org";
const EVENTS_URL = `${SITE_URL}/events`;
const EVENTS_DESCRIPTION =
  "Temukan jadwal ibadah GKSBS Bandar Lampung, event gereja GKSBS, dan kegiatan jemaat GKSBS Tanjungkarang terbaru di gereja GKSBS kami. Untuk jemaat lokal.";

export function generateMetadata(): Metadata {
  return {
    title: "Jadwal Ibadah dan Event Gereja GKSBS Tanjungkarang, Bandar Lampung",
    description: EVENTS_DESCRIPTION,
    alternates: { canonical: EVENTS_URL },
    openGraph: {
      title: "Jadwal Ibadah dan Event Gereja GKSBS Tanjungkarang, Bandar Lampung",
      description: EVENTS_DESCRIPTION,
      url: EVENTS_URL,
      type: "website",
      siteName: "GKSBS Tanjungkarang",
      locale: "id_ID",
      images: [
        {
          url: `${SITE_URL}/hero-bg.jpg`,
          width: 2304,
          height: 1536,
          alt: "Jadwal ibadah dan event gereja GKSBS Tanjungkarang",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Jadwal Ibadah dan Event Gereja GKSBS Tanjungkarang",
      description: EVENTS_DESCRIPTION,
      images: [`${SITE_URL}/hero-bg.jpg`],
    },
  };
}

type EventItem = {
  id: string; title: string; description: string | null;
  theme?: string | null; speaker?: string | null;
  location: string | null; start_date: string; end_date: string | null;
  attendance_enabled: boolean | null; image_url: string | null;
  type: string;
  warta_url: string | null; liturgi_url: string | null;
};

function extractEventMeta(description: string | null) {
  const text = description ?? "";
  const themeMatch = text.match(/(?:Tema|tema)\s*[:\-]\s*([^|\n]+)/i);
  const speakerMatch = text.match(/(?:Pembawa Firman|Pembawa firman|Speaker|speaker)\s*[:\-]\s*([^|\n]+)/i);

  return {
    theme: themeMatch?.[1]?.trim() ?? null,
    speaker: speakerMatch?.[1]?.trim() ?? null,
  };
}

function isRecurringWeekly(description: string | null) {
  return /recurring_weekly\s*:\s*(true|1|yes)/i.test(description ?? "");
}

function buildRecurringEventList(events: EventItem[]) {
  const now = Date.now();
  const generated: Array<EventItem & { occurrenceIndex: number; recurringLabel?: string }> = [];

  events.forEach((event) => {
    const baseStart = new Date(event.start_date);
    const baseEnd = event.end_date ? new Date(event.end_date) : null;
    const durationMs = baseEnd && !Number.isNaN(baseStart.getTime()) ? Math.max(baseEnd.getTime() - baseStart.getTime(), 0) : 0;

    if (!isRecurringWeekly(event.description)) {
      const eventEnd = baseEnd?.getTime() ?? baseStart.getTime();
      if (eventEnd >= now) {
        generated.push({ ...event, occurrenceIndex: 0, recurringLabel: undefined });
      }
      return;
    }

    const maxOccurrences = 12;
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const firstIndex = Math.max(0, Math.ceil((now - baseStart.getTime()) / weekMs));
    for (let offset = 0; offset < maxOccurrences; offset += 1) {
      const i = firstIndex + offset;
      const occurrenceStart = new Date(baseStart.getTime() + i * weekMs);

      const occurrenceEnd = baseEnd ? new Date(occurrenceStart.getTime() + durationMs) : null;
      generated.push({
        ...event,
        start_date: occurrenceStart.toISOString(),
        end_date: occurrenceEnd ? occurrenceEnd.toISOString() : null,
        occurrenceIndex: i,
        recurringLabel: i === 0 ? "Jadwal utama" : `Minggu ke-${i + 1}`,
      });
    }
  });

  return generated.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
}

function fmt(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: "Asia/Jakarta",
  });
}

const typeLabel: Record<string, string> = {
  ibadah_minggu: "Ibadah Minggu", ibadah_rabu: "Ibadah Rabu",
  ibadah_pemuda: "Ibadah Pemuda", ibadah_anak: "Ibadah Anak",
  persekutuan: "Persekutuan", lainnya: "Lainnya",
};

export default async function EventsPage() {
  const { data: events, error } = await supabaseAdmin
    .from("events")
    .select("id,title,description,location,start_date,end_date,attendance_enabled,image_url,type,warta_url,liturgi_url")
    .eq("is_active", true)
    .order("start_date", { ascending: true }) as { data: EventItem[] | null; error: unknown };

  const eventList = error || !events ? [] : buildRecurringEventList(events);

  return (
    <>
      {/* ── Header ───────────────────────────────────── */}
      <section className="border-b border-[#e5e5e5] bg-white">
        <div className="container py-16">
          <p className="label-caps mb-4">Jadwal & Kegiatan</p>
          <h1 className="text-display font-black tracking-tighter leading-none">
            JADWAL IBADAH GKSBS BANDAR LAMPUNG
          </h1>
          <p className="mt-6 text-body-lg text-on-surface-muted max-w-xl">
            Lihat jadwal ibadah GKSBS Bandar Lampung, event gereja GKSBS, dan kegiatan jemaat di
            Gereja GKSBS Tanjungkarang.
          </p>
        </div>
      </section>

      {/* ── Count bar ────────────────────────────────── */}
      <section className="border-b border-[#e5e5e5] bg-surface-low">
        <div className="container py-4">
          <p className="label-caps">{eventList.length} Acara Mendatang</p>
        </div>
      </section>

      {/* ── Events ───────────────────────────────────── */}
      <section className="bg-surface py-section">
        <div className="container">
          {eventList.length === 0 ? (
            <div className="border border-dashed border-[#e5e5e5] p-20 text-center">
              <p className="text-h3 font-semibold mb-2">Belum ada acara mendatang</p>
              <p className="text-body text-on-surface-muted">Jadwal akan muncul saat ditambahkan oleh admin.</p>
            </div>
          ) : (
            <div className="grid gap-px bg-[#e5e5e5] border border-[#e5e5e5] lg:grid-cols-2">
              {eventList.map((event) => {
                const d = new Date(event.start_date);
                const hasDocuments = event.warta_url || event.liturgi_url;
                const theme = event.theme ?? extractEventMeta(event.description).theme;
                const speaker = event.speaker ?? extractEventMeta(event.description).speaker;
                return (
                  <article key={`${event.id}-${event.occurrenceIndex}-${event.start_date}`} className="bg-white p-8 hover:bg-surface-low transition-colors">
                    {/* Date badge + title */}
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="border border-[#e5e5e5] p-4 text-center min-w-[64px] flex-shrink-0">
                        <p className="text-caption font-bold uppercase tracking-widest text-on-surface-muted">
                          {d.toLocaleString("id-ID", { month: "short", timeZone: "Asia/Jakarta" })}
                        </p>
                        <p className="text-h2 font-black leading-none mt-0.5">
                          {d.toLocaleString("id-ID", { day: "2-digit", timeZone: "Asia/Jakarta" })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="label-caps text-on-surface-muted mb-1 truncate">{event.location ?? "—"}</p>
                        <h2 className="text-h3 font-bold">{event.title}</h2>
                        {event.recurringLabel && (
                          <span className="mt-2 inline-block bg-amber-100 text-amber-800 text-caption font-bold px-2 py-0.5 uppercase tracking-widest">
                            {event.recurringLabel}
                          </span>
                        )}
                        {event.attendance_enabled && (
                          <span className="mt-2 inline-block bg-black text-white text-caption font-bold px-2 py-0.5 uppercase tracking-widest">
                            Attendance Aktif
                          </span>
                        )}
                      </div>
                    </div>

                    {event.image_url && (
                      <Image
                        src={event.image_url}
                        alt={`${event.title} GKSBS Tanjungkarang`}
                        width={1200}
                        height={675}
                        className="mb-6 h-48 w-full object-cover grayscale"
                      />
                    )}

                    {(theme || speaker) && (
                      <div className="mb-6 grid gap-2 rounded-none border border-[#e5e5e5] bg-surface-low p-4 text-sm text-on-surface-muted md:grid-cols-2">
                        {theme && (
                          <div>
                            <p className="label-caps mb-1 text-on-surface-muted">Tema</p>
                            <p className="text-body-sm text-on-surface">{theme}</p>
                          </div>
                        )}
                        {speaker && (
                          <div>
                            <p className="label-caps mb-1 text-on-surface-muted">Pembawa Firman</p>
                            <p className="text-body-sm text-on-surface">{speaker}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Date/time grid */}
                    <div className="grid grid-cols-2 gap-px bg-[#e5e5e5] border border-[#e5e5e5] mb-6">
                      <div className="bg-surface-low p-4">
                        <p className="label-caps mb-1">Mulai</p>
                        <p className="text-body-sm">{fmt(event.start_date)}</p>
                      </div>
                      <div className="bg-surface-low p-4">
                        <p className="label-caps mb-1">Selesai</p>
                        <p className="text-body-sm">{fmt(event.end_date)}</p>
                      </div>
                    </div>

                    {/* Warta & Liturgi download section */}
                    {hasDocuments && (
                      <div className="border border-[#e5e5e5] p-4 mb-6">
                        <p className="label-caps mb-3">Dokumen Ibadah</p>
                        <div className="flex flex-wrap gap-3">
                          {event.warta_url && (
                            <a
                              href={event.warta_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 border border-black px-4 py-2 text-body-sm font-semibold hover:bg-black hover:text-white transition-colors"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="12" y1="18" x2="12" y2="12"/>
                                <line x1="9" y1="15" x2="15" y2="15"/>
                              </svg>
                              Warta Jemaat
                            </a>
                          )}
                          {event.liturgi_url && (
                            <a
                              href={event.liturgi_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 border border-black px-4 py-2 text-body-sm font-semibold hover:bg-black hover:text-white transition-colors"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="12" y1="18" x2="12" y2="12"/>
                                <line x1="9" y1="15" x2="15" y2="15"/>
                              </svg>
                              Liturgi Ibadah
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <EventAttendanceCard event={event} />
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
