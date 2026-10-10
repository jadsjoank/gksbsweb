"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { useAuthStore } from "lib/store/useAuthStore";

const adminLinks = [
  { href: "/admin/dashboard",  label: "Dashboard"  },
  { href: "/admin/events",     label: "Events"     },
  { href: "/admin/warta-gereja", label: "Warta Gereja" },
  { href: "/admin/contact",    label: "Pesan Masuk" },
  { href: "/admin/ecommerce", label: "E-commerce" },
  { href: "/admin/users",      label: "Jemaat"     },
  { href: "/admin/attendance", label: "Kehadiran"  },
  { href: "/admin/donations",  label: "Kolekte"     },
  { href: "/admin/volunteer",  label: "Volunteer"  },
  { href: "/admin/ministries", label: "Profil Pelayanan" },
  { href: "/admin/settings",   label: "Pengaturan" },
];

const specialistLinks: Record<string, string[]> = {
  Penulis: ["/admin/warta-gereja"],
  Seller: ["/admin/ecommerce"],
  Bendahara: ["/admin/donations"],
};

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);
  const visibleLinks = role && specialistLinks[role]
    ? adminLinks.filter((link) => specialistLinks[role].includes(link.href))
    : adminLinks;
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 border-b border-[#e5e5e5] flex items-center justify-between">
        <div>
          <p className="label-caps">Admin Portal</p>
          <p className="text-caption text-on-surface-muted mt-0.5">GKSBS Management</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-on-surface-muted hover:text-black" aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {visibleLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center px-6 py-3 text-body-sm font-medium transition-colors ${
                active
                  ? "bg-black text-white font-semibold"
                  : "text-on-surface-muted hover:bg-surface-low hover:text-black"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#e5e5e5] p-4">
        <Link href="/dashboard" onClick={onClose}
          className="block px-2 py-2 text-body-sm text-on-surface-muted hover:text-black transition-colors">
          ← Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}

export function AdminLayout({
  title, description, children,
}: { title: string; description: string; children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#e5e5e5] fixed top-16 bottom-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-2xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64">
        {/* Page header */}
        <div className="border-b border-[#e5e5e5] bg-white px-4 md:px-8 py-4 md:py-6 flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-on-surface-muted hover:text-black -ml-1"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="label-caps text-on-surface-muted mb-0.5 hidden sm:block">Admin / {title}</p>
            <h1 className="text-h3 font-black tracking-tighter truncate">{title}</h1>
            {description && (
              <p className="text-body-sm text-on-surface-muted mt-0.5 hidden sm:block truncate max-w-xl">{description}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
