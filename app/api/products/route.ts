import { NextResponse } from "next/server";
import { supabaseAdmin } from "lib/supabaseAdmin";

function normalizeImageUrl(value: unknown) {
  if (Array.isArray(value)) return value[0] ?? null;
  if (typeof value === "string") return value || null;
  return value ?? null;
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id,name,description,price,image_url,stock,is_active,created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    products: (data ?? []).map((product) => ({
      ...product,
      image_url: normalizeImageUrl(product.image_url),
    })),
  });
}
