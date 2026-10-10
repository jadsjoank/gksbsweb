import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse("Admin access required");

  // Aggregate report data: total users, events, donations, attendance
  const [usersResult, eventsResult, donationsResult] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("donations").select("id, amount, status", { count: "exact" }),
  ]);

  if (usersResult.error || eventsResult.error || donationsResult.error) {
    const errMsg =
      usersResult.error?.message ??
      eventsResult.error?.message ??
      donationsResult.error?.message ??
      "Unknown error";
    return NextResponse.json(
      { status: "error", message: errMsg },
      { status: 500 }
    );
  }

  const donations = donationsResult.data ?? [];
  const totalRevenue = donations
    .filter((d) => d.status === "paid")
    .reduce((sum, d) => sum + Number(d.amount), 0);

  return NextResponse.json({
    status: "ok",
    reports: {
      totalUsers: usersResult.count ?? 0,
      totalEvents: eventsResult.count ?? 0,
      totalDonations: donationsResult.count ?? 0,
      totalRevenue,
    },
  });
}
