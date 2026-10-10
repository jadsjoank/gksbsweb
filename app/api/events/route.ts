import { NextResponse } from "next/server";
import { supabaseAdmin } from "lib/supabaseAdmin";

export async function GET() {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("id,title,description,location,start_date,end_date,attendance_enabled,image_url,type")
    .eq("is_active", true)
    .or(`end_date.gte.${now},and(end_date.is.null,start_date.gte.${now})`)
    .order("start_date", { ascending: true });

  if (error) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", events: data ?? [] });
}
