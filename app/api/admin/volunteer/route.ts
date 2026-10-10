import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse("Admin access required");

  const [posResult, assignResult] = await Promise.all([
    supabaseAdmin
      .from("volunteer_positions")
      .select("id, title, department, description, slots, is_open, image_url")
      .order("department"),
    supabaseAdmin
      .from("volunteer_assignments")
      .select("id, position_id, full_name, email, phone, motivation, status, notes, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    status: "ok",
    positions: posResult.data ?? [],
    assignments: assignResult.data ?? [],
  });
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse("Admin access required");

    const body = await req.json();
    const { title, department, description, slots, image_url } = body;

    if (!title || !department) {
      return NextResponse.json({ error: "Title and department are required." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("volunteer_positions")
      .insert([{
        title,
        department,
        description: description || null,
        slots: slots || 1,
        is_open: true,
        image_url: image_url || null,
      }])
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ status: "ok", position: data?.[0] ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse("Admin access required");

    const body = await req.json();
    const { type, id, ...fields } = body;

    if (!id) return NextResponse.json({ error: "ID is required." }, { status: 400 });

    // type: "position" | "assignment"
    if (type === "position") {
      const allowed = ["title", "department", "description", "slots", "is_open", "image_url"];
      const update: Record<string, unknown> = {};
      for (const key of allowed) {
        if (key in fields) update[key] = fields[key];
      }
      const { error } = await supabaseAdmin.from("volunteer_positions").update(update).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (type === "assignment") {
      const allowed = ["status", "notes"];
      const update: Record<string, unknown> = {};
      for (const key of allowed) {
        if (key in fields) update[key] = fields[key];
      }
      const { error } = await supabaseAdmin.from("volunteer_assignments").update(update).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: "Invalid type." }, { status: 400 });
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse("Admin access required");

    const { id, type } = await req.json();
    if (!id) return NextResponse.json({ error: "ID is required." }, { status: 400 });

    const table = type === "assignment" ? "volunteer_assignments" : "volunteer_positions";
    const { error } = await supabaseAdmin.from(table).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
