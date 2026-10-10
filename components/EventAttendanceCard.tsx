"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "lib/store/useAuthStore";
import { QRScanner } from "components/QRScanner";

interface EventData {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  attendance_enabled: boolean | null;
}

function isAttendanceActive(event: EventData): boolean {
  const now = new Date();
  const start = new Date(event.start_date);
  const end = event.end_date
    ? new Date(event.end_date)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const graceEnd = new Date(end.getTime() + 45 * 60 * 1000);
  return now >= start && now <= graceEnd;
}

export function EventAttendanceCard({ event, isAdmin = false }: { event: EventData; isAdmin?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const [active, setActive] = useState(isAttendanceActive(event));
  const [showUserQR, setShowUserQR] = useState(false);
  const [showAdminScan, setShowAdminScan] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "suggest_login" | "suggest_register">("idle");
  const [message, setMessage] = useState("");
  const [attended, setAttended] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setActive(isAttendanceActive(event)), 30000);
    return () => clearInterval(interval);
  }, [event]);

  const refreshQrToken = async () => {
    if (!user || isAdmin) return;
    setQrLoading(true);
    try {
      const response = await fetch(`/api/attendance/qr-token?event_id=${encodeURIComponent(event.id)}`);
      const data = await response.json().catch(() => ({}));
      if (response.ok) setQrToken(data.token ?? null);
    } catch {
      setQrToken(null);
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (!user || isAdmin || !active) return;
    void refreshQrToken();
    const interval = setInterval(() => void refreshQrToken(), 75_000);
    return () => clearInterval(interval);
  }, [user, isAdmin, event.id, active]);

  // Admin scans user QR → records attendance
  const handleAdminScan = async (scannedData: string) => {
    if (status === "loading") return;

    setScanResult(scannedData);
    setStatus("loading");
    try {
      if (!scannedData.trim()) {
        setStatus("error");
        setMessage("QR jemaat tidak valid.");
        setShowAdminScan(false);
        return;
      }

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: event.id, qr_token: scannedData }),
      });
      const data = await res.json().catch(() => ({ error: "Server error" }));
      if (res.ok && data.status === "ok") {
        setStatus("success");
        setMessage("Kehadiran berhasil dicatat.");
      } else {
        setStatus("error");
        setMessage(data.error || "Gagal mencatat kehadiran.");
      }
    } catch {
      setStatus("error");
      setMessage("Gagal memproses scan.");
    }
    setShowAdminScan(false);
  };

  // Guest attendance
  const handleGuestSubmit = async () => {
    if (status === "loading") return;

    if (!guestName.trim() || !guestEmail.trim()) {
      setMessage("Nama dan email wajib diisi.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.id,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
        }),
      });
      const data = await res.json().catch(() => ({ error: "Server error" }));
      if (res.ok && data.status === "ok") {
        setStatus("success");
        setMessage("Kehadiran tamu berhasil dicatat!");
        setAttended(true);
        setShowGuestForm(false);
      } else {
        setStatus("error");
        setMessage(data.error || "Gagal mencatat kehadiran.");
      }
    } catch {
      setStatus("error");
      setMessage("Tidak dapat terhubung ke server.");
    }
  };

  if (!event.attendance_enabled) return null;

  // QR code URL for user (encodes user + event token)
  const userQRData = user && qrToken
    ? qrToken
    : null;
  const userQRUrl = userQRData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(userQRData)}`
    : null;

  return (
    <div className="mt-4 border-t border-[#e5e5e5] pt-4">
      {!active ? (
        <div className="flex items-center gap-2 text-xs text-on-surface-muted">
          <span className="h-2 w-2 rounded-full bg-[#e5e5e5]" />
          Attendance belum aktif
        </div>
      ) : attended ? (
        <div className="rounded-2xl bg-black-50 border border-black-200 p-4 text-sm text-white-800">
          Kehadiran sudah tercatat untuk event ini.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-black-700 font-medium">
            <span className="h-2 w-2 rounded-full bg-black-500 animate-pulse" />
            Attendance aktif
          </div>

          {/* Admin Mode: Scan + Event QR */}
          {isAdmin && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAdminScan(true); setShowUserQR(false); setShowGuestForm(false); }}
                  className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:opacity-80"
                >
                  Scan QR Jemaat
                </button>
              </div>

              {showAdminScan && (
                <div className="bg-surface-low border border-[#e5e5e5] p-4">
                  <p className="text-sm font-semibold text-on-surface mb-3">Scan QR Code Jemaat</p>
                  <QRScanner onScan={handleAdminScan} onError={(err) => { setStatus("error"); setMessage(err); }} />
                  {status === "success" && <p className="mt-2 text-sm text-black-700">{message}</p>}
                  {status === "error" && <p className="mt-2 text-sm text-red-600">{message}</p>}
                </div>
              )}

            </div>
          )}

          {/* User Mode */}
          {!isAdmin && user && (
            <div className="space-y-3">
              {!showUserQR ? (
                <button
                  onClick={() => setShowUserQR(true)}
                  className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-80"
                >
                  Tampilkan QR Absensi
                </button>
              ) : (
                <div className="bg-surface-low border border-[#e5e5e5] p-4 space-y-3">
                  {/* Real QR Code Display */}
                  <div className="text-center">
                    {qrLoading ? <p className="text-sm text-on-surface-muted">Memuat QR...</p> : userQRUrl && (
                      <img src={userQRUrl} alt="Attendance QR" className="mx-auto w-40 h-40 border-2 border-[#e5e5e5] bg-white p-2" />
                    )}
                    <p className="mt-2 text-xs text-on-surface-muted">{user.email}</p>
                  </div>
                  {status === "error" && <p className="text-xs text-red-600">{message}</p>}
                </div>
              )}
            </div>
          )}

          {/* Guest Mode */}
          {!isAdmin && !user && (
            <div className="space-y-3">
              {!showGuestForm ? (
                <button
                  onClick={() => setShowGuestForm(true)}
                  className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-80"
                >
                  Absensi sebagai Tamu
                </button>
              ) : (
                <div className="bg-surface-low border border-[#e5e5e5] p-4 space-y-3">
                  <p className="text-sm font-semibold text-on-surface">Form Tamu</p>
                  <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Nama lengkap"
                    className="input" />
                  <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="Email"
                    className="input" />
                  <input type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="Nomor telepon (opsional)"
                    className="input" />
                  <button onClick={handleGuestSubmit} disabled={status === "loading"}
                    className="w-full rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-80 disabled:opacity-50">
                    {status === "loading" ? "Memproses..." : "Catat Kehadiran"}
                  </button>
                  {status === "error" && <p className="text-xs text-red-600">{message}</p>}
                  {status === "suggest_login" && (
                    <div className="bg-amber-50 border border-amber-200 p-3 space-y-2">
                      <p className="text-xs text-amber-800">{message}</p>
                      <Link href="/login" className="inline-flex rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white hover:opacity-80 transition">Login Sekarang</Link>
                    </div>
                  )}
                  {status === "suggest_register" && (
                    <div className="bg-blue-50 border border-blue-200 p-3 space-y-2">
                      <p className="text-xs text-blue-800">{message}</p>
                      <Link href="/register" className="inline-flex rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white hover:opacity-80 transition">Daftar Sekarang</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
