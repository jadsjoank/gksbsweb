import Link from "next/link";
import { supabaseAdmin } from "lib/supabaseAdmin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pelayanan dan Volunteer | GKSBS Tanjung Karang",
  description: "Temukan kesempatan pelayanan dan volunteer di GKSBS Tanjung Karang sesuai talenta dan panggilan Anda.",
  alternates: { canonical: "/ministries" },
};

type VolunteerPosition = {
  id: string; title: string; department: string;
  description: string | null; slots: number;
  is_open: boolean; image_url: string | null;
};

export default async function MinistriesPage() {
  const { data, error } = await supabaseAdmin
    .from("volunteer_positions")
    .select("id, title, department, description, slots, is_open, image_url")
    .eq("is_open", true)
    .order("department", { ascending: true });

  if (error) console.error("[MinistriesPage]", error);
  const positions: VolunteerPosition[] = data ?? [];

  const departments = [...new Set(positions.map((p) => p.department))];

  return (
    <>
      {/* ── Header ───────────────────────────────────── */}
      <section className="border-b border-[#e5e5e5] bg-white">
        <div className="container py-16">
          <h1 className="text-display font-black tracking-tighter leading-none max-w-2xl">
            OPEN<br />POSITIONS
          </h1>
          <p className="mt-6 text-body-lg text-on-surface-muted max-w-xl">
            Jadilah bagian dari pelayanan GKSBS Tanjungkarang, temukan talenta dan panggilan anda.
          </p>
        </div>
      </section>

      {/* ── Count bar ────────────────────────────────── */}
      <section className="border-b border-[#e5e5e5] bg-surface-low">
        <div className="container py-4 flex items-center justify-between">
          <p className="label-caps">{positions.length} Posisi Terbuka</p>
          <p className="label-caps">{departments.length} Departemen</p>
        </div>
      </section>

      {/* ── Grid ─────────────────────────────────────── */}
      <section className="bg-surface py-section">
        <div className="container">
          {positions.length === 0 ? (
            <div className="border border-dashed border-[#e5e5e5] p-20 text-center">
              <p className="text-h3 font-semibold mb-2">Belum ada posisi terbuka</p>
              <p className="text-body text-on-surface-muted">Periksa kembali nanti atau hubungi admin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#e5e5e5] border border-[#e5e5e5]">
              {positions.map((pos) => (
                <Link
                  key={pos.id}
                  href={`/ministries/${pos.id}`}
                  className="group bg-white p-0 flex flex-col overflow-hidden hover:bg-black transition-colors duration-200"
                >
                  {/* Image */}
                  <div className="relative w-full h-52 bg-surface-container overflow-hidden flex-shrink-0">
                    {pos.image_url ? (
                      <img
                        src={pos.image_url}
                        alt={pos.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-container">
                        <span className="text-5xl opacity-20">✦</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-black text-white text-caption font-bold px-2 py-1 uppercase tracking-widest">
                        {pos.department}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="bg-white text-black text-caption font-bold px-2 py-1 uppercase tracking-widest">
                        Open
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-h3 font-bold mb-3 group-hover:text-white transition-colors">
                      {pos.title}
                    </h3>
                    {pos.description && (
                      <p className="text-body text-on-surface-muted group-hover:text-white/60 line-clamp-2 mb-4 transition-colors">
                        {pos.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <span className="label-caps text-on-surface-muted group-hover:text-white/50 transition-colors">
                        Kuota: {pos.slots} orang
                      </span>
                      <span className="label-caps group-hover:text-white transition-colors group-hover:translate-x-1 inline-block duration-200">
                        Daftar →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="bg-black py-section">
        <div className="container text-center">
          <p className="label-caps text-white/40 mb-6">Pertanyaan?</p>
          <h2 className="text-h1 text-white tracking-tighter mb-8">
            Belum menemukan<br />posisi yang tepat?
          </h2>
          <Link href="/contact" className="btn-primary bg-white text-black">
            Hubungi Kami
          </Link>
        </div>
      </section>
    </>
  );
}
