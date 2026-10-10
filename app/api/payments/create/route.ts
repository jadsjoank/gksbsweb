import { NextResponse } from "next/server";
import { getProfileFromRequest } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";
import midtransClient from "midtrans-client";

/**
 * POST /api/payments/create
 *
 * Creates a Midtrans Snap transaction and returns the snap_token.
 * Flow:
 *   1. Authenticate user
 *   2. Validate input
 *   3. INSERT donation record (status: pending)
 *   4. Call Midtrans Snap API to create transaction
 *   5. Return snap_token to client for snap.pay() popup
 */

function getSnap() {
  return new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_ENVIRONMENT === "production",
    serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
  });
}

const VALID_TYPES = [
  "persembahan",
  "persepuluhan",
  "diakonia",
  "pembangunan",
  "misi",
  "lainnya",
] as const;

export async function POST(req: Request) {
  if (process.env.MIDTRANS_ECOMMERCE_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Pembayaran Midtrans untuk e-commerce belum diaktifkan." },
      { status: 503 },
    );
  }

  const profile = await getProfileFromRequest();

  const body = await req.json();
  if (body.purpose !== "ecommerce") {
    return NextResponse.json(
      { error: "Midtrans hanya dapat digunakan untuk transaksi e-commerce." },
      { status: 403 },
    );
  }
  const { amount, type, donor_name, donor_email, donor_phone, notes } = body;

  // Validate amount — must be positive integer, minimum Rp 1.000, maximum Rp 100.000.000
  if (
    !amount ||
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    amount < 1000 ||
    amount > 100_000_000
  ) {
    return NextResponse.json(
      { error: "Jumlah donasi harus antara Rp 1.000 dan Rp 100.000.000." },
      { status: 400 }
    );
  }

  // Validate type
  const donationType = VALID_TYPES.includes(type) ? type : "persembahan";

  // Generate unique order ID
  const order_id = `DON-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  // Insert donation record (pending)
  const { error: insertError } = await supabaseAdmin
    .from("donations")
    .insert([
      {
        profile_id: profile?.id ?? null,
        order_id,
        amount,
        type: donationType,
        status: "pending",
        donor_name: donor_name ?? profile?.full_name ?? "Guest",
        donor_email: donor_email ?? profile?.email ?? "",
        donor_phone: donor_phone ?? "",
        notes: notes ?? "",
      },
    ]);

  if (insertError) {
    return NextResponse.json(
      { error: `Database error: ${insertError.message}` },
      { status: 500 }
    );
  }

  // Create Midtrans Snap transaction
  try {
    const transaction = await getSnap().createTransaction({
      transaction_details: {
        order_id,
        gross_amount: amount,
      },
      customer_details: {
        first_name: donor_name ?? "Guest",
        email: donor_email ?? "",
        phone: donor_phone ?? "",
      },
      item_details: [
        {
          id: donationType,
          price: amount,
          quantity: 1,
          name: `Donasi ${donationType}`,
        },
      ],
    });

    return NextResponse.json({
      status: "ok",
      order_id,
      snap_token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (midtransError) {
    const errMsg =
      midtransError instanceof Error
        ? midtransError.message
        : "Midtrans API error";
    const { error: statusError } = await supabaseAdmin
      .from("donations")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", order_id)
      .eq("status", "pending");

    if (statusError) {
      console.error("Failed to mark donation payment creation as failed:", statusError.message);
    }

    return NextResponse.json(
      { error: `Payment creation failed: ${errMsg}` },
      { status: 502 }
    );
  }
}
