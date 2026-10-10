import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin, unauthorizedResponse } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { logAuditAction } from "lib/audit";

function cleanDescription(value: unknown) {
  return String(value ?? "")
    .split("|")
    .map((part) => part.trim())
    .filter((part) =>
      part &&
      !/^recurring_weekly\s*:/i.test(part) &&
      !/^(Tema|Pembawa Firman)\s*:/i.test(part)
    )
    .join(" | ");
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse("Admin access required");

  const { data, error } = await supabaseAdmin
    .from("events")
    .select("id,title,description,location,start_date,end_date,attendance_enabled,is_active,type,image_url,qr_token,warta_url,liturgi_url")
    .order("start_date", { ascending: true });

  if (error) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", events: data ?? [] });
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse("Admin access required");

    const body = await req.json();
    const { title, description, theme, speaker, location, start_date, end_date, attendance_enabled, is_active, type, image_url, warta_url, liturgi_url, repeat_weekly } = body;

    if (!title || !start_date) {
      return NextResponse.json({ status: "error", message: "Title and start_date are required." }, { status: 400 });
    }
    if (end_date && new Date(end_date) <= new Date(start_date)) {
      return NextResponse.json({ status: "error", message: "Waktu selesai harus setelah waktu mulai." }, { status: 400 });
    }

    const isRecurringWeekly = repeat_weekly !== undefined
      ? Boolean(repeat_weekly)
      : /recurring_weekly\s*:\s*(true|1|yes)/i.test(String(description ?? ""));

    const metadataParts = [
      theme?.trim() ? `Tema: ${theme.trim()}` : null,
      speaker?.trim() ? `Pembawa Firman: ${speaker.trim()}` : null,
      isRecurringWeekly ? "recurring_weekly: true" : null,
    ].filter(Boolean);

    const safeDescription = [cleanDescription(description), ...metadataParts].filter(Boolean).join(" | ");

    const { data, error } = await supabaseAdmin.from("events").insert([{
      title,
      description: safeDescription || null,
      location,
      start_date,
      end_date,
      attendance_enabled: Boolean(attendance_enabled),
      is_active: is_active !== false,
      type: type || "lainnya",
      image_url,
      warta_url:  warta_url  || null,
      liturgi_url: liturgi_url || null,
    }]).select("id,title");

    if (error) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }

    await logAuditAction({
      actorId: admin.id,
      actorEmail: admin.email,
      entityType: "event",
      entityId: data?.[0]?.id ?? null,
      action: "created",
      details: { title, start_date, location: location ?? null },
    });
    revalidatePath("/");
    revalidatePath("/events");

    return NextResponse.json({ status: "ok", event: data?.[0] ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse("Admin access required");

    const body = await req.json();
    const { id, title, description, theme, speaker, location, start_date, end_date, attendance_enabled, is_active, type, image_url, warta_url, liturgi_url, repeat_weekly } = body;

    if (!id) {
      return NextResponse.json({ status: "error", message: "Event ID is required." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;

    if (description !== undefined || theme !== undefined || speaker !== undefined || repeat_weekly !== undefined) {
      const isRecurringWeekly = repeat_weekly !== undefined
        ? Boolean(repeat_weekly)
        : /recurring_weekly\s*:\s*(true|1|yes)/i.test(String(description ?? ""));
      const metadataParts = [
        cleanDescription(description),
        theme?.trim() ? `Tema: ${theme.trim()}` : null,
        speaker?.trim() ? `Pembawa Firman: ${speaker.trim()}` : null,
        isRecurringWeekly ? "recurring_weekly: true" : null,
      ].filter(Boolean);
      updateData.description = metadataParts.length ? metadataParts.join(" | ") : null;
    }

    if (location !== undefined) updateData.location = location;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (start_date !== undefined && end_date && new Date(end_date) <= new Date(start_date)) {
      return NextResponse.json({ status: "error", message: "Waktu selesai harus setelah waktu mulai." }, { status: 400 });
    }
    if (attendance_enabled !== undefined) updateData.attendance_enabled = Boolean(attendance_enabled);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (type !== undefined) updateData.type = type || "lainnya";
    if (image_url !== undefined) updateData.image_url = image_url;
    if (warta_url !== undefined) updateData.warta_url = warta_url || null;
    if (liturgi_url !== undefined) updateData.liturgi_url = liturgi_url || null;

    const { data, error } = await supabaseAdmin
      .from("events")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }

    await logAuditAction({
      actorId: admin.id,
      actorEmail: admin.email,
      entityType: "event",
      entityId: id,
      action: "updated",
      details: { changes: updateData },
    });
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath(`/events/${id}`);

    return NextResponse.json({ status: "ok", event: data?.[0] ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse("Admin access required");

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ status: "error", message: "Event ID is required." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("events").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }

    await logAuditAction({
      actorId: admin.id,
      actorEmail: admin.email,
      entityType: "event",
      entityId: id,
      action: "deleted",
      details: { deleted_event_id: id },
    });
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath(`/events/${id}`);

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
