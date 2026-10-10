import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang GKSBS Tanjung Karang",
  description: "Kenali sejarah, visi, dan misi GKSBS Tanjung Karang sebagai komunitas iman yang melayani masyarakat.",
  alternates: { canonical: "/about" },
};

const misi = [
  "Meningkatkan persekutuan kategorial dan persekutuan lainnya di dalam gereja.",
  "Menemukan dan memaksimalkan karunia rohani jemaat untuk mendukung pelayanan.",
  "Meningkatkan nilai-nilai Kristiani yang berkualitas dan membangun persahabatan dengan masyarakat.",
  "Memperlengkapi jemaat untuk memberitakan injil secara verbal maupun non-verbal.",
  "Memberikan layanan yang memadai bagi masyarakat dengan meneladani Kristus.",
  "Meningkatkan layanan dalam pendidikan melalui SMPK dan layanan untuk orang-orang marginal.",
];

const sejarah = [
  { year: "1938", text: "Benih Pelayanan" },
  { year: "1952", text: "persekutuan menjadi terorganisir." },
  { year: "1953", text: "Sumbagsel menjadi wilayah gerejawi." },
  { year: "1961", text: "Tanjungkarang menjadi jemaat dewasa." },
  { year: "1981", text: "mulai berani mandiri." },
  { year: "1987", text: "GKSBS Lahir" },
  { year: "2012", text: "Rumah Bersama dirumuskan." },
  { year: "2015", text: "Gereja yang Berdiakonia." },
  { year: "2026", text: "65 tahun Tanjungkarang." },
];

export default function AboutPage() {
  return (
    <>
      {/* ── Header ───────────────────────────────────── */}
      <section className="border-b border-[#e5e5e5] bg-white">
        <div className="container py-16">
          <h1 className="text-h2 font-black tracking-tigh mt-10">
            Tentang GKSBS Tanjung Karang
          </h1>
          <p className="mt-6 text-body-lg text-on-surface-muted max-w-2xl">
            Gereja Kristen Sumatera Bagian Selatan — Tanjung Karang. Sebuah komunitas iman yang melayani dan menjadi berkat bagi masyarakat.
          </p>
        </div>
      </section>

      {/* ── Vision & Mission ─────────────────────────── */}
      <section className="bg-surface py-section">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-px bg-[#e5e5e5] border border-[#e5e5e5]">
          {/* Visi */}
          <div className="bg-white p-12">
            <p className="label-caps mb-6">Visi</p>
            <h2 className="text-h2 font-bold tracking-tight mb-6">
              Gereja Yang Menjadi Berkat Bagi Masyarakat
            </h2>
            <p className="text-body text-on-surface-muted leading-relaxed">
              Kami percaya bahwa gereja hadir bukan hanya untuk jemaatnya, tetapi untuk menjadi terang dan garam bagi seluruh masyarakat di sekitarnya — melampaui batas tembok gedung.
            </p>
          </div>

          {/* Misi */}
          <div className="bg-black text-white p-12">
            <p className="label-caps text-white/40 mb-6">Misi</p>
            <h2 className="text-h2 font-bold tracking-tight mb-8 text-white">6 Pilar Pelayanan</h2>
            <ul className="space-y-4">
              {misi.map((m, i) => (
                <li key={i} className="flex gap-4">
                  <span className="label-caps text-white/30 shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-body text-white/70 leading-relaxed">{m}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── History Timeline ─────────────────────────── */}
      <section className="bg-white p-20 border-t">
        <div className="container">
          <p className="label-caps mb-4">Sejarah</p>
          <h2 className="text-h1 font-black tracking-tighter mb-16">Perjalanan GKSBS</h2>
          <div className="relative pl-24 space-y-12">
            {sejarah.map((item) => (
              <div key={item.year} className="relative">
                <span className="absolute -left-[5.5rem] top-0 text-h3 font-black tracking-tighter w-12 text-right">
                  {item.year}
                </span>
                <div className="absolute " />
                <p className="max-w-3xl">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="bg-black py-section">
        <div className="container grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="label-caps text-white/40 mb-6">Bergabung</p>
            <h2 className="text-h1 text-white font-black tracking-tighter">Jadilah Bagian dari Komunitas Kami</h2>
          </div>
          <div className="flex flex-col gap-4">
            <Link href="/events"  className="btn-primary bg-white text-black w-full text-center">Lihat Jadwal Ibadah</Link>
            <Link href="/contact" className="btn-secondary border-white/30 text-white hover:bg-white/10 w-full text-center">Hubungi Kami</Link>
          </div>
        </div>
      </section>
    </>
  );
}
