import Link from "next/link";

const links = [
  { label: "Tentang", href: "/about" },
  { label: "Acara", href: "/events" },
  { label: "Pelayanan", href: "/ministries" },
  { label: "Kolekte", href: "/donate" },
  { label: "Kontak", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <p className="text-h2 font-black tracking-tighter text-black leading-none">GKSBS</p>
          <p className="mt-3 text-body-sm text-on-surface-muted leading-relaxed max-w-xs">
            Gereja Kristen Sumatera Bagian Selatan — Tanjung Karang.
          </p>
        </div>

        <div>
          <p className="label-caps mb-4">Navigasi</p>
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-body-sm text-on-surface-muted hover:text-black transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="label-caps mb-4">Kontak</p>
          <p className="text-body-sm text-on-surface-muted">Jl. Sutan Syahrir No.27</p>
          <p className="text-body-sm text-on-surface-muted">Pahoman,Teluk Betung Utara, Lampung</p>
          <p className="text-body-sm text-on-surface-muted mt-2">info@gksbstanjungkarang.org</p>
        </div>
      </div>

      <div className="border-t border white">
        <div className="container py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-caption text-on-surface-muted">© {new Date().getFullYear()} GKSBS Tanjung Karang</p>
          <div className="flex gap-6">
            <Link href="#" className="text-caption text-on-surface-muted hover:text-black transition-colors">Privacy</Link>
            <Link href="#" className="text-caption text-on-surface-muted hover:text-black transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
