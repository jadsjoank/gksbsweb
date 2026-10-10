import { NextResponse } from "next/server";
import { getProfileFromRequest } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";

export async function GET() {
  const profile = await getProfileFromRequest();

  if (!profile) {
    return NextResponse.json(
      { status: "unauthorized", message: "Authentication required." },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("donations")
    .select("id, order_id, amount, type, status, donor_name, donor_email, donor_phone, notes, payment_method, created_at, paid_at")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: "ok", donations: data ?? [] });
}

export async function POST(req: Request) {
  try {
    const profile = await getProfileFromRequest();
    const body = await req.json();
    const { amount, donor_name, donor_email, donor_phone, notes } = body;

    if (!Number.isInteger(amount) || amount < 1000 || amount > 100_000_000) {
      return NextResponse.json(
        { error: "Jumlah kolekte harus antara Rp 1.000 dan Rp 100.000.000." },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin.from("donations").insert([{
      profile_id: profile?.id ?? null,
      order_id: `QRIS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      amount,
      type: "lainnya",
      status: "pending",
      payment_method: "QRIS",
      donor_name: donor_name || profile?.full_name || "Guest",
      donor_email: donor_email || profile?.email || "",
      donor_phone: donor_phone || "",
      notes: notes || "",
    }]);

    if (error) {
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Permintaan kolekte tidak valid." }, { status: 400 });
  }
}
