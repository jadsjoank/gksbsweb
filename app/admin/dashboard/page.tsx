import { notFound } from "next/navigation";
import { AdminLayout } from "components/AdminLayout";
import { requireAdmin } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  // Fetch aggregate stats
  const [usersResult, eventsResult, donationsResult, attendanceResult] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("donations").select("id, amount, status"),
    supabaseAdmin.from("attendance").select("id", { count: "exact", head: true }),
  ]);

  const totalUsers = usersResult.count ?? 0;
  const totalEvents = eventsResult.count ?? 0;
  const totalAttendance = attendanceResult.count ?? 0;
  const donations = donationsResult.data ?? [];
  const paidDonations = donations.filter((d: { status: string }) => d.status === "paid");
  const totalRevenue = paidDonations.reduce((sum: number, d: { amount: number }) => sum + Number(d.amount), 0);
  const pendingDonations = donations.filter((d: { status: string }) => d.status === "pending").length;

  // Fetch recent events
  const { data: recentEvents } = await supabaseAdmin
    .from("events")
    .select("id, title, start_date, location")
    .order("created_at", { ascending: false })
    .limit(5) as { data: Array<{ id: string; title: string; start_date: string; location: string | null }> | null };

  // Fetch recent donations
  const { data: recentDonations } = await supabaseAdmin
    .from("donations")
    .select("id, donor_name, amount, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5) as { data: Array<{ id: string; donor_name: string | null; amount: number; status: string; created_at: string }> | null };

  return (
    <AdminLayout title="Admin Dashboard" description="Ringkasan data gereja, aktivitas terkini, dan akses cepat manajemen.">
      <div className="space-y-8">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="border border-[#e5e5e5] bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-on-surface-muted">Total Jemaat</p>
            <p className="mt-2 text-3xl font-bold text-on-surface">{totalUsers}</p>
            <p className="mt-1 text-sm text-on-surface-muted">Anggota terdaftar</p>
          </div>
          <div className="border border-[#e5e5e5] bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-on-surface-muted">Total Event</p>
            <p className="mt-2 text-3xl font-bold text-on-surface">{totalEvents}</p>
            <p className="mt-1 text-sm text-on-surface-muted">Event tercatat</p>
          </div>
          <div className="border border-[#e5e5e5] bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-on-surface-muted">Pendapatan</p>
            <p className="mt-2 text-3xl font-bold text-on-surface">Rp {totalRevenue.toLocaleString("id-ID")}</p>
            <p className="mt-1 text-sm text-on-surface-muted">{paidDonations.length} kolekte berhasil</p>
          </div>
          <div className="border border-[#e5e5e5] bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-on-surface-muted">Kehadiran</p>
            <p className="mt-2 text-3xl font-bold text-on-surface">{totalAttendance}</p>
            <p className="mt-1 text-sm text-on-surface-muted">{pendingDonations} kolekte pending</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Events */}
          <section className="border border-[#e5e5e5] bg-white p-8">
            <h2 className="text-lg font-semibold text-on-surface">Event Terbaru</h2>
            <div className="mt-4 space-y-3">
              {(!recentEvents || recentEvents.length === 0) ? (
                <p className="text-sm text-on-surface-muted">Belum ada event.</p>
              ) : (
                recentEvents.map((event) => (
                  <div key={event.id} className="bg-surface-low p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-on-surface">{event.title}</p>
                        <p className="text-xs text-on-surface-muted">{event.location || "Lokasi belum diisi"}</p>
                      </div>
                      <span className="shrink-0 text-xs text-on-surface-muted">
                        {new Date(event.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Recent Donations */}
          <section className="border border-[#e5e5e5] bg-white p-8">
            <h2 className="text-lg font-semibold text-on-surface">kolekte Terbaru</h2>
            <div className="mt-4 space-y-3">
              {(!recentDonations || recentDonations.length === 0) ? (
                <p className="text-sm text-on-surface-muted">Belum ada kolekte.</p>
              ) : (
                recentDonations.map((don) => (
                  <div key={don.id} className="flex items-center justify-between bg-surface-low p-4">
                    <div>
                      <p className="font-medium text-on-surface">{don.donor_name || "Anonim"}</p>
                      <p className="text-xs text-on-surface-muted">
                        {new Date(don.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-on-surface">Rp {Number(don.amount).toLocaleString("id-ID")}</p>
                      <span className={`text-xs font-medium ${don.status === "paid" ? "text-emerald-600" : don.status === "pending" ? "text-amber-600" : "text-red-600"}`}>
                        {don.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
