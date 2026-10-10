"use client";

import { useState, useEffect } from "react";
import { EventAttendanceCard } from "components/EventAttendanceCard";
import AdminEventForm from "components/AdminEventForm";
import { AdminLayout } from "components/AdminLayout";

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  theme: string | null;
  speaker: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  attendance_enabled: boolean | null;
  is_active: boolean | null;
  type: string | null;
  image_url: string | null;
  qr_token: string;
  warta_url: string | null;
  liturgi_url: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: "Asia/Jakarta",
  });
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/admin/events");
      const data = await res.json();
      if (data.status === "ok") setEvents(data.events);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus event ini? Tindakan tidak dapat dibatalkan.")) return;
    try {
      await fetch("/api/admin/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchEvents();
    } catch { /* ignore */ }
  };

  return (
    <AdminLayout
      title="Kelola Event"
      description="Buat, edit, hapus event, dan kelola attendance QR Code."
    >
      <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Event List */}
        <div className="space-y-8">
          <section className="rounded-3xl bg-white p-8 shadow-sm border border-gksbs-border">
            <h2 className="text-2xl font-semibold text-gksbs-brown">Daftar Event</h2>
            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-dashed border-gksbs-border bg-gksbs-cream p-8 text-center text-gksbs-brown-medium">
                  Memuat...
                </div>
              ) : events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gksbs-border bg-gksbs-cream p-8 text-center text-gksbs-brown-medium">
                  Belum ada event. Buat event baru menggunakan formulir di samping.
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className={`rounded-3xl border p-6 transition ${editingEvent?.id === event.id ? "border-gksbs-brown-accent bg-gksbs-cream ring-2 ring-gksbs-gold/20" : "border-gksbs-border bg-gksbs-cream"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gksbs-brown">{event.title}</h3>
                        <p className="text-sm text-gksbs-brown-medium">{event.location || "Lokasi belum diisi"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${event.attendance_enabled ? "bg-green-100 text-green-700" : "bg-gksbs-border text-gksbs-brown-medium"}`}>
                        {event.attendance_enabled ? "Attendance" : "Tanpa Attendance"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full border border-gksbs-border px-3 py-1 text-gksbs-brown-medium">
                        {event.type || "lainnya"}
                      </span>
                      <span className={`rounded-full px-3 py-1 ${event.is_active === false ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                        {event.is_active === false ? "Tidak tampil publik" : "Tampil publik"}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-gksbs-brown-medium">
                      <div>
                        <p className="font-semibold text-gksbs-brown">Mulai</p>
                        <p>{formatDateTime(event.start_date)}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gksbs-brown">Selesai</p>
                        <p>{formatDateTime(event.end_date)}</p>
                      </div>
                    </div>

                    {/* Attendance Section (Admin Mode) */}
                    {event.attendance_enabled && (
                      <EventAttendanceCard event={event} isAdmin={true} />
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2 border-t border-gksbs-border pt-4">
                      <button
                        onClick={() => setEditingEvent(event)}
                        className="rounded-full border border-gksbs-border px-4 py-2 text-xs font-semibold text-gksbs-brown-medium transition hover:bg-white hover:text-gksbs-brown"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Form */}
        <section className="rounded-3xl bg-white p-8 shadow-sm border border-gksbs-border h-fit lg:sticky lg:top-24">
          <h2 className="text-xl font-semibold text-gksbs-brown">
            {editingEvent ? `Edit: ${editingEvent.title}` : "Tambah Event Baru"}
          </h2>
          <p className="mt-1 text-sm text-gksbs-brown-medium">
            {editingEvent ? "Ubah data event lalu klik Perbarui." : "Isi form untuk membuat event baru."}
          </p>
          <AdminEventForm
            key={editingEvent?.id || "new"}
            editingEvent={editingEvent}
            onSaved={() => { setEditingEvent(null); fetchEvents(); }}
            onCancel={() => setEditingEvent(null)}
          />
        </section>
      </div>
    </AdminLayout>
  );
}
