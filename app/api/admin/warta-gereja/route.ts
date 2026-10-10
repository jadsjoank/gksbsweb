import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireRoles, unauthorizedResponse } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";

export async function GET() {
  const editor = await requireRoles(["Admin", "Penulis"]);
  if (!editor) return unauthorizedResponse("Writer access required");

  const { data, error } = await supabaseAdmin
    .from("church_news")
    .select("id,title,narration,image_url,is_published,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  return NextResponse.json({ status: "ok", news: data ?? [] });
}

export async function POST(req: Request) {
  const editor = await requireRoles(["Admin", "Penulis"]);
  if (!editor) return unauthorizedResponse("Writer access required");

  try {
    const { title, narration, image_url, is_published } = await req.json();
    if (!title?.trim() || !narration?.trim()) {
      return NextResponse.json({ status: "error", message: "Judul dan narasi wajib diisi." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("church_news")
      .insert({ title: title.trim(), narration: narration.trim(), image_url: image_url || null, is_published: is_published !== false })
      .select()
      .single();

    if (error) return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    revalidatePath("/");
    revalidatePath("/warta-gereja");
    return NextResponse.json({ status: "ok", news: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const editor = await requireRoles(["Admin", "Penulis"]);
  if (!editor) return unauthorizedResponse("Writer access required");

  try {
    const { id, title, narration, image_url, is_published } = await req.json();
    if (!id) return NextResponse.json({ status: "error", message: "ID warta wajib diisi." }, { status: 400 });

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title.trim();
    if (narration !== undefined) updateData.narration = narration.trim();
    if (image_url !== undefined) updateData.image_url = image_url || null;
    if (is_published !== undefined) updateData.is_published = Boolean(is_published);

    const { data, error } = await supabaseAdmin.from("church_news").update(updateData).eq("id", id).select().single();
    if (error) return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    revalidatePath("/");
    revalidatePath("/warta-gereja");
    revalidatePath(`/warta-gereja/${id}`);
    return NextResponse.json({ status: "ok", news: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const editor = await requireRoles(["Admin", "Penulis"]);
  if (!editor) return unauthorizedResponse("Writer access required");

  const { id } = await req.json();
  if (!id) return NextResponse.json({ status: "error", message: "ID warta wajib diisi." }, { status: 400 });

  const { error } = await supabaseAdmin.from("church_news").delete().eq("id", id);
  if (error) return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/warta-gereja");
  revalidatePath(`/warta-gereja/${id}`);
  return NextResponse.json({ status: "ok" });
}
