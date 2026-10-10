import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { getProfileFromRequest } from "lib/auth";
import VolunteerForm from "components/VolunteerForm";

type Props = { params: Promise<{ id: string }> };

export default async function MinistryDetailPage({ params }: Props) {
  const { id } = await params;

  const { data: pos, error } = await supabaseAdmin
    .from("volunteer_positions")
    .select("id, title, department, description, slots, is_open, image_url")
    .eq("id", id)
    .single();

  if (error || !pos || !pos.is_open) notFound();

  const profile = await getProfileFromRequest();
  if (!profile) redirect(`/register?redirect=/ministries/${id}`);

  const isGuest = profile.role === "Guest";
  let existing: { id: string; status: string } | null = null;
  if (!isGuest) {
    const { data } = await supabaseAdmin
      .from("volunteer_assignments")
      .select("id, status")
      .eq("position_id", id)
      .eq("profile_id", profile.id)
      .maybeSingle();
    existing = data;
  }

  return (
    <main className="min-h-screen bg-surface">
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative h-72 bg-black overflow-hidden">
        {pos.image_url ? (
          <img src={pos.image_url} alt={pos.title} className="w-full h-full object-cover opacity-50 grayscale" />
        ) : (
          <div className="w-full h-full bg-surface-container flex items-center justify-center">
            <span className="text-8xl opacity-10">✦</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container py-8">
          <span className="bg-white text-black text-caption font-bold px-2 py-1 uppercase tracking-widest mr-3">
            {pos.department}
          </span>
          <h1 className="mt-3 text-h1 text-white font-black tracking-tighter leading-none">{pos.title}</h1>
        </div>
      </section>

      <div className="container py-16 grid gap-12 lg:grid-cols-3">
        {/* ── Sidebar ──────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="border border-[#e5e5e5] bg-white">
            <div className="border-b border-[#e5e5e5] px-6 py-4">
              <p className="label-caps">Informasi Posisi</p>
            </div>
            <dl className="px-6 py-5 space-y-4">
              <div>
                <dt className="label-caps mb-1">Departemen</dt>
                <dd className="text-body font-semibold">{pos.department}</dd>
              </div>
              <div>
                <dt className="label-caps mb-1">Kuota</dt>
                <dd className="text-body font-semibold">{pos.slots} orang</dd>
              </div>
              <div>
                <dt className="label-caps mb-1">Status</dt>
                <dd>
                  <span className="bg-black text-white text-caption font-bold px-2 py-0.5 uppercase tracking-widest">
                    Open
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {pos.description && (
            <div className="border border-[#e5e5e5] bg-white p-6">
              <p className="label-caps mb-3">Tentang Pelayanan</p>
              <p className="text-body text-on-surface-muted leading-relaxed">{pos.description}</p>
            </div>
          )}

          <Link href="/ministries" className="inline-block label-caps text-on-surface-muted hover:text-black border-b border-current pb-0.5 transition-colors">
            ← Kembali ke Daftar
          </Link>
        </div>

        {/* ── Registration Area ─────────────────────── */}
        <div className="lg:col-span-2">
          <div className="border border-[#e5e5e5] bg-white">
            {isGuest ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-6">🔒</div>
                <h2 className="text-h3 font-bold mb-3">Lengkapi Akun Kamu</h2>
                <p className="text-body text-on-surface-muted max-w-sm mx-auto mb-8">
                  Untuk mendaftar sebagai volunteer, kamu perlu akun aktif.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href={`/register?redirect=/ministries/${id}`} className="btn-primary">
                    Daftar Akun
                  </Link>
                  <Link href={`/login?redirect=/ministries/${id}`} className="btn-secondary">
                    Sudah Punya Akun
                  </Link>
                </div>
              </div>
            ) : existing ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-6">
                  {existing.status === "approved" ? "✅" : existing.status === "rejected" ? "❌" : "⏳"}
                </div>
                <h2 className="text-h3 font-bold mb-3">
                  {existing.status === "approved" ? "Pendaftaran Diterima" : existing.status === "rejected" ? "Pendaftaran Ditolak" : "Sedang Diproses"}
                </h2>
                <p className="text-body text-on-surface-muted max-w-sm mx-auto">
                  {existing.status === "approved"
                    ? "Selamat! Tim kami akan segera menghubungimu."
                    : existing.status === "rejected"
                    ? "Maaf, hubungi admin untuk info lebih lanjut."
                    : "Pendaftaranmu sudah masuk. Tim kami akan segera mereview."}
                </p>
              </div>
            ) : (
              <div className="p-8">
                <div className="border-b border-[#e5e5e5] pb-6 mb-8">
                  <p className="label-caps mb-2">Formulir Pendaftaran</p>
                  <h2 className="text-h3 font-bold">Daftarkan Diri</h2>
                  <p className="text-body text-on-surface-muted mt-1">
                    Isi formulir untuk mendaftar sebagai relawan di posisi <strong>{pos.title}</strong>.
                  </p>
                </div>
                <VolunteerForm
                  positionId={pos.id}
                  positionTitle={pos.title}
                  profileId={profile.id}
                  defaultName={profile.full_name ?? ""}
                  defaultEmail={profile.email}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
