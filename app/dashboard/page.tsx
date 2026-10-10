import Link from "next/link";
import { PageShell } from "components/PageShell";
import { createSupabaseServerClient } from "lib/supabase/server";
import { supabaseAdmin } from "lib/supabaseAdmin";

function extractEventMeta(description: string | null) {
  const text = description ?? "";
  const themeMatch = text.match(/(?:Tema|tema)\s*[:\-]\s*([^|\n]+)/i);
  const speakerMatch = text.match(/(?:Pembawa Firman|Pembawa firman|Speaker|speaker)\s*[:\-]\s*([^|\n]+)/i);

  return {
    theme: themeMatch?.[1]?.trim() ?? null,
    speaker: speakerMatch?.[1]?.trim() ?? null,
  };
}

export default async function UserDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user's profile
  let profile = null;
  if (user) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, role, member_since, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  // Fetch upcoming events
  const { data: events } = await supabaseAdmin
    .from("events")
    .select("id, title, description, start_date, location, attendance_enabled")
    .eq("is_active", true)
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(3) as { data: Array<{ id: string; title: string; description: string | null; start_date: string; location: string | null; attendance_enabled: boolean }> | null };

  // Fetch user's attendance count
  let attendanceCount = 0;
  if (user) {
    const { count } = await supabaseAdmin
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", user.id);
    attendanceCount = count ?? 0;
  }

  // Fetch user's donation count
  let donationCount = 0;
  let totalDonated = 0;
  if (user) {
    const { data: donations } = await supabaseAdmin
      .from("donations")
      .select("amount, status")
      .eq("profile_id", user.id);
    if (donations) {
      donationCount = donations.length;
      totalDonated = donations
        .filter((d: { status: string }) => d.status === "paid")
        .reduce((sum: number, d: { amount: number }) => sum + Number(d.amount), 0);
    }
  }

  // Fetch recent notifications
  let notifications: Array<{ id: string; title: string; body: string; type: string; is_read: boolean; created_at: string }> = [];
  if (user) {
    const { data } = await supabaseAdmin
      .from("notifications")
      .select("id, title, body, type, is_read, created_at")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    notifications = data ?? [];
  }

  const greeting = profile?.full_name || user?.email || "Jemaat";

  return (
    <PageShell title={`Selamat Datang, ${greeting}`} description="Ringkasan aktivitas dan akses cepat ke fitur gereja.">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border border-[#e5e5e5] bg-white p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-on-surface-muted">Kehadiran</p>
              <p className="mt-2 text-3xl font-bold text-on-surface">{attendanceCount}</p>
              <p className="mt-1 text-sm text-on-surface-muted">Total attendance tercatat</p>
            </div>
            <div className="border border-[#e5e5e5] bg-white p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-on-surface-muted">kolekte</p>
              <p className="mt-2 text-3xl font-bold text-on-surface">{donationCount}</p>
              <p className="mt-1 text-sm text-on-surface-muted">Total transaksi kolekte</p>
            </div>
            <div className="border border-[#e5e5e5] bg-white p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-on-surface-muted">Total Kolekte</p>
              <p className="mt-2 text-3xl font-bold text-on-surface">
                Rp {totalDonated.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-sm text-on-surface-muted">Jumlah kolekte berhasil</p>
            </div>
          </div>

          {/* Upcoming Events */}
          <section className="border border-[#e5e5e5] bg-white p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-on-surface">Event Mendatang</h2>
              <Link href="/events" className="text-sm font-medium text-black hover:text-black">
                Lihat Semua →
              </Link>
            </div>
            {(!events || events.length === 0) ? (
              <div className="border border-dashed border-[#e5e5e5] bg-surface-low p-8 text-center text-on-surface-muted">
                Belum ada event mendatang.
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => {
                  const { theme, speaker } = extractEventMeta(event.description);

                  return (
                    <div key={event.id} className="border border-[#e5e5e5] bg-surface-low p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-on-surface">{event.title}</h3>
                          <p className="mt-1 text-sm text-on-surface-muted">
                            {new Date(event.start_date).toLocaleString("id-ID", {
                              weekday: "long", day: "numeric", month: "long", year: "numeric",
                              hour: "2-digit", minute: "2-digit", hour12: false
                            })}
                          </p>
                          {event.location && (
                            <p className="mt-1 text-sm text-on-surface-muted">{event.location}</p>
                          )}
                        </div>
                        {event.attendance_enabled && (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Attendance
                          </span>
                        )}
                      </div>

                      {(theme || speaker) && (
                        <div className="mt-3 space-y-1 text-sm text-on-surface-muted">
                          {theme && (
                            <p>
                              <span className="font-semibold text-on-surface">Tema:</span> {theme}
                            </p>
                          )}
                          {speaker && (
                            <p>
                              <span className="font-semibold text-on-surface">Pembawa Firman:</span> {speaker}
                            </p>
                          )}
                        </div>
                      )}

                      <Link
                        href="/events"
                        className="mt-4 inline-flex items-center rounded-full border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-black hover:text-white"
                      >
                        Lihat Event
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent Notifications */}
          <section className="border border-[#e5e5e5] bg-white p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-on-surface">Notifikasi Terbaru</h2>
              <Link href="/notifications" className="text-sm font-medium text-black hover:text-black">
                Lihat Semua →
              </Link>
            </div>
            {notifications.length === 0 ? (
              <p className="text-on-surface-muted">Belum ada notifikasi.</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 ${notif.is_read ? "bg-surface-low" : "bg-surface-low border border-[#e5e5e5]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-on-surface">{notif.title}</p>
                        <p className="mt-1 text-sm text-on-surface-muted">{notif.body}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#e5e5e5] px-2 py-0.5 text-xs text-on-surface-muted">
                        {notif.type}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-on-surface-muted">
                      {new Date(notif.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="border border-[#e5e5e5] bg-white p-6">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-on-surface-muted">Akses Cepat</p>
            <div className="space-y-3">
              <Link href="/events" className="flex items-center gap-3 bg-surface-low p-4 transition hover:bg-surface-container">
                <span className="text-sm font-medium text-on-surface">Jadwal Ibadah</span>
              </Link>
              <Link href="/donate" className="flex items-center gap-3 bg-surface-low p-4 transition hover:bg-surface-container">
                <span className="text-sm font-medium text-on-surface">kolekte Online</span>
              </Link>
              <Link href="/attendance" className="flex items-center gap-3 bg-surface-low p-4 transition hover:bg-surface-container">
                <span className="text-sm font-medium text-on-surface">Attendance</span>
              </Link>
              <Link href="/profile" className="flex items-center gap-3 bg-surface-low p-4 transition hover:bg-surface-container">
                <span className="text-sm font-medium text-on-surface">Profil Saya</span>
              </Link>
              <Link href="/ministries" className="flex items-center gap-3 bg-surface-low p-4 transition hover:bg-surface-container">
                <span className="text-sm font-medium text-on-surface">Pelayanan</span>
              </Link>
            </div>
          </div>

          {/* Profile Card */}
          <div className="border border-[#e5e5e5] bg-white p-6">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-on-surface-muted">Profil</p>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e5e5e5] text-lg font-bold text-on-surface-muted">
                {(profile?.full_name || "?")[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-on-surface">{profile?.full_name || "User"}</p>
                <p className="text-sm text-on-surface-muted">{profile?.email || user?.email}</p>
              </div>
            </div>
            {profile?.member_since && (
              <p className="mt-4 text-xs text-on-surface-muted">
                Anggota sejak {new Date(profile.member_since).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
            <Link href="/settings" className="mt-4 block text-center rounded-full border border-[#e5e5e5] px-4 py-2 text-sm font-medium text-on-surface-muted transition hover:bg-surface-low">
              Pengaturan Akun
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
