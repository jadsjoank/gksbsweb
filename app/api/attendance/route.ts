import { NextResponse } from "next/server";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { getProfileFromRequest, requireRoles } from "lib/auth";
import { verifyAttendanceQrToken } from "lib/attendanceToken";
import { rateLimit } from "lib/rateLimit";
import { guestAttendanceSchema } from "lib/validation/public";

const guestAttendanceRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 5 });

export async function GET() {
  // Must be authenticated to view attendance records
  const profile = await getProfileFromRequest();
  if (!profile) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  // Non-admins can only see their own attendance
  let query = supabaseAdmin
    .from("attendance")
    .select("id, event_id, profile_id, guest_name, method, checked_in_at")
    .order("checked_in_at", { ascending: false })
    .limit(100);

  if (profile.role !== "Admin") {
    query = query.eq("profile_id", profile.id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", records: data ?? [] });
}

/**
 * POST /api/attendance
 * Record attendance for an event.
 *
 * Body:
 *   event_id: string — the event to attend
 *   profile_id?: string — if logged in user
 *   guest_name?: string — if guest
 *   guest_email?: string — if guest
 *   guest_phone?: string — if guest
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event_id, profile_id, guest_name, guest_email, guest_phone, qr_token } = body;
    const requester = await getProfileFromRequest();
    const isQrScan = typeof qr_token === "string" && qr_token.trim().length > 0;

    if (!event_id) {
      return NextResponse.json({ error: "event_id is required." }, { status: 400 });
    }

    if (profile_id && !requester && !isQrScan) {
      return NextResponse.json({ error: "Authentication required to record member attendance." }, { status: 401 });
    }

    let qrPayload: ReturnType<typeof verifyAttendanceQrToken> = null;
    if (isQrScan) {
      const operator = await requireRoles(["Admin", "Bendahara"]);
      if (!operator) return NextResponse.json({ error: "Attendance officer access required." }, { status: 403 });
      qrPayload = verifyAttendanceQrToken(qr_token);
      if (!qrPayload || qrPayload.event_id !== event_id) {
        return NextResponse.json({ error: "Invalid or expired attendance QR token." }, { status: 401 });
      }
    } else if (requester) {
      return NextResponse.json({ error: "Member self check-in is not available. Show your QR to an attendance officer." }, { status: 403 });
    }

    const attendanceProfileId = qrPayload?.profile_id ?? null;

    if (!requester) {
      const limit = await guestAttendanceRateLimit(req);
      if (limit.error) {
        return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
      }
      if (!limit.ok) {
        return NextResponse.json({ error: "Terlalu banyak percobaan attendance. Coba lagi nanti." }, { status: 429 });
      }

      const validation = guestAttendanceSchema.safeParse({
        event_id,
        guest_name,
        guest_email,
        guest_phone,
      });
      if (!validation.success) {
        return NextResponse.json({ error: "Data tamu tidak valid." }, { status: 422 });
      }
    }

    const { data: event } = await supabaseAdmin
      .from("events")
      .select("id, title, attendance_enabled, is_active, start_date, end_date")
      .eq("id", event_id)
      .eq("is_active", true)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    if (!event.attendance_enabled) {
      return NextResponse.json({ error: "Attendance is not enabled for this event." }, { status: 400 });
    }

    if (attendanceProfileId) {
      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", attendanceProfileId)
        .maybeSingle();
      if (!targetProfile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    // Check time window: from start to end+45min
    const now = new Date();
    const start = new Date(event.start_date);
    const end = event.end_date
      ? new Date(event.end_date)
      : new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const graceEnd = new Date(end.getTime() + 45 * 60 * 1000);

    if (now < start || now > graceEnd) {
      return NextResponse.json(
        { error: "Attendance window is not active. QR is available from event start until 45 minutes after it ends." },
        { status: 400 }
      );
    }

    // Check for duplicate attendance
    if (attendanceProfileId) {
      const { data: existing } = await supabaseAdmin
        .from("attendance")
        .select("id")
        .eq("event_id", event_id)
        .eq("profile_id", attendanceProfileId)
        .limit(1)
        .single();

      if (existing) {
        return NextResponse.json({ error: "You have already recorded attendance for this event." }, { status: 409 });
      }
    }

    // Insert attendance record
    const method = attendanceProfileId ? "qr" : "form";
    const { data, error } = await supabaseAdmin
      .from("attendance")
      .insert([{
        event_id,
        profile_id: attendanceProfileId,
        guest_name: guest_name || null,
        guest_email: guest_email || null,
        guest_phone: guest_phone || null,
        method,
      }])
      .select();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "You have already recorded attendance for this event." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: "ok",
      message: "Attendance recorded successfully.",
      attendance: data?.[0] ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
