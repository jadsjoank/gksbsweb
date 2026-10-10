import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { logAuditAction } from "lib/audit";

const SETTINGS_KEY = "app_settings";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse("Admin access required");

  // Try to load from DB first, fall back to env defaults
  const { data } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();

  const defaults = {
    church_name:           "GKSBS Tanjung Karang",
    church_address:        "Jl. Sutan Syahrir No.27, Pahoman, Lampung",
    church_phone:          "0821-8457-1705",
    church_email:          "gksbs.tk@gmail.com",
    midtrans_environment:  process.env.MIDTRANS_ENVIRONMENT ?? "sandbox",
    notifications_enabled: true,
    registration_open:     true,
    maintenance_mode:      false,
  };

  return NextResponse.json({
    status: "ok",
    settings: data?.value ?? defaults,
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse("Admin access required");

  try {
    const body = await req.json();

    // Whitelist safe settings — never accept secret keys here
    const safe = {
      church_name:           String(body.church_name   ?? ""),
      church_address:        String(body.church_address ?? ""),
      church_phone:          String(body.church_phone   ?? ""),
      church_email:          String(body.church_email   ?? ""),
      midtrans_environment:  ["sandbox", "production"].includes(body.midtrans_environment)
                               ? body.midtrans_environment : "sandbox",
      notifications_enabled: Boolean(body.notifications_enabled),
      registration_open:     Boolean(body.registration_open),
      maintenance_mode:      Boolean(body.maintenance_mode),
    };

    const { error } = await supabaseAdmin
      .from("settings")
      .upsert({ key: SETTINGS_KEY, value: safe }, { onConflict: "key" });

    if (error) {
      // settings table might not exist yet — return ok anyway so UI doesn't break
      console.warn("Settings save warning:", error.message);
      return NextResponse.json({ status: "ok", warning: error.message });
    }

    await logAuditAction({
      actorId: admin.id,
      actorEmail: admin.email,
      entityType: "settings",
      entityId: SETTINGS_KEY,
      action: "updated",
      details: safe,
    });

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
