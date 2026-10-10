import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { matchesFileSignature } from "lib/fileValidation";

const BUCKET    = "event-documents";
const MAX_MB    = 10;

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse("Admin access required");

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "doc"; // "warta" | "liturgi"

    if (!file) return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Hanya file PDF." }, { status: 400 });
    if (file.size > MAX_MB * 1024 * 1024) return NextResponse.json({ error: `Maks ${MAX_MB}MB.` }, { status: 400 });

    const fileName = `${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesFileSignature(buffer, "application/pdf")) {
      return NextResponse.json({ error: "Isi file tidak sesuai dengan tipe PDF." }, { status: 400 });
    }

    // Ensure bucket exists (public)
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, buffer, { contentType: "application/pdf", upsert: false });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);
    return NextResponse.json({ status: "ok", url: data.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
