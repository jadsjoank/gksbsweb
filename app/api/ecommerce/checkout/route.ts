import { NextResponse } from "next/server";
import { getProfileFromRequest } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";
import midtransClient from "midtrans-client";

export async function POST(req: Request) {
  if (process.env.MIDTRANS_ECOMMERCE_ENABLED !== "true") {
    return NextResponse.json({ error: "Pembayaran e-commerce belum diaktifkan." }, { status: 503 });
  }

  try {
    const profile = await getProfileFromRequest();
    const { product_id, quantity } = await req.json();
    if (!product_id || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return NextResponse.json({ error: "Produk dan jumlah pembelian tidak valid." }, { status: 400 });
    }

    const { data: reservedProducts, error: reserveError } = await supabaseAdmin.rpc("reserve_product_stock", {
      p_product_id: product_id,
      p_quantity: quantity,
    });

    if (reserveError) {
      console.error("Failed to reserve product stock:", reserveError.message);
      return NextResponse.json({ error: "Checkout sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
    }

    const product = reservedProducts?.[0];
    if (!product) return NextResponse.json({ error: "Produk tidak ditemukan atau stok produk tidak mencukupi." }, { status: 400 });

    const order_id = `ECOM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const amount = Number(product.price) * quantity;
    const { error: orderError } = await supabaseAdmin.from("ecommerce_orders").insert([{
      order_id, profile_id: profile?.id ?? null, product_id, quantity, amount, status: "pending",
    }]);
    if (orderError) {
      await supabaseAdmin.rpc("release_product_stock", {
        p_product_id: product_id,
        p_quantity: quantity,
      });
      return NextResponse.json({ error: `Database error: ${orderError.message}` }, { status: 500 });
    }

    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_ENVIRONMENT === "production",
      serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
      clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
    });
    let transaction;
    try {
      transaction = await snap.createTransaction({
        transaction_details: { order_id, gross_amount: amount },
        item_details: [{ id: product.id, name: product.name, price: Number(product.price), quantity }],
      });
    } catch (error) {
      await supabaseAdmin.rpc("release_product_stock", {
        p_product_id: product_id,
        p_quantity: quantity,
      });
      await supabaseAdmin
        .from("ecommerce_orders")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("order_id", order_id)
        .eq("status", "pending");
      throw error;
    }

    return NextResponse.json({ status: "ok", order_id, snap_token: transaction.token, redirect_url: transaction.redirect_url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout gagal." }, { status: 502 });
  }
}
