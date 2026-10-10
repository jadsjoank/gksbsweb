import { notFound } from "next/navigation";
import { AdminLayout } from "components/AdminLayout";
import { requireAdmin } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";

type Donation = {
  id: string;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  type: string;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
};

export default async function AdminDonationsPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const { data: donations } = await supabaseAdmin
    .from("donations")
    .select("id, donor_name, donor_email, amount, type, status, payment_method, paid_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50) as { data: Donation[] | null };

  const donationList = donations ?? [];
  const totalPaid = donationList.filter((d) => d.status === "paid").reduce((s, d) => s + Number(d.amount), 0);
  const totalPending = donationList.filter((d) => d.status === "pending").length;

  return (
    <AdminLayout title="Manajemen kolekte" description="Pantau semua transaksi kolekte, status pembayaran, dan ringkasan keuangan.">
      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="border border-[#e5e5e5] bg-white p-6">
          <p className="text-sm text-on-surface-muted">Total Masuk</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">Rp {totalPaid.toLocaleString("id-ID")}</p>
        </div>
        <div className="border border-[#e5e5e5] bg-white p-6">
          <p className="text-sm text-on-surface-muted">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{totalPending}</p>
        </div>
        <div className="border border-[#e5e5e5] bg-white p-6">
          <p className="text-sm text-on-surface-muted">Total Transaksi</p>
          <p className="mt-1 text-2xl font-bold text-on-surface">{donationList.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#e5e5e5] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e5e5] bg-surface-low">
                <th className="px-6 py-4 text-left font-semibold text-on-surface-muted">Donatur</th>
                <th className="px-6 py-4 text-left font-semibold text-on-surface-muted">Jumlah</th>
                <th className="px-6 py-4 text-left font-semibold text-on-surface-muted">Jenis</th>
                <th className="px-6 py-4 text-left font-semibold text-on-surface-muted">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-on-surface-muted">Metode</th>
                <th className="px-6 py-4 text-left font-semibold text-on-surface-muted">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {donationList.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-on-surface-muted">Belum ada data kolekte.</td></tr>
              ) : (
                donationList.map((don) => (
                  <tr key={don.id} className="border-b border-[#e5e5e5] hover:bg-surface-low transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-on-surface">{don.donor_name || "Anonim"}</p>
                      <p className="text-xs text-on-surface-muted">{don.donor_email || "-"}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-on-surface">Rp {Number(don.amount).toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4 text-on-surface-muted capitalize">{don.type}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        don.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                        don.status === "pending" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>{don.status}</span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-muted">{don.payment_method || "-"}</td>
                    <td className="px-6 py-4 text-on-surface-muted">
                      {new Date(don.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
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
