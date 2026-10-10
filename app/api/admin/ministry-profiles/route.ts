import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin, unauthorizedResponse } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";

const allowedSlugs = ["kemajelisan", "digtive", "pendeta"] as const;

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse("Admin access required");

  const { data, error } = await supabaseAdmin
    .from("ministry_profiles")
    .select("slug, name, description, focus, members, updated_at")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ status: "ok", profiles: data ?? [] });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse("Admin access required");

  try {
    const body = await request.json();
    const { slug, name, description, focus, members } = body;
    if (!allowedSlugs.includes(slug) || !name?.trim() || !description?.trim() || !Array.isArray(focus)) {
      return NextResponse.json({ error: "Data profil belum lengkap." }, { status: 400 });
    }

    const cleanMembers = Array.isArray(members)
      ? members
          .map((member) => {
            const professionStatus = Array.isArray(member?.profession_status)
              ? member.profession_status
                  .map((item: unknown) => String(item).trim())
                  .filter(Boolean)
                  .slice(0, 6)
              : [];
            const deviceOwnership = Array.isArray(member?.device_ownership)
              ? member.device_ownership
                  .map((item: unknown) => String(item).trim())
                  .filter(Boolean)
                  .slice(0, 8)
              : [];

            return {
              name: String(member?.name ?? "").trim(),
              position: String(member?.position ?? "").trim(),
              bio: String(member?.bio ?? "").trim(),
              email: String(member?.email ?? "").trim(),
              phone: String(member?.phone ?? "").trim(),
              photo_url: String(member?.photo_url ?? "").trim(),
              profession_status: professionStatus,
              device_ownership: deviceOwnership,
              role_interest: ["talent", "mentor", "belum_tahu"].includes(String(member?.role_interest ?? "")) ? String(member.role_interest) : "belum_tahu",
            };
          })
          .filter((member) => member.name || member.position || member.bio || member.photo_url || member.profession_status.length || member.device_ownership.length)
          .slice(0, 12)
      : [];

    const cleanFocus = focus.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 6);
    const { data, error } = await supabaseAdmin
      .from("ministry_profiles")
      .upsert({ slug, name: name.trim(), description: description.trim(), focus: cleanFocus, members: cleanMembers, updated_at: new Date().toISOString() })
      .select("slug, name, description, focus, members, updated_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath(`/ministries/${slug}`);
    return NextResponse.json({ status: "ok", profile: data });
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }
}
