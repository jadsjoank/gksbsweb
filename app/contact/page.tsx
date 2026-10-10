import { ContactForm } from "./ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontak GKSBS Tanjung Karang",
  description: "Hubungi GKSBS Tanjung Karang untuk pertanyaan, permintaan doa, dan informasi pelayanan gereja.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      {/* ── Header ───────────────────────────────────── */}
      <section className="border-b border-[#e5e5e5] bg-white">
        <div className="container py-16">
          <h1 className="text-display font-black tracking-tighter leading-none">Kontak</h1>
          <p className="mt-6 text-body-lg text-on-surface-muted max-w-xl">
            Kirim pesan, pertanyaan, atau permintaan doa. Tim kami akan merespons secepatnya.
          </p>
        </div>
      </section>

      <section className="bg-surface py-section">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[#e5e5e5] border border-[#e5e5e5]">
            {/* Info */}
            <div className="bg-white p-12 space-y-12">
              <div>
                <p className="label-caps mb-4">Alamat</p>
                <p className="text-h3 font-semibold">Jl. Sutan Syahrir No.27</p>
                <p className="text-body text-on-surface-muted mt-1">Pahoman, Teluk Betung Utara, Lampung</p>
              </div>
              <div>
                <p className="label-caps mb-4">Telepon</p>
                <p className="text-h3 font-semibold">0821-8457-1705</p>
                <p className="text-body text-on-surface-muted mt-1">Senin–Sabtu: 08.00–16.00 WIB</p>
              </div>
              <div>
                <p className="label-caps mb-4">Email</p>
                <a href="mailto:info@gksbstanjungkarang.org" className="text-h3 font-semibold hover:underline">
                  info@gksbstanjungkarang.org
                </a>
                <p className="text-body text-on-surface-muted mt-1">Respon dalam 24 jam kerja</p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-black p-12">
              <p className="label-caps text-white/40 mb-4">Kirim Pesan</p>
              <h2 className="text-h2 text-white font-bold tracking-tight mb-8">Pesan ke Admin</h2>
              <ContactForm dark />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
