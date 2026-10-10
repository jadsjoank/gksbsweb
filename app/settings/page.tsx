import { PageShell } from "components/PageShell";
import { SettingsForm } from "./SettingsForm";
import { createSupabaseServerClient } from "lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <PageShell title="Pengaturan" description="Kelola keamanan akun dan preferensi notifikasi Anda.">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Change Password */}
        <SettingsForm />

        {/* Account Info */}
        <div className="space-y-6">
          <div className="border border-[#e5e5e5] bg-white p-8">
            <h2 className="text-xl font-semibold text-on-surface">Informasi Akun</h2>
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between border-b border-[#e5e5e5] pb-3">
                <span className="text-on-surface-muted">Email</span>
                <span className="font-medium text-on-surface">{user.email}</span>
              </div>
              <div className="flex justify-between border-b border-[#e5e5e5] pb-3">
                <span className="text-on-surface-muted">ID Akun</span>
                <span className="font-mono text-xs text-on-surface-muted">{user.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-muted">Login Terakhir</span>
                <span className="text-on-surface">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
                      })
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-[#e5e5e5] bg-white p-8">
            <h2 className="text-xl font-semibold text-on-surface">Preferensi Notifikasi</h2>
            <p className="mt-2 text-sm text-on-surface-muted">Atur jenis notifikasi yang ingin Anda terima.</p>
            <div className="mt-6 space-y-4">
              {[
                { label: "Pengingat Event", desc: "Notifikasi H-1 sebelum event dimulai" },
                { label: "Status kolekte", desc: "Notifikasi saat kolekte berhasil atau gagal" },
                { label: "Pengumuman Gereja", desc: "Info penting dari admin gereja" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between bg-surface-low p-4">
                  <div>
                    <p className="font-medium text-on-surface">{item.label}</p>
                    <p className="text-xs text-on-surface-muted">{item.desc}</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-[#e5e5e5] text-black focus:border-black focus:ring-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="border border-red-200 bg-red-50 p-8">
            <h2 className="text-xl font-semibold text-red-900">Zona Bahaya</h2>
            <p className="mt-2 text-sm text-red-700">Tindakan ini tidak dapat dibatalkan.</p>
            <button className="mt-4 rounded-full border border-red-300 bg-white px-6 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100">
              Hapus Akun Saya
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
