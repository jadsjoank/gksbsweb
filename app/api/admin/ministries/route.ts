/**
 * /api/admin/ministries — legacy redirect shim
 *
 * The canonical volunteer positions API is /api/admin/volunteer.
 * This file is kept for backwards compat but delegates all logic there.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin, unauthorizedResponse } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse("Admin access required");

  const { data, error } = await supabaseAdmin
    .from("volunteer_positions")
    .select("id, title, department, description, slots, is_open, image_url")
    .order("department", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return under both keys so any old client code still works
  return NextResponse.json({ status: "ok", volunteer_positions: data ?? [], ministries: data ?? [] });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse("Admin access required");

  try {
    const body = await req.json();
    // Support both old field names (name) and new (title)
    const title = body.title || body.name;
    const { department, description, image_url, slots } = body;

    if (!title || !department) {
      return NextResponse.json({ error: "Nama/title dan departemen wajib diisi." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("volunteer_positions")
      .insert([{
        title,
        department,
        description: description || null,
        image_url: image_url || null,
        slots: slots || 1,
        is_open: true,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/ministries");

    return NextResponse.json({ status: "ok", ministry: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse("Admin access required");

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID is required." }, { status: 400 });

    const { error } = await supabaseAdmin.from("volunteer_positions").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/ministries");

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
