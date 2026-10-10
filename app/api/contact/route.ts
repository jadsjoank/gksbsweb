import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { rateLimit } from "lib/rateLimit";
import { contactMessageSchema } from "lib/validation/public";

const contactRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 5 });

/** Strips HTML tags and trims whitespace to prevent stored XSS */
function sanitize(str: unknown, maxLen = 1000): string {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse("Admin access required");

    const { data: messages, error } = await supabaseAdmin
      .from("contact_messages")
      .select("id, name, email, subject, message, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "ok", messages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const limit = await contactRateLimit(req);
    if (limit.error) {
      return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
    }
    if (!limit.ok) {
      return NextResponse.json({ error: "Terlalu banyak pesan. Coba lagi nanti." }, { status: 429 });
    }

    const validation = contactMessageSchema.safeParse(await req.json());
    if (!validation.success) {
      return NextResponse.json({ error: "Nama, email, subjek, dan pesan wajib diisi dengan benar." }, { status: 422 });
    }

    const { name, email, subject, message } = validation.data;
    const { error: insertError } = await supabaseAdmin
      .from("contact_messages")
      .insert([{ name, email, subject, message, is_public: true }]);

    if (insertError) {
      if (insertError.message.includes("relation") && insertError.message.includes("does not exist")) {
        return NextResponse.json(
          { error: "Tabel 'contact_messages' belum dibuat. Jalankan update_schema.sql di Supabase SQL Editor." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: "Gagal menyimpan pesan." }, { status: 500 });
    }

    return NextResponse.json({ status: "ok", message: "Pesan berhasil disimpan." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
