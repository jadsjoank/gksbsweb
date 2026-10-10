import Link from "next/link";
import { ROLE_LABELS, type Role } from "lib/roles";

type PortalLink = { href: string; label: string; description: string };

const portalLinks: Record<Exclude<Role, "Guest" | "User" | "Admin">, PortalLink[]> = {
  Penulis: [
    { href: "/warta-gereja", label: "Warta Gereja", description: "Baca dan kelola alur publikasi warta gereja." },
    { href: "/news", label: "Berita Gereja", description: "Lihat berita yang sudah terbit sebagai referensi tulisan." },
    { href: "/admin/warta-gereja", label: "Ruang Redaksi", description: "Buka formulir dan daftar konten editorial." },
  ],
  Seller: [
    { href: "/ecommerce", label: "Katalog Toko", description: "Pantau produk dan pengalaman belanja jemaat." },
    { href: "/admin/ecommerce", label: "Kelola Produk", description: "Kelola katalog, stok, dan informasi produk." },
    { href: "/admin/ecommerce", label: "Unggah Produk", description: "Siapkan aset produk baru untuk katalog." },
  ],
  Bendahara: [
    { href: "/admin/donations", label: "Kolekte", description: "Pantau pemasukan kolekte dan dukungan jemaat." },
    { href: "/donations", label: "Riwayat Donasi", description: "Lihat alur riwayat donasi dari sisi jemaat." },
    { href: "/admin/dashboard", label: "Laporan", description: "Buka ringkasan laporan operasional gereja." },
  ],
};

export default function RolePortal({ role }: { role: Exclude<Role, "Guest" | "User" | "Admin"> }) {
  const links = portalLinks[role];
  return (
    <div className="page-shell">
      <section className="page-hero page-hero-compact">
        <div className="container relative z-10">
          <p className="label-caps text-white/60">Portal Pelayanan</p>
          <h1 className="text-display text-white mt-4">{ROLE_LABELS[role]}</h1>
          <p className="text-body-lg text-white/70 mt-5 max-w-xl">
            Semua pintasan kerja {ROLE_LABELS[role].toLowerCase()} dalam satu tempat.
          </p>
        </div>
      </section>
      <section className="bg-surface py-section">
        <div className="container">
          <div className="portal-grid">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="portal-link">
                <span className="label-caps">{ROLE_LABELS[role]}</span>
                <h2 className="text-h3 mt-4">{link.label}</h2>
                <p className="text-body text-on-surface-muted mt-3">{link.description}</p>
                <span className="portal-link-arrow" aria-hidden="true">-&gt;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
