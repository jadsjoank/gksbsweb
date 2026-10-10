"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "components/AdminLayout";

type AttendanceRecord = {
  id: string;
  event_id: string;
  profile_id: string | null;
  guest_name: string | null;
  method: string;
  checked_in_at: string;
};

type EventItem = { id: string; title: string };

type SortBy = "date_desc" | "date_asc" | "event";

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("date_desc");
  const [filterEvent, setFilterEvent] = useState<string>("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/attendance").then((r) => r.json()).catch(() => ({ attendance: [] })),
      fetch("/api/events").then((r) => r.json()).catch(() => ({ events: [] })),
    ]).then(([attData, evData]) => {
      // Attendance API currently returns stub, try admin approach
      if (attData.records) setRecords(attData.records);
      if (evData.events) setEvents(evData.events);
      setLoading(false);
    });
  }, []);

  const eventMap = new Map(events.map((e) => [e.id, e.title]));

  // Sort and filter
  const filteredRecords = records
    .filter((r) => filterEvent === "all" || r.event_id === filterEvent)
    .sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime();
      if (sortBy === "date_asc") return new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime();
      // Sort by event name
      const titleA = eventMap.get(a.event_id) || "";
      const titleB = eventMap.get(b.event_id) || "";
      return titleA.localeCompare(titleB);
    });

  // Group by event for summary
  const byEvent = new Map<string, number>();
  records.forEach((r) => {
    byEvent.set(r.event_id, (byEvent.get(r.event_id) || 0) + 1);
  });

  return (
    <AdminLayout title="Laporan Kehadiran" description="Pantau metrik kehadiran per event dan riwayat check-in jemaat.">
      {/* Event Summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from(byEvent.entries()).map(([eventId, count]) => (
          <div key={eventId} className="border border-[#e5e5e5] bg-white p-6">
            <p className="text-sm text-on-surface-muted">{eventMap.get(eventId) || "Event"}</p>
            <p className="mt-1 text-2xl font-bold text-on-surface">{count}</p>
            <p className="text-xs text-on-surface-muted">hadirin tercatat</p>
          </div>
        ))}
        {byEvent.size === 0 && (
          <div className="border border-dashed border-[#e5e5e5] bg-surface-low p-8 text-center text-on-surface-muted sm:col-span-2 lg:col-span-3">
            Belum ada data kehadiran.
          </div>
        )}
      </div>

      {/* Sort & Filter Controls */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-on-surface">Urutkan:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-sm text-on-surface outline-none focus:border-black"
          >
            <option value="date_desc">Tanggal (Terbaru)</option>
            <option value="date_asc">Tanggal (Terlama)</option>
            <option value="event">Event (A-Z)</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-on-surface">Filter Event:</label>
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-sm text-on-surface outline-none focus:border-black"
          >
            <option value="all">Semua Event</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </div>
        <span className="ml-auto text-sm text-on-surface-muted self-center">
          {filteredRecords.length} data
        </span>
      </div>

      {/* Records Table */}
      <div className="border border-[#e5e5e5] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e5e5] bg-surface-low">
                <th className="px-6 py-4 text-left font-semibold text-on-surface">Event</th>
                <th className="px-6 py-4 text-left font-semibold text-on-surface">Nama</th>
                <th className="px-6 py-4 text-left font-semibold text-on-surface">Metode</th>
                <th className="px-6 py-4 text-left font-semibold text-on-surface">Waktu Check-in</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-on-surface-muted">Memuat...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-on-surface-muted">Belum ada data kehadiran.</td></tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="border-b border-[#e5e5e5] hover:bg-surface-low transition">
                    <td className="px-6 py-4 text-on-surface">{eventMap.get(rec.event_id) || rec.event_id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-on-surface">{rec.guest_name || rec.profile_id?.slice(0, 8) || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-medium text-on-surface-muted capitalize">{rec.method}</span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-muted">
                      {new Date(rec.checked_in_at).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
