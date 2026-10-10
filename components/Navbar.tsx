"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "lib/supabase/client";
import { useAuthStore } from "lib/store/useAuthStore";
import { ROLE_HOME, ROLE_LABELS, type Role } from "lib/roles";
import { ChevronDown } from "lucide-react";

const navItems = [
  { href: "/",           label: "Beranda" },
  { href: "/about",      label: "Tentang" },
  { href: "/events",     label: "Acara" },
  //{ href: "/warta-gereja", label: "Warta Gereja" },
  //{ href: "/donate",     label: "Kolekte" },
  { href: "/contact",    label: "Contact" },
  { href: "/ecommerce",  label: "Pasaria" },
];

const ministryItems = [
  { href: "/ministries", label: "Open Recruitment" },
  { href: "/ministries/kemajelisan", label: "Kemajelisan" },
  { href: "/ministries/digtive", label: "DIGTIVE" },
  { href: "/ministries/pendeta", label: "Pendeta" },
];

export function Navbar() {
  const pathname  = usePathname();
  const { user, setUser, signOut } = useAuthStore();
  const [loading, setLoading]       = useState(true);
  const [open, setOpen]             = useState(false);
  const [ministryOpen, setMinistryOpen] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const ministryDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
      if (ministryDropRef.current && !ministryDropRef.current.contains(e.target as Node)) setMinistryOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  useEffect(() => { setOpen(false); setMinistryOpen(false); setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    let syncVersion = 0;
    let profileRequest: AbortController | null = null;

    const syncSession = async (session: { user: { id: string; email?: string | null } } | null) => {
      const version = ++syncVersion;
      profileRequest?.abort();
      profileRequest = null;

      if (!session) {
        if (active) {
          signOut();
          setLoading(false);
        }
        return;
      }

      const controller = new AbortController();
      profileRequest = controller;
      let role = "User";

      try {
        const response = await fetch("/api/profile", { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          role = data.profile?.role || "User";
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }

      if (!active || version !== syncVersion || controller.signal.aborted) return;
      setUser({ id: session.user.id, email: session.user.email ?? "", role: role as Role });
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    return () => {
      active = false;
      profileRequest?.abort();
      subscription.unsubscribe();
    };
  }, [setUser, signOut]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    signOut();
    window.location.href = "/";
  };

  if (pathname === "/admin/verify-otp") return null;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#e5e5e5]">
      <div className="container-nav flex items-center justify-between h-16">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="GKSBS Logo"
            width={40}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
          <span className="text-h3 font-black tracking-tighter text-black leading-none hidden sm:block">
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-label font-semibold uppercase tracking-wider transition-colors ${
                  active
                    ? "text-black border-b-2 border-black pb-0.5"
                    : "text-on-surface-muted hover:text-black"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="relative" ref={ministryDropRef}>
            <button
              onClick={() => { setMinistryOpen((p) => !p); setOpen(false); }}
              className={`flex items-center gap-1 text-label font-semibold uppercase tracking-wider transition-colors ${
                pathname.startsWith("/ministries") ? "text-black border-b-2 border-black pb-0.5" : "text-on-surface-muted hover:text-black"
              }`}
              aria-expanded={ministryOpen}
              aria-haspopup="menu"
            >
              Pelayanan
              <ChevronDown size={15} aria-hidden="true" className={`transition-transform ${ministryOpen ? "rotate-180" : ""}`} />
            </button>
            {ministryOpen && (
              <div className="absolute left-0 top-full mt-3 w-56 border border-[#e5e5e5] bg-white py-1 shadow-lg" role="menu">
                {ministryItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className="block px-4 py-3 text-body-sm font-semibold hover:bg-surface-low transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-9 bg-surface-container animate-pulse" />
          ) : user ? (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => { setOpen((p) => !p); setMinistryOpen(false); }}
                className="h-10 w-10 bg-black text-white font-bold text-sm flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="Profile menu"
              >
                {(user.email || "?")[0].toUpperCase()}
              </button>
              {open && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-[#e5e5e5] shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-[#e5e5e5]">
                    <p className="text-body-sm font-semibold truncate">{user.email}</p>
                    <p className="text-caption text-on-surface-muted mt-0.5 uppercase tracking-wider">
                      {ROLE_LABELS[user.role]}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link href={user.role === "Guest" ? "/dashboard" : ROLE_HOME[user.role]} className="block px-4 py-2.5 text-body-sm hover:bg-surface-low transition-colors">Dashboard</Link>
                    <Link href="/profile"      className="block px-4 py-2.5 text-body-sm hover:bg-surface-low transition-colors">Profile</Link>
                    <Link href="/settings"     className="block px-4 py-2.5 text-body-sm hover:bg-surface-low transition-colors">Settings</Link>
                    {user.role !== "User" && user.role !== "Guest" && (
                      <Link href={ROLE_HOME[user.role]} className="block px-4 py-2.5 text-body-sm font-semibold hover:bg-surface-low transition-colors">
                        Portal {ROLE_LABELS[user.role]}
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-[#e5e5e5] py-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-body-sm text-error hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login"    className="hidden sm:block text-label uppercase tracking-wider font-semibold text-on-surface-muted hover:text-black transition-colors px-3 py-2">
                Login
              </Link>
              <Link href="/register" className="btn-primary text-label py-2 px-5">
                Register
              </Link>
            </>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="md:hidden p-2 text-black"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              {menuOpen
                ? <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                : <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#e5e5e5] bg-white">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-6 py-3 text-body-sm font-semibold uppercase tracking-wider border-b border-[#e5e5e5] hover:bg-surface-low transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <div className="border-b border-[#e5e5e5]">
            <button
              onClick={() => { setMinistryOpen((p) => !p); setOpen(false); }}
              className="flex w-full items-center justify-between px-6 py-3 text-body-sm font-semibold uppercase tracking-wider hover:bg-surface-low transition-colors"
              aria-expanded={ministryOpen}
            >
              Pelayanan
              <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${ministryOpen ? "rotate-180" : ""}`} />
            </button>
            {ministryOpen && (
              <div className="bg-surface-low">
                {ministryItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block border-t border-[#e5e5e5] px-10 py-3 text-body-sm font-semibold"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {!user && (
            <div className="flex gap-3 px-6 py-4">
              <Link href="/login"    className="btn-secondary flex-1 text-center py-2.5">Login</Link>
              <Link href="/register" className="btn-primary flex-1 text-center py-2.5">Register</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
