import { NextResponse } from "next/server";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { createHash } from "crypto";

/**
 * POST /api/payments/webhook
 *
 * Receives Midtrans payment notifications.
 * Security: Verifies SHA512 signature before processing.
 *
 * Flow:
 *   1. Parse notification body
 *   2. Verify SHA512(order_id + status_code + gross_amount + server_key)
 *   3. Map Midtrans transaction_status → our donation status
 *   4. UPDATE donations table
 *   5. Insert notification for donor (if registered user)
 *   6. Return 200 to acknowledge receipt
 *
 * IMPORTANT: This endpoint is called by Midtrans servers, NOT by users.
 * Register this URL in Midtrans Dashboard → Settings → Notification URL.
 */

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";

// Map Midtrans transaction_status to our donation status
function mapTransactionStatus(midtransStatus: string): string | null {
  switch (midtransStatus) {
    case "capture":
    case "settlement":
      return "paid";
    case "deny":
    case "failure":
    case "cancel":
      return "failed";
    case "pending":
      return "pending";
    case "expire":
      return "expired";
    case "refund":
    case "partial_refund":
      return "refunded";
    default:
      return null;
  }
}

export async function POST(req: Request) {
  const body = await req.json();

  const {
    order_id,
    transaction_status,
    fraud_status,
    status_code,
    gross_amount,
    transaction_id,
    payment_type,
    va_number,
    bank,
  } = body;

  if (!order_id || !status_code || !gross_amount) {
    return NextResponse.json(
      { error: "Missing required notification fields." },
      { status: 400 }
    );
  }

  // === SECURITY: Verify SHA512 signature ===
  // Signature = SHA512(order_id + status_code + gross_amount + server_key)
  const signaturePayload =
    order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY;
  const expectedSignature = createHash("sha512")
    .update(signaturePayload)
    .digest("hex");

  if (expectedSignature !== body.signature) {
    return NextResponse.json(
      { error: "Invalid signature. Request rejected." },
      { status: 400 }
    );
  }

  let finalStatus = mapTransactionStatus(transaction_status);
  if (!finalStatus) {
    return NextResponse.json(
      { error: "Unsupported payment status." },
      { status: 400 }
    );
  }

  const isEcommerceOrder = order_id.startsWith("ECOM-");
  const notificationKey = `${order_id}:${transaction_id ?? `${transaction_status ?? "unknown"}:${status_code}`}`;

  const { error: processedError } = await supabaseAdmin.from("processed_webhooks").insert([
    {
      webhook_key: notificationKey,
      order_id,
      transaction_id: transaction_id ?? null,
      status: transaction_status ?? "unknown",
      processing_status: "processing",
      created_at: new Date().toISOString(),
    },
  ]);

  if (processedError && processedError.code !== "23505") {
    console.error("Failed to claim payment webhook:", processedError.message);
    return NextResponse.json(
      { error: "Unable to process payment notification." },
      { status: 503 }
    );
  }

  if (processedError && processedError.code === "23505") {
    const { data: existingWebhook, error: existingWebhookError } = await supabaseAdmin
      .from("processed_webhooks")
      .select("processing_status, created_at")
      .eq("webhook_key", notificationKey)
      .maybeSingle();

    if (existingWebhookError) {
      console.error("Failed to inspect payment webhook state:", existingWebhookError.message);
      return NextResponse.json(
        { error: "Unable to verify payment notification state." },
        { status: 503 }
      );
    }

    if (existingWebhook?.processing_status === "completed") {
      return NextResponse.json({ status: "ok", duplicate: true });
    }

    const processingStartedAt = existingWebhook?.created_at
      ? new Date(existingWebhook.created_at).getTime()
      : 0;
    const staleBefore = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    if (processingStartedAt > Date.now() - 5 * 60 * 1000) {
      return NextResponse.json({ status: "retry", processing: true }, { status: 202 });
    }

    const { data: reclaimedWebhook, error: reclaimError } = await supabaseAdmin
      .from("processed_webhooks")
      .update({
        processing_status: "processing",
        created_at: new Date().toISOString(),
      })
      .eq("webhook_key", notificationKey)
      .eq("processing_status", "processing")
      .lt("created_at", staleBefore)
      .select("webhook_key")
      .maybeSingle();

    if (reclaimError) {
      console.error("Failed to reclaim stale payment webhook:", reclaimError.message);
      return NextResponse.json(
        { error: "Unable to reclaim payment notification." },
        { status: 503 }
      );
    }

    if (!reclaimedWebhook) {
      return NextResponse.json({ status: "retry", processing: true }, { status: 202 });
    }
  }

  if (transaction_status === "capture" && fraud_status === "challenge") {
    finalStatus = "pending";
  }

  const paidAt = finalStatus === "paid" ? new Date().toISOString() : null;

  const ecommercePayment = isEcommerceOrder
    ? await supabaseAdmin.rpc("apply_ecommerce_payment_status", {
        p_order_id: order_id,
        p_status: finalStatus,
        p_transaction_id: transaction_id ?? null,
        p_payment_method: bank ?? payment_type ?? null,
      })
    : await supabaseAdmin.rpc("apply_donation_payment_status", {
        p_order_id: order_id,
        p_status: finalStatus,
        p_transaction_id: transaction_id ?? null,
        p_payment_method: bank ?? payment_type ?? null,
        p_payment_type: payment_type ?? null,
        p_paid_at: paidAt,
      });

  const updatedPayment = ecommercePayment.data;
  const updateError = ecommercePayment.error;

  if (updateError || !updatedPayment?.length) {
    console.error(
      "Failed to update payment from webhook:",
      updateError?.message ?? `No payment found for order ${order_id}`
    );
    return NextResponse.json(
      { error: "Payment notification could not be applied." },
      { status: 503 }
    );
  }

  // === Insert notification for kolekte donor (if registered user) ===
  if (finalStatus === "paid" && !isEcommerceOrder) {
    const { data: donation } = await supabaseAdmin
      .from("donations")
      .select("profile_id, donor_name, amount")
      .eq("order_id", order_id)
      .single();

    if (donation?.profile_id) {
      const { data: existingNotification, error: notificationLookupError } = await supabaseAdmin
        .from("notifications")
        .select("id")
        .eq("profile_id", donation.profile_id)
        .filter("metadata->>order_id", "eq", order_id)
        .limit(1)
        .maybeSingle();

      if (notificationLookupError) {
        console.error("Failed to check existing donation notification:", notificationLookupError.message);
        return NextResponse.json(
          { error: "Payment notification could not be completed." },
          { status: 503 }
        );
      } else if (!existingNotification) {
        const { error: notificationError } = await supabaseAdmin.from("notifications").insert([
          {
            profile_id: donation.profile_id,
            title: "Donasi Berhasil",
            body: `Terima kasih ${donation.donor_name ?? ""}, donasi Anda sebesar Rp ${Number(donation.amount).toLocaleString("id-ID")} telah diterima.`,
            type: "payment",
            metadata: { order_id, amount: donation.amount },
          },
        ]);

        if (notificationError) {
          console.error("Donation notification failed:", notificationError.message);
          return NextResponse.json(
            { error: "Payment notification could not be completed." },
            { status: 503 }
          );
        }
      }
    }
  }

  if (!isEcommerceOrder) {
    const { data: donation } = await supabaseAdmin
      .from("donations")
      .select("id, profile_id, donor_name, status")
      .eq("order_id", order_id)
      .single();

    if (donation) {
      const actorEmail = donation.donor_name ?? "midtrans-webhook";
      const { error: auditError } = await supabaseAdmin.from("audit_logs").insert([
        {
          actor_id: donation.profile_id ?? null,
          actor_email: actorEmail,
          entity_type: "donation",
          entity_id: donation.id,
          action: "status_updated",
          details: {
            order_id,
            transaction_id: transaction_id ?? null,
            status: finalStatus,
            previous_status: donation.status,
          },
          created_at: new Date().toISOString(),
        },
      ]);
      if (auditError) {
        console.warn("Donation audit log failed:", auditError.message);
      }
    }
  }

  const { error: completionError } = await supabaseAdmin
    .from("processed_webhooks")
    .update({
      processing_status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("webhook_key", notificationKey);

  if (completionError) {
    console.error("Failed to mark payment webhook completed:", completionError.message);
    return NextResponse.json(
      { error: "Payment notification completion could not be recorded." },
      { status: 503 }
    );
  }

  return NextResponse.json({ status: "ok" });
}
