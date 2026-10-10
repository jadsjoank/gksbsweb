import { PageShell } from "components/PageShell";
import { createSupabaseServerClient } from "lib/supabase/server";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { redirect } from "next/navigation";
import { ProfileEditForm } from "./ProfileEditForm";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, phone, date_of_birth, address, avatar_url, role, member_since, last_login")
    .eq("id", user.id)
    .single();

  return (
    <PageShell title="Profil Saya" description="Kelola informasi pribadi dan kontak Anda.">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="border border-[#e5e5e5] bg-white p-8 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#e5e5e5] text-3xl font-bold text-on-surface-muted">
            {(profile?.full_name || profile?.email || "?")[0].toUpperCase()}
          </div>
          <h2 className="mt-4 text-xl font-semibold text-on-surface">
            {profile?.full_name || "User"}
          </h2>
          <p className="mt-1 text-sm text-on-surface-muted">{profile?.email}</p>
          <span className="mt-3 inline-block rounded-full bg-surface-container px-3 py-1 text-xs font-semibold uppercase tracking-wider text-on-surface-muted">
            {profile?.role || "User"}
          </span>
          <div className="mt-6 space-y-3 text-left text-sm">
            {profile?.phone && (
              <div className="flex justify-between border-t border-[#e5e5e5] pt-3">
                <span className="text-on-surface-muted">Telepon</span>
                <span className="text-on-surface">{profile.phone}</span>
              </div>
            )}
            {profile?.member_since && (
              <div className="flex justify-between border-t border-[#e5e5e5] pt-3">
                <span className="text-on-surface-muted">Anggota Sejak</span>
                <span className="text-on-surface">
                  {new Date(profile.member_since).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            )}
            {profile?.last_login && (
              <div className="flex justify-between border-t border-[#e5e5e5] pt-3">
                <span className="text-on-surface-muted">Login Terakhir</span>
                <span className="text-on-surface">
                  {new Date(profile.last_login).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <ProfileEditForm profile={profile} />
        </div>
      </div>
    </PageShell>
  );
}
