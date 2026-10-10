import { NextResponse } from "next/server";
import { supabaseAdmin } from "lib/supabaseAdmin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { status: "error", message: "Event ID is required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("events")
    .select("id,title,description,location,start_date,end_date,attendance_enabled,image_url,type,warta_url,liturgi_url,is_active")
    .eq("is_active", true)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { status: "error", message: "Event not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ status: "ok", event: data });
}
