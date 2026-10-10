import { NextResponse } from "next/server";
import { getProfileFromRequest } from "lib/auth";
import { createAttendanceQrToken } from "lib/attendanceToken";
import { supabaseAdmin } from "lib/supabaseAdmin";

export async function GET(request: Request) {
  const profile = await getProfileFromRequest();
  if (!profile) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const eventId = new URL(request.url).searchParams.get("event_id")?.trim();
  if (!eventId) return NextResponse.json({ error: "event_id is required." }, { status: 400 });

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .select("id, attendance_enabled, is_active")
    .eq("id", eventId)
    .eq("is_active", true)
    .eq("attendance_enabled", true)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Unable to load event." }, { status: 500 });
  if (!event) return NextResponse.json({ error: "Event not found or attendance is disabled." }, { status: 404 });

  return NextResponse.json({
    status: "ok",
    token: createAttendanceQrToken(event.id, profile.id),
    expires_in: 90,
  });
}
