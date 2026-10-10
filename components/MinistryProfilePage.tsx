import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "lib/supabaseAdmin";

type MinistryMember = {
  name: string;
  position: string;
  bio: string;
  email: string;
  phone: string;
  photo_url: string;
  profession_status?: string[];
  device_ownership?: string[];
  role_interest?: string;
};

type MinistryProfile = {
  name: string;
  eyebrow: string;
  description: string;
  focus: string[];
};

export async function MinistryProfilePage({ slug }: { slug: string }) {
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const fallbackProfile: MinistryProfile = {
    name: slug === "digtive" ? "DIGTIVE" : "Pelayanan",
    eyebrow: "Profil Pelayanan",
    description: "Informasi profil pelayanan akan diperbarui oleh tim gereja.",
    focus: [
      "Pelayanan jemaat",
      "Pendampingan komunitas",
      "Kegiatan rohani dan sosial",
    ],
  };

  if (!hasSupabaseConfig) {
    return renderProfilePage(fallbackProfile, []);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("ministry_profiles")
      .select("name, description, focus")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("[MinistryProfilePage] Failed to load profile:", error.message);
      return renderProfilePage(fallbackProfile, []);
    }
    if (!data) notFound();

    const profile: MinistryProfile = {
      name: data.name,
      eyebrow: "Profil Pelayanan",
      description: data.description ?? "",
      focus: Array.isArray(data.focus) ? (data.focus as string[]) : [],
    };

    return renderProfilePage(profile, []);
  } catch (error) {
    console.error("[MinistryProfilePage] Failed to load profile:", error);
    return renderProfilePage(fallbackProfile, []);
  }
}

function renderProfilePage(profile: MinistryProfile, members: MinistryMember[]) {
  return (
    <main className="min-h-screen bg-surface">
      <section className="border-b border-[#e5e5e5] bg-black text-white">
        <div className="container py-16 md:py-24">
          <p className="label-caps text-white/50 mb-5">{profile.eyebrow}</p>
          <h1 className="text-display font-black tracking-tighter leading-none">{profile.name}</h1>
          <p className="mt-6 max-w-2xl text-body-lg text-white/70">{profile.description}</p>
        </div>
      </section>

      <section className="container py-section">
        <div className="grid gap-12 lg:grid-cols-3">
          <div>
            <p className="label-caps text-on-surface-muted">Tentang Pelayanan</p>
            <h2 className="mt-3 text-h2 font-bold tracking-tight">Melayani bersama jemaat</h2>
          </div>
          <div className="lg:col-span-2">
            <div className="border-y border-[#e5e5e5]">
              {profile.focus.map((item, index) => (
                <div key={item} className="flex items-center gap-5 border-b border-[#e5e5e5] py-5 last:border-b-0">
                  <span className="text-label font-bold text-on-surface-muted">0{index + 1}</span>
                  <span className="text-h3 font-semibold">{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-xl text-body text-on-surface-muted leading-relaxed">
              Informasi pengurus, jadwal pelayanan, dan kontak akan diperbarui oleh tim gereja.
            </p>
          </div>
        </div>

        <div className="mt-20">
          <p className="label-caps text-on-surface-muted">Anggota Pelayanan</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {members.length === 0 ? (
              <div className="rounded-2xl border border-[#e5e5e5] bg-white p-6 text-on-surface-muted">
                Informasi anggota pelayanan belum tersedia untuk saat ini.
              </div>
            ) : members.map((member, index) => {
              const initials = member.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <article key={`${member.name}-${index}`} className="border border-[#e5e5e5] bg-white p-5">
                  <div className="mb-4 overflow-hidden border border-[#e5e5e5] bg-surface-low">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} className="h-56 w-full object-cover" />
                    ) : (
                      <div className="flex h-56 w-full items-center justify-center bg-surface-low text-3xl font-bold text-on-surface-muted">{initials || "GP"}</div>
                    )}
                  </div>
                  <p className="text-label text-on-surface-muted">{member.position || "Anggota"}</p>
                  <h3 className="mt-2 text-h3 font-bold text-on-surface">{member.name}</h3>
                  {member.bio && <p className="mt-3 text-body-sm text-on-surface-muted leading-relaxed">{member.bio}</p>}
                  {(member.profession_status?.length || member.device_ownership?.length || member.role_interest) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {member.role_interest && (
                        <span className="rounded-full bg-[#f4efe8] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5a3b1a]">
                          {member.role_interest === "talent" ? "Talent" : member.role_interest === "mentor" ? "Mentor" : "Belum Tahu"}
                        </span>
                      )}
                      {member.profession_status?.slice(0, 2).map((item) => (
                        <span key={item} className="rounded-full border border-[#e5e5e5] px-2 py-1 text-[10px] font-medium text-on-surface-muted">{item}</span>
                      ))}
                      {member.device_ownership?.slice(0, 2).map((item) => (
                        <span key={item} className="rounded-full bg-[#f7f7f7] px-2 py-1 text-[10px] font-medium text-on-surface-muted">{item}</span>
                      ))}
                    </div>
                  )}
                  {(member.email || member.phone) && (
                    <div className="mt-4 space-y-1 text-body-sm text-on-surface-muted">
                      {member.email && <p>{member.email}</p>}
                      {member.phone && <p>{member.phone}</p>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <Link href="/ministries" className="mt-12 inline-block label-caps text-on-surface-muted hover:text-black border-b border-current pb-0.5 transition-colors">
          ← Lihat Open Recruitment
        </Link>
      </section>
    </main>
  );
}
