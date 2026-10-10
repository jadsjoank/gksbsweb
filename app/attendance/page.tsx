"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { PageShell } from "components/PageShell";
import { useAuthStore } from "lib/store/useAuthStore";

type DbEvent = {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  attendance_enabled: boolean | null;
  location: string | null;
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

/**
 * Check if attendance is currently active:
 * - From event start time until 45 minutes after event end time
 * - If no end_date, active for 2 hours from start
 */
function isAttendanceActive(event: DbEvent): boolean {
  const now = new Date();
  const start = new Date(event.start_date);
  const end = event.end_date
    ? new Date(event.end_date)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000); // default 2h

  const graceEnd = new Date(end.getTime() + 45 * 60 * 1000); // +45 min grace

  return now >= start && now <= graceEnd;
}

export default function AttendancePage() {
  const user = useAuthStore((state) => state.user);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [tick, setTick] = useState(0);
  const [qrToken, setQrToken] = useState<string | null>(null);

  // Refresh time every 30 seconds to update active status
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (data.status === "ok") {
        setEvents(data.events.filter((e: DbEvent) => e.attendance_enabled));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const activeEvents = events.filter(isAttendanceActive);
  const isGuest = !user || user.role === "Guest";

  const handleSelectEvent = (event: DbEvent) => {
    setSelectedEvent(event);
    setShowQR(false);
    setQrToken(null);
  };

  const handleGenerateQR = async () => {
    if (!selectedEvent || !user) return;
    const response = await fetch(`/api/attendance/qr-token?event_id=${encodeURIComponent(selectedEvent.id)}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || typeof data.token !== "string") return;
    setQrToken(data.token);
    setShowQR(true);
  };

  // Build QR data from event token + user
  const qrData = selectedEvent && user && qrToken
    ? qrToken
    : null;

  return (
    <PageShell title="Attendance" description="Scan QR Code untuk mencatat kehadiran Anda pada event gereja.">
      <div className="space-y-8">
        {loading ? (
          <div className="rounded-3xl bg-white border border-gksbs-border p-12 text-center text-gksbs-brown-medium">
            Memuat event...
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl bg-white border border-gksbs-border p-12 text-center text-gksbs-brown-medium">
            Belum ada event dengan attendance aktif.
          </div>
        ) : (
          <>
            {/* Active Events */}
            {activeEvents.length > 0 && (
              <div className="rounded-3xl border-2 border-green-300 bg-green-50 p-6">
                <p className="text-sm font-bold uppercase tracking-wider text-green-800">🟢 Attendance Sedang Aktif</p>
                <div className="mt-4 space-y-3">
                  {activeEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleSelectEvent(event)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selectedEvent?.id === event.id
                          ? "border-green-600 bg-white ring-2 ring-green-200"
                          : "border-green-200 bg-white hover:border-green-400"
                      }`}
                    >
                      <p className="font-semibold text-gksbs-brown">{event.title}</p>
                      <p className="text-sm text-gksbs-brown-medium">
                        {formatDate(event.start_date)} • {formatTime(event.start_date)} - {event.end_date ? formatTime(event.end_date) : formatTime(event.start_date)} WIB
                      </p>
                      {event.location && <p className="text-xs text-gksbs-brown-medium mt-1">📍 {event.location}</p>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            <div className="rounded-3xl bg-white border border-gksbs-border p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-gksbs-brown-accent">Semua Event dengan Attendance</p>
              <div className="mt-4 space-y-3">
                {events.map((event) => {
                  const active = isAttendanceActive(event);
                  return (
                    <div key={event.id} className="flex items-center justify-between rounded-2xl border border-gksbs-border bg-gksbs-cream p-4">
                      <div>
                        <p className="font-medium text-gksbs-brown">{event.title}</p>
                        <p className="text-xs text-gksbs-brown-medium">
                          {formatDate(event.start_date)} • {formatTime(event.start_date)} WIB
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        active ? "bg-green-100 text-green-700" : "bg-gksbs-border text-gksbs-brown-medium"
                      }`}>
                        {active ? "Aktif" : "Belum dimulai"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QR Code Section */}
            {selectedEvent && (
              <div className="rounded-3xl bg-white border border-gksbs-border p-8">
                <h2 className="text-xl font-semibold text-gksbs-brown">Attendance: {selectedEvent.title}</h2>
                <p className="mt-2 text-sm text-gksbs-brown-medium">
                  {formatDate(selectedEvent.start_date)} • {formatTime(selectedEvent.start_date)} - {selectedEvent.end_date ? formatTime(selectedEvent.end_date) : "..."} WIB
                </p>

                {!isAttendanceActive(selectedEvent) ? (
                  <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                    ⏰ Attendance belum aktif. QR Code akan muncul saat event dimulai hingga 45 menit setelah selesai.
                  </div>
                ) : isGuest ? (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl bg-gksbs-cream border border-gksbs-border p-4 text-sm text-gksbs-brown-medium">
                      Silakan login untuk mengakses attendance.
                    </div>
                    <Link href="/login" className="inline-flex rounded-full bg-gksbs-brown px-6 py-3 text-sm font-semibold text-gksbs-gold transition hover:bg-gksbs-brown-medium">
                      Login
                    </Link>
                  </div>
                ) : !showQR ? (
                  <div className="mt-6 space-y-4">
                    <p className="text-sm text-gksbs-brown-medium">Klik tombol di bawah untuk menampilkan QR Code attendance Anda.</p>
                    <button
                      onClick={handleGenerateQR}
                      className="rounded-full bg-gksbs-brown px-8 py-3 text-sm font-semibold text-gksbs-gold transition hover:bg-gksbs-brown-medium"
                    >
                      Tampilkan QR Code
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {/* QR Code Display */}
                    <div className="mx-auto max-w-xs rounded-3xl bg-gksbs-cream border-2 border-gksbs-border p-8 text-center">
                      {/* Visual QR Code representation */}
                      <div className="mx-auto h-48 w-48 rounded-2xl bg-white border-2 border-gksbs-border flex items-center justify-center mb-4">
                        <div className="text-center">
                          <div className="text-5xl mb-2">📱</div>
                          <p className="text-xs text-gksbs-brown-medium font-medium">QR Attendance</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gksbs-brown">{user.email}</p>
                      <p className="text-xs text-gksbs-brown-medium mt-1">{selectedEvent.title}</p>
                      <div className="mt-4 rounded-xl bg-white p-3 text-left">
                        <p className="text-[10px] font-mono text-gksbs-brown-medium break-all">
                          Token berlaku 90 detik dan hanya dapat dipakai petugas attendance.
                        </p>
                      </div>
                    </div>
                    <p className="text-center text-xs text-gksbs-brown-medium">
                      Tunjukkan QR Code ini kepada admin untuk dipindai.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
