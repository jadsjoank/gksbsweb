import { NextResponse } from "next/server";
import { supabaseAdmin } from "lib/supabaseAdmin";

export async function GET() {
    const { data, error } = await supabaseAdmin
        .from("volunteer_positions")
        .select("name,department,description,leader_name,meeting_schedule,image_url,is_open")
        .order("name", { ascending: true });

    if (error) {
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "ok", volunteer_positions: data ?? [] });
}
