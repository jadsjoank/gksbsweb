import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { matchesFileSignature } from "lib/fileValidation";

const BUCKET = "product-images";
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse("Admin access required");

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Hanya file JPG, PNG, WebP, atau GIF yang diizinkan." }, { status: 400 });
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Ukuran file maksimal ${MAX_SIZE_MB}MB.` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesFileSignature(buffer, file.type)) {
      return NextResponse.json({ error: "Isi file tidak sesuai dengan tipe file yang diklaim." }, { status: 400 });
    }

    const extension = file.type.split("/")[1].replace("jpeg", "jpg");
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);
    return NextResponse.json({ status: "ok", url: data.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}