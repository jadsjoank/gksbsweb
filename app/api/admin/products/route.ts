import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireRoles, unauthorizedResponse } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { logAuditAction } from "lib/audit";

function normalizeImageUrl(value: unknown) {
  if (Array.isArray(value)) return value[0] ?? null;
  if (typeof value === "string") return value || null;
  return value ?? null;
}

export async function GET() {
  const seller = await requireRoles(["Admin", "Seller"]);
  if (!seller) return unauthorizedResponse("Seller access required");

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id,name,description,price,image_url,stock,is_active,created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    products: (data ?? []).map((product) => ({
      ...product,
      image_url: normalizeImageUrl(product.image_url),
    })),
  });
}

export async function POST(req: Request) {
  const seller = await requireRoles(["Admin", "Seller"]);
  if (!seller) return unauthorizedResponse("Seller access required");

  const body = await req.json();
  const { name, description, price, image_url, stock, is_active } = body;
  if (!name || !Number.isInteger(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
    return NextResponse.json({ error: "Nama, harga, dan stok harus valid." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.from("products").insert([{
    name,
    description: description || null,
    price,
    image_url: normalizeImageUrl(image_url),
    stock,
    is_active: is_active !== false,
  }]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction({
    actorId: seller.id,
    actorEmail: seller.email,
    entityType: "product",
    entityId: data?.id ?? null,
    action: "created",
    details: { name, price, stock },
  });
  revalidatePath("/ecommerce");

  return NextResponse.json({ product: data }, { status: 201 });
}

export async function PUT(req: Request) {
  const seller = await requireRoles(["Admin", "Seller"]);
  if (!seller) return unauthorizedResponse("Seller access required");

  const body = await req.json();
  const { id, name, description, price, image_url, stock, is_active } = body;
  if (!id) return NextResponse.json({ error: "Product ID wajib diisi." }, { status: 400 });
  if (price !== undefined && (!Number.isInteger(price) || price < 0)) {
    return NextResponse.json({ error: "Harga harus valid." }, { status: 400 });
  }
  if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
    return NextResponse.json({ error: "Stok harus valid." }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  for (const field of ["name", "description", "price", "image_url", "stock", "is_active"]) {
    if (body[field] !== undefined) {
      updateData[field] = field === "image_url" ? normalizeImageUrl(body[field]) : body[field];
    }
  }
  const { data, error } = await supabaseAdmin.from("products").update(updateData).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction({
    actorId: seller.id,
    actorEmail: seller.email,
    entityType: "product",
    entityId: id,
    action: "updated",
    details: { changes: updateData },
  });
  revalidatePath("/ecommerce");

  return NextResponse.json({ product: data });
}

export async function DELETE(req: Request) {
  const seller = await requireRoles(["Admin", "Seller"]);
  if (!seller) return unauthorizedResponse("Seller access required");
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Product ID wajib diisi." }, { status: 400 });

  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction({
    actorId: seller.id,
    actorEmail: seller.email,
    entityType: "product",
    entityId: id,
    action: "deleted",
    details: { deleted_product_id: id },
  });
  revalidatePath("/ecommerce");

  return NextResponse.json({ status: "ok" });
}
