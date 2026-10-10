import Link from "next/link";

interface SidebarProps {
  title: string;
  links: Array<{ href: string; label: string }>;
}

export function Sidebar({ title, links }: SidebarProps) {
  return (
    <aside className="rounded-3xl border border-gksbs-border bg-white p-6 shadow-sm shadow-slate-200">
      <div className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-gksbs-brown-medium">{title}</div>
      <div className="space-y-3 text-sm">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="block rounded-2xl px-4 py-3 text-gksbs-brown-medium transition hover:bg-gksbs-cream">
            {link.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
